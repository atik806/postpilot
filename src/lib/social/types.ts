import type { Platform, SocialAccountStatus } from "@/types";

export interface SocialCapabilities {
  publishText: boolean;
  publishImage: boolean;
  publishVideo: boolean;
  multiImage: boolean;
  nativeSchedule: boolean;
  deletePost: boolean;
  refreshToken: boolean;
}

export interface OAuthUrlParams {
  state: string;
  redirectUri: string;
  /** Set when the user is re-authorising an existing account. */
  reauthAccountId?: string;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
  redirectUri: string;
}

export interface ConnectedAccount {
  externalAccountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PublishAccount {
  externalAccountId: string;
  accountName: string;
  accessToken: string | null;
  refreshToken?: string | null;
  metadata: Record<string, unknown>;
}

export interface PublishMedia {
  url: string;
  mimeType: string;
  kind: "image" | "video";
}

export interface PublishInput {
  content: string;
  media: PublishMedia[];
  account: PublishAccount;
  /** Deterministic — lets a retried publish be de-duplicated. */
  idempotencyKey: string;
}

export interface PublishResult {
  externalPostId: string;
  externalUrl: string | null;
  isSandbox: boolean;
}

export interface SocialProvider {
  readonly platform: Platform;
  readonly isSandbox: boolean;
  readonly capabilities: SocialCapabilities;

  getAuthUrl(params: OAuthUrlParams): string;
  handleCallback(params: OAuthCallbackParams): Promise<ConnectedAccount>;
  validateAccount(account: PublishAccount): Promise<SocialAccountStatus>;
  publish(input: PublishInput): Promise<PublishResult>;
  refreshToken?(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string | null;
    tokenExpiresAt?: string | null;
  }>;
  deletePost?(account: PublishAccount, externalPostId: string): Promise<void>;
}
