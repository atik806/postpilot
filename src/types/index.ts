/**
 * PostPilot shared domain types.
 * These string unions mirror the Postgres enums defined in
 * `supabase/migrations/0001_init.sql`.
 */

export const PLATFORMS = [
  "facebook",
  "instagram",
  "linkedin",
  "x",
  "youtube",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const WORKSPACE_ROLES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const SOCIAL_ACCOUNT_STATUSES = [
  "CONNECTED",
  "EXPIRED",
  "REAUTH_REQUIRED",
  "DISCONNECTED",
  "ERROR",
] as const;
export type SocialAccountStatus = (typeof SOCIAL_ACCOUNT_STATUSES)[number];

export const POST_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "PARTIALLY_PUBLISHED",
  "FAILED",
  "CANCELLED",
] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_TARGET_STATUSES = [
  "PENDING",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
  "CANCELLED",
] as const;
export type PostTargetStatus = (typeof POST_TARGET_STATUSES)[number];

export const PUBLISHING_JOB_STATUSES = [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;
export type PublishingJobStatus = (typeof PUBLISHING_JOB_STATUSES)[number];

export const PLAN_TIERS = ["FREE", "STARTER", "PRO", "AGENCY"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const TONES = [
  "professional",
  "casual",
  "funny",
  "friendly",
  "educational",
  "promotional",
  "inspirational",
] as const;
export type Tone = (typeof TONES)[number];

export interface PlanLimits {
  workspaces: number; // -1 = unlimited
  socialAccounts: number;
  postsPerMonth: number;
  aiCallsPerMonth: number;
  teamMembers: number;
  analytics: boolean;
  aiCampaigns: boolean;
  whiteLabel: boolean;
}

/** Per-platform overrides of the base post content. */
export interface PlatformContent {
  text: string;
  /** Manual override flag — when false the platform tracks `base_content`. */
  edited: boolean;
}
