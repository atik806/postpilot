import type { Platform, PlanLimits, PlanTier, Tone } from "@/types";

export const APP_NAME = "PostPilot";
export const APP_TAGLINE = "Create Once. Publish Everywhere.";

export interface PlatformMeta {
  id: Platform;
  label: string;
  /** Longest handle-style label, e.g. "Facebook Page". */
  accountNoun: string;
  /** Approx hard character limit for a single post. */
  charLimit: number;
  supportsMultipleMedia: boolean;
  requiresMedia: boolean;
  /** Tailwind text colour class for the platform mark. */
  brandClass: string;
}

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  facebook: {
    id: "facebook",
    label: "Facebook",
    accountNoun: "Facebook Page",
    charLimit: 63206,
    supportsMultipleMedia: true,
    requiresMedia: false,
    brandClass: "text-[#1877F2]",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    accountNoun: "Instagram Business account",
    charLimit: 2200,
    supportsMultipleMedia: true,
    requiresMedia: true,
    brandClass: "text-[#E1306C]",
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    accountNoun: "LinkedIn profile or page",
    charLimit: 3000,
    supportsMultipleMedia: true,
    requiresMedia: false,
    brandClass: "text-[#0A66C2]",
  },
  x: {
    id: "x",
    label: "X",
    accountNoun: "X account",
    charLimit: 280,
    supportsMultipleMedia: true,
    requiresMedia: false,
    brandClass: "text-foreground",
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    accountNoun: "YouTube channel",
    charLimit: 5000,
    supportsMultipleMedia: true,
    requiresMedia: true,
    brandClass: "text-[#FF0000]",
  },
};

export const PLATFORM_LIST = Object.values(PLATFORM_META);

export const TONE_LABELS: Record<Tone, string> = {
  professional: "Professional",
  casual: "Casual",
  funny: "Funny",
  friendly: "Friendly",
  educational: "Educational",
  promotional: "Promotional",
  inspirational: "Inspirational",
};

export interface PlanMeta {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  blurb: string;
  highlights: string[];
  limits: PlanLimits;
  recommended?: boolean;
}

export const PLANS: Record<PlanTier, PlanMeta> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    priceMonthly: 0,
    blurb: "For trying PostPilot out.",
    highlights: ["1 workspace", "2 social accounts", "10 posts / month"],
    limits: {
      workspaces: 1,
      socialAccounts: 2,
      postsPerMonth: 10,
      aiCallsPerMonth: 20,
      teamMembers: 1,
      analytics: false,
      aiCampaigns: false,
      whiteLabel: false,
    },
  },
  STARTER: {
    tier: "STARTER",
    name: "Starter",
    priceMonthly: 9,
    blurb: "For solo creators and small businesses.",
    highlights: [
      "5 social accounts",
      "100 posts / month",
      "AI captions",
      "Scheduling",
    ],
    limits: {
      workspaces: 1,
      socialAccounts: 5,
      postsPerMonth: 100,
      aiCallsPerMonth: 300,
      teamMembers: 2,
      analytics: false,
      aiCampaigns: false,
      whiteLabel: false,
    },
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    priceMonthly: 29,
    blurb: "For teams that publish every day.",
    recommended: true,
    highlights: [
      "20 social accounts",
      "Unlimited posts",
      "Advanced analytics",
      "AI campaigns",
      "Team members",
    ],
    limits: {
      workspaces: 3,
      socialAccounts: 20,
      postsPerMonth: -1,
      aiCallsPerMonth: 2000,
      teamMembers: 10,
      analytics: true,
      aiCampaigns: true,
      whiteLabel: false,
    },
  },
  AGENCY: {
    tier: "AGENCY",
    name: "Agency",
    priceMonthly: 79,
    blurb: "For agencies managing many clients.",
    highlights: [
      "Multiple workspaces",
      "Unlimited social accounts",
      "Client management",
      "White-label",
    ],
    limits: {
      workspaces: -1,
      socialAccounts: -1,
      postsPerMonth: -1,
      aiCallsPerMonth: 10000,
      teamMembers: -1,
      analytics: true,
      aiCampaigns: true,
      whiteLabel: true,
    },
  },
};

export const MEDIA_BUCKET = "media";

export const MEDIA_LIMITS = {
  maxImageBytes: 15 * 1024 * 1024, // 15 MB
  maxVideoBytes: 512 * 1024 * 1024, // 512 MB
  maxPerPost: 10,
  acceptedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  acceptedVideoTypes: ["video/mp4", "video/quicktime", "video/webm"],
} as const;

export const PUBLISHING = {
  maxAttempts: 5,
  /** Base backoff in seconds; grows exponentially per attempt. */
  backoffBaseSeconds: 30,
  backoffMaxSeconds: 60 * 30,
  /** A locked job older than this is considered abandoned and reclaimable. */
  lockTimeoutSeconds: 300,
} as const;
