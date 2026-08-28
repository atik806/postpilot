import "server-only";
import type { Platform, SocialAccountStatus } from "@/types";
import { PLATFORM_META } from "@/lib/constants";
import { errors } from "@/lib/errors";
import { CAPABILITIES } from "./capabilities";
import type {
  ConnectedAccount,
  OAuthCallbackParams,
  OAuthUrlParams,
  PublishInput,
  PublishResult,
  SocialProvider,
} from "./types";

interface OAuthEndpoints {
  authorize: string;
  scope: string;
}

const ENDPOINTS: Record<Platform, OAuthEndpoints> = {
  facebook: {
    authorize: "https://www.facebook.com/v21.0/dialog/oauth",
    scope: "pages_manage_posts,pages_read_engagement,pages_show_list",
  },
  instagram: {
    authorize: "https://www.facebook.com/v21.0/dialog/oauth",
    scope: "instagram_basic,instagram_content_publish,pages_show_list",
  },
  linkedin: {
    authorize: "https://www.linkedin.com/oauth/v2/authorization",
    scope: "openid profile w_member_social",
  },
  x: {
    authorize: "https://twitter.com/i/oauth2/authorize",
    scope: "tweet.read tweet.write users.read offline.access",
  },
  youtube: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "https://www.googleapis.com/auth/youtube.upload",
  },
};

/**
 * Scaffold for a real OAuth-backed provider. It builds a genuine authorize
 * URL, but connect/publish are intentionally not implemented in this build —
 * they throw a clear, actionable error rather than faking success. When you
 * implement one, set `implemented = true` and the registry will start using it
 * in place of the sandbox provider (requires <PLATFORM>_CLIENT_ID/SECRET).
 */
export abstract class RealProviderScaffold implements SocialProvider {
  readonly isSandbox = false;
  /** Flip to `true` once connect + publish are genuinely implemented. */
  static readonly implemented = false;
  readonly capabilities;

  constructor(
    readonly platform: Platform,
    private readonly clientId: string,
  ) {
    this.capabilities = CAPABILITIES[platform];
  }

  getAuthUrl({ state, redirectUri }: OAuthUrlParams): string {
    const ep = ENDPOINTS[this.platform];
    const url = new URL(ep.authorize);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", ep.scope);
    url.searchParams.set("state", state);
    return url.toString();
  }

  private notImplemented(): never {
    const label = PLATFORM_META[this.platform].label;
    throw errors.provider(
      `${label} publishing isn't enabled in this build. The OAuth flow is scaffolded — implement ${this.constructor.name}.handleCallback / .publish to go live.`,
      { action: "contact_support", platform: this.platform },
    );
  }

  async handleCallback(_p: OAuthCallbackParams): Promise<ConnectedAccount> {
    this.notImplemented();
  }

  async validateAccount(): Promise<SocialAccountStatus> {
    return "REAUTH_REQUIRED";
  }

  async publish(_input: PublishInput): Promise<PublishResult> {
    this.notImplemented();
  }
}

export class FacebookProvider extends RealProviderScaffold {
  constructor(clientId: string) {
    super("facebook", clientId);
  }
}
export class InstagramProvider extends RealProviderScaffold {
  constructor(clientId: string) {
    super("instagram", clientId);
  }
}
export class LinkedInProvider extends RealProviderScaffold {
  constructor(clientId: string) {
    super("linkedin", clientId);
  }
}
export class XProvider extends RealProviderScaffold {
  constructor(clientId: string) {
    super("x", clientId);
  }
}
export class YouTubeProvider extends RealProviderScaffold {
  constructor(clientId: string) {
    super("youtube", clientId);
  }
}
