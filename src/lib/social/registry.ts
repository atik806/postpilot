import "server-only";
import type { Platform } from "@/types";
import { PLATFORMS } from "@/types";
import { socialCredentials } from "@/lib/env";
import { SandboxProvider } from "./sandbox";
import {
  FacebookProvider,
  InstagramProvider,
  LinkedInProvider,
  RealProviderScaffold,
  XProvider,
  YouTubeProvider,
} from "./scaffolds";
import type { SocialProvider } from "./types";

const REAL: Record<
  Platform,
  { ctor: new (clientId: string) => RealProviderScaffold; implemented: boolean }
> = {
  facebook: { ctor: FacebookProvider, implemented: RealProviderScaffold.implemented },
  instagram: { ctor: InstagramProvider, implemented: RealProviderScaffold.implemented },
  linkedin: { ctor: LinkedInProvider, implemented: RealProviderScaffold.implemented },
  x: { ctor: XProvider, implemented: RealProviderScaffold.implemented },
  youtube: { ctor: YouTubeProvider, implemented: RealProviderScaffold.implemented },
};

/**
 * Returns the provider for a platform: the real adapter when it has OAuth
 * credentials AND a working implementation, otherwise the clearly-labelled
 * sandbox provider.
 */
export function getSocialProvider(platform: Platform): SocialProvider {
  const creds = socialCredentials(platform);
  const real = REAL[platform];
  if (creds && real.implemented) {
    return new real.ctor(creds.clientId);
  }
  return new SandboxProvider(platform);
}

export function isSandboxPlatform(platform: Platform): boolean {
  return getSocialProvider(platform).isSandbox;
}

export function platformConnectionModes(): Record<
  Platform,
  { sandbox: boolean }
> {
  return Object.fromEntries(
    PLATFORMS.map((p) => [p, { sandbox: isSandboxPlatform(p) }]),
  ) as Record<Platform, { sandbox: boolean }>;
}
