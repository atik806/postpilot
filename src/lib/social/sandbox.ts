import "server-only";
import { randomUUID } from "node:crypto";
import type { Platform, SocialAccountStatus } from "@/types";
import { PLATFORM_META } from "@/lib/constants";
import { errors } from "@/lib/errors";
import { CAPABILITIES } from "./capabilities";
import type {
  ConnectedAccount,
  OAuthCallbackParams,
  OAuthUrlParams,
  PublishAccount,
  PublishInput,
  PublishResult,
  SocialProvider,
} from "./types";

/**
 * SANDBOX provider — used whenever a platform has no OAuth credentials
 * configured. It simulates the full connect → publish lifecycle so PostPilot
 * works end-to-end in development, but every result it produces is explicitly
 * tagged `isSandbox: true` and post ids are prefixed `sandbox_`. It NEVER
 * pretends a simulated post is a real external post (spec rule 11).
 *
 * Test hooks:
 *  - content containing `#failtest` makes `publish()` throw a provider error
 *  - content containing `#reauthtest` makes `validateAccount()` report REAUTH_REQUIRED
 */
export class SandboxProvider implements SocialProvider {
  readonly isSandbox = true;
  readonly capabilities;

  constructor(readonly platform: Platform) {
    this.capabilities = CAPABILITIES[platform];
  }

  getAuthUrl({ state, redirectUri }: OAuthUrlParams): string {
    // Round-trips straight back to our own callback with a fake code.
    const url = new URL(redirectUri);
    url.searchParams.set("code", `sandbox_${randomUUID()}`);
    url.searchParams.set("state", state);
    url.searchParams.set("sandbox", "1");
    return url.toString();
  }

  async handleCallback(
    _params: OAuthCallbackParams,
  ): Promise<ConnectedAccount> {
    const handle = `${PLATFORM_META[this.platform].label.toLowerCase()}-demo`;
    return {
      externalAccountId: `sbx_${this.platform}_${randomUUID().slice(0, 8)}`,
      accountName: `@${handle}`,
      accessToken: `sandbox-access-${randomUUID()}`,
      refreshToken: `sandbox-refresh-${randomUUID()}`,
      tokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
      metadata: { sandbox: true, handle },
    };
  }

  async validateAccount(
    account: PublishAccount,
  ): Promise<SocialAccountStatus> {
    if ((account.metadata?.forceReauth as boolean) === true) {
      return "REAUTH_REQUIRED";
    }
    return "CONNECTED";
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    // Simulate network latency.
    await new Promise((r) => setTimeout(r, 350));

    if (/#failtest\b/i.test(input.content)) {
      throw errors.provider(
        `${PLATFORM_META[this.platform].label} rejected this post (sandbox #failtest).`,
        { action: "retry", platform: this.platform },
      );
    }

    const id = `sandbox_${this.platform}_${randomUUID()}`;
    return {
      externalPostId: id,
      externalUrl: `https://sandbox.postpilot.local/${this.platform}/${id}`,
      isSandbox: true,
    };
  }

  async refreshToken(_refreshToken: string) {
    return {
      accessToken: `sandbox-access-${randomUUID()}`,
      refreshToken: `sandbox-refresh-${randomUUID()}`,
      tokenExpiresAt: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 60,
      ).toISOString(),
    };
  }

  async deletePost(): Promise<void> {
    // no-op for sandbox
  }
}
