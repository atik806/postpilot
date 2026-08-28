/**
 * Hand-authored typing of the PostPilot Postgres schema.
 *
 * Regenerate from the live database once the Supabase CLI is linked:
 *   npm run gen:types
 * (which overwrites this file with `supabase gen types typescript --linked`).
 *
 * NOTE: these are `type` aliases (not `interface`) on purpose — Supabase's
 * `GenericSchema` constraint requires table Row/Insert/Update to satisfy
 * `Record<string, unknown>`, which object type aliases do and interfaces don't.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlatformEnum =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "x"
  | "youtube";
export type WorkspaceRoleEnum = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
export type SocialAccountStatusEnum =
  | "CONNECTED"
  | "EXPIRED"
  | "REAUTH_REQUIRED"
  | "DISCONNECTED"
  | "ERROR";
export type PostStatusEnum =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHING"
  | "PUBLISHED"
  | "PARTIALLY_PUBLISHED"
  | "FAILED"
  | "CANCELLED";
export type PostTargetStatusEnum =
  | "PENDING"
  | "PUBLISHING"
  | "PUBLISHED"
  | "FAILED"
  | "CANCELLED";
export type PublishingJobStatusEnum =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";
export type PlanTierEnum = "FREE" | "STARTER" | "PRO" | "AGENCY";

export type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRoleEnum;
  created_at: string;
};

export type SubscriptionRow = {
  id: string;
  workspace_id: string;
  plan: PlanTierEnum;
  status: string;
  limits: Json;
  usage: Json;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialAccountRow = {
  id: string;
  workspace_id: string;
  platform: PlatformEnum;
  account_name: string;
  external_account_id: string;
  status: SocialAccountStatusEnum;
  is_sandbox: boolean;
  metadata: Json;
  connected_by: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialAccountSecretRow = {
  social_account_id: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  updated_at: string;
};

export type CampaignRow = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: string;
  starts_on: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaRow = {
  id: string;
  workspace_id: string;
  uploaded_by: string | null;
  storage_path: string;
  storage_url: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  created_at: string;
};

export type PostRow = {
  id: string;
  workspace_id: string;
  author_id: string | null;
  campaign_id: string | null;
  title: string | null;
  base_content: string;
  status: PostStatusEnum;
  scheduled_at: string | null;
  timezone: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PostMediaRow = {
  id: string;
  post_id: string;
  media_id: string;
  sort_order: number;
};

export type PostTargetRow = {
  id: string;
  post_id: string;
  workspace_id: string;
  social_account_id: string;
  platform: PlatformEnum;
  platform_content: Json;
  status: PostTargetStatusEnum;
  external_post_id: string | null;
  external_url: string | null;
  error_message: string | null;
  is_sandbox: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublishingJobRow = {
  id: string;
  post_target_id: string;
  workspace_id: string;
  status: PublishingJobStatusEnum;
  attempts: number;
  max_attempts: number;
  run_after: string;
  locked_at: string | null;
  last_error: string | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
};

export type AnalyticsRow = {
  id: string;
  post_target_id: string;
  workspace_id: string;
  platform: PlatformEnum;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  views: number | null;
  reach: number | null;
  clicks: number | null;
  engagement_rate: number | null;
  recorded_at: string;
};

export type AiContentRow = {
  id: string;
  workspace_id: string;
  post_id: string | null;
  platform: PlatformEnum | null;
  kind: string;
  prompt: Json;
  generated_content: string;
  provider: string;
  model: string;
  created_by: string | null;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Json;
  created_at: string;
};

type Rel<
  FK extends string,
  Col extends string,
  RefRel extends string,
  RefCol extends string,
> = {
  foreignKeyName: FK;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: RefRel;
  referencedColumns: [RefCol];
};

type TableDef<
  Row,
  Rels extends readonly unknown[] = [],
> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: Rels;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      workspaces: TableDef<
        WorkspaceRow,
        [Rel<"workspaces_owner_id_fkey", "owner_id", "profiles", "id">]
      >;
      workspace_members: TableDef<
        WorkspaceMemberRow,
        [
          Rel<"workspace_members_workspace_id_fkey", "workspace_id", "workspaces", "id">,
          Rel<"workspace_members_user_id_fkey", "user_id", "profiles", "id">,
        ]
      >;
      subscriptions: TableDef<
        SubscriptionRow,
        [Rel<"subscriptions_workspace_id_fkey", "workspace_id", "workspaces", "id">]
      >;
      social_accounts: TableDef<
        SocialAccountRow,
        [Rel<"social_accounts_workspace_id_fkey", "workspace_id", "workspaces", "id">]
      >;
      social_account_secrets: TableDef<
        SocialAccountSecretRow,
        [Rel<"social_account_secrets_social_account_id_fkey", "social_account_id", "social_accounts", "id">]
      >;
      campaigns: TableDef<
        CampaignRow,
        [Rel<"campaigns_workspace_id_fkey", "workspace_id", "workspaces", "id">]
      >;
      media: TableDef<
        MediaRow,
        [Rel<"media_workspace_id_fkey", "workspace_id", "workspaces", "id">]
      >;
      posts: TableDef<
        PostRow,
        [
          Rel<"posts_workspace_id_fkey", "workspace_id", "workspaces", "id">,
          Rel<"posts_author_id_fkey", "author_id", "profiles", "id">,
          Rel<"posts_campaign_id_fkey", "campaign_id", "campaigns", "id">,
        ]
      >;
      post_media: TableDef<
        PostMediaRow,
        [
          Rel<"post_media_post_id_fkey", "post_id", "posts", "id">,
          Rel<"post_media_media_id_fkey", "media_id", "media", "id">,
        ]
      >;
      post_targets: TableDef<
        PostTargetRow,
        [
          Rel<"post_targets_post_id_fkey", "post_id", "posts", "id">,
          Rel<"post_targets_workspace_id_fkey", "workspace_id", "workspaces", "id">,
          Rel<"post_targets_social_account_id_fkey", "social_account_id", "social_accounts", "id">,
        ]
      >;
      publishing_jobs: TableDef<
        PublishingJobRow,
        [
          Rel<"publishing_jobs_post_target_id_fkey", "post_target_id", "post_targets", "id">,
          Rel<"publishing_jobs_workspace_id_fkey", "workspace_id", "workspaces", "id">,
        ]
      >;
      analytics: TableDef<
        AnalyticsRow,
        [
          Rel<"analytics_post_target_id_fkey", "post_target_id", "post_targets", "id">,
          Rel<"analytics_workspace_id_fkey", "workspace_id", "workspaces", "id">,
        ]
      >;
      ai_content: TableDef<
        AiContentRow,
        [
          Rel<"ai_content_workspace_id_fkey", "workspace_id", "workspaces", "id">,
          Rel<"ai_content_post_id_fkey", "post_id", "posts", "id">,
        ]
      >;
      audit_logs: TableDef<
        AuditLogRow,
        [Rel<"audit_logs_workspace_id_fkey", "workspace_id", "workspaces", "id">]
      >;
    };
    Views: Record<string, never>;
    Functions: {
      create_workspace: {
        Args: { workspace_name: string };
        Returns: string;
      };
      claim_publishing_jobs: {
        Args: { max_jobs?: number; lock_timeout_seconds?: number };
        Returns: PublishingJobRow[];
      };
      is_workspace_member: { Args: { ws: string }; Returns: boolean };
      has_workspace_role: {
        Args: { ws: string; roles: WorkspaceRoleEnum[] };
        Returns: boolean;
      };
      workspace_role: { Args: { ws: string }; Returns: WorkspaceRoleEnum };
    };
    Enums: {
      platform: PlatformEnum;
      workspace_role: WorkspaceRoleEnum;
      social_account_status: SocialAccountStatusEnum;
      post_status: PostStatusEnum;
      post_target_status: PostTargetStatusEnum;
      publishing_job_status: PublishingJobStatusEnum;
      plan_tier: PlanTierEnum;
    };
    CompositeTypes: Record<string, never>;
  };
};
