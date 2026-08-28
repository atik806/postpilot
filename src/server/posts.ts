import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { errors } from "@/lib/errors";
import { PLATFORM_META } from "@/lib/constants";
import { asJson } from "@/lib/utils";
import { recordAudit } from "@/server/audit";
import { assertWithinPlan } from "@/server/limits";
import { assertRole, requireWorkspaceContext } from "@/server/session";
import { signedUrl } from "@/server/media";
import {
  enqueuePost,
  processDueJobs,
  retryTarget as retryTargetJob,
} from "@/server/publishing";
import type { Platform, PlatformContent, PostStatus } from "@/types";
import type {
  PostRow,
  PostTargetRow,
  PublishingJobRow,
} from "@/types/database.types";

export interface SavePostInput {
  id?: string;
  title?: string | null;
  baseContent: string;
  /** Per-platform text overrides. Absent → the platform follows base content. */
  platformContent?: Partial<Record<Platform, string>>;
  mediaIds?: string[];
  /** Selected social account ids to publish to. */
  accountIds: string[];
  scheduledAt?: string | null;
  timezone?: string;
  campaignId?: string | null;
}

const EDITABLE_STATUSES: PostStatus[] = ["DRAFT", "SCHEDULED", "FAILED"];

async function assertEditable(status: PostStatus) {
  if (!EDITABLE_STATUSES.includes(status)) {
    throw errors.conflict(
      `This post is ${status.toLowerCase()} and can no longer be edited.`,
    );
  }
}

export async function savePost(input: SavePostInput): Promise<{ id: string }> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "EDITOR");
  const supabase = await createSupabaseServerClient();

  const base = input.baseContent ?? "";
  const mediaIds = [...new Set(input.mediaIds ?? [])];
  const accountIds = [...new Set(input.accountIds ?? [])];

  // Validate that selected accounts belong to this workspace and are connected.
  let accounts: { id: string; platform: Platform }[] = [];
  if (accountIds.length > 0) {
    const { data } = await supabase
      .from("social_accounts")
      .select("id, platform, status")
      .eq("workspace_id", ctx.workspace.id)
      .in("id", accountIds);
    accounts = (data ?? [])
      .filter((a) => a.status === "CONNECTED")
      .map((a) => ({ id: a.id, platform: a.platform }));
  }

  let postId = input.id;

  if (postId) {
    const { data: existing } = await supabase
      .from("posts")
      .select("status")
      .eq("id", postId)
      .eq("workspace_id", ctx.workspace.id)
      .maybeSingle();
    if (!existing) throw errors.notFound("Post not found.");
    await assertEditable(existing.status);

    const { error } = await supabase
      .from("posts")
      .update({
        title: input.title ?? null,
        base_content: base,
        timezone: input.timezone ?? ctx.user.profile.timezone,
        campaign_id: input.campaignId ?? null,
      })
      .eq("id", postId);
    if (error) throw errors.internal("Could not save the post.");
  } else {
    await assertWithinPlan(ctx.workspace.id, ctx.subscription, "create_post");
    const { data, error } = await supabase
      .from("posts")
      .insert({
        workspace_id: ctx.workspace.id,
        author_id: ctx.user.id,
        title: input.title ?? null,
        base_content: base,
        status: "DRAFT",
        timezone: input.timezone ?? ctx.user.profile.timezone,
        campaign_id: input.campaignId ?? null,
      })
      .select("id")
      .single();
    if (error || !data) throw errors.internal("Could not create the post.");
    postId = data.id;
  }

  // ── media ────────────────────────────────────────────────────────────────
  await supabase.from("post_media").delete().eq("post_id", postId);
  if (mediaIds.length > 0) {
    await supabase.from("post_media").insert(
      mediaIds.map((mediaId, i) => ({
        post_id: postId!,
        media_id: mediaId,
        sort_order: i,
      })),
    );
  }

  // ── targets ──────────────────────────────────────────────────────────────
  const { data: currentTargets } = await supabase
    .from("post_targets")
    .select("id, social_account_id, status")
    .eq("post_id", postId);

  const keepAccountIds = new Set(accounts.map((a) => a.id));
  for (const t of currentTargets ?? []) {
    if (!keepAccountIds.has(t.social_account_id) && t.status !== "PUBLISHED") {
      await supabase.from("post_targets").delete().eq("id", t.id);
    }
  }

  for (const account of accounts) {
    const text = input.platformContent?.[account.platform];
    const platformContent: PlatformContent = {
      text: (text ?? base).slice(0, PLATFORM_META[account.platform].charLimit),
      edited: text !== undefined && text !== base,
    };
    const existing = (currentTargets ?? []).find(
      (t) => t.social_account_id === account.id,
    );
    if (existing) {
      if (existing.status !== "PUBLISHED") {
        await supabase
          .from("post_targets")
          .update({ platform_content: asJson(platformContent) })
          .eq("id", existing.id);
      }
    } else {
      await supabase.from("post_targets").insert({
        post_id: postId!,
        workspace_id: ctx.workspace.id,
        social_account_id: account.id,
        platform: account.platform,
        platform_content: asJson(platformContent),
      });
    }
  }

  return { id: postId! };
}

// ── read ───────────────────────────────────────────────────────────────────
export interface PostTargetView {
  id: string;
  platform: Platform;
  socialAccountId: string;
  accountName: string;
  status: PostTargetRow["status"];
  content: string;
  edited: boolean;
  externalUrl: string | null;
  isSandbox: boolean;
  errorMessage: string | null;
  publishedAt: string | null;
}

export interface PostMediaView {
  id: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
}

export interface PostDetail {
  id: string;
  title: string | null;
  baseContent: string;
  status: PostRow["status"];
  scheduledAt: string | null;
  publishedAt: string | null;
  timezone: string;
  campaignId: string | null;
  createdAt: string;
  updatedAt: string;
  targets: PostTargetView[];
  media: PostMediaView[];
  jobs: Pick<
    PublishingJobRow,
    "id" | "post_target_id" | "status" | "attempts" | "max_attempts" | "run_after" | "last_error"
  >[];
}

export async function getPost(id: string): Promise<PostDetail> {
  const ctx = await requireWorkspaceContext();
  const supabase = await createSupabaseServerClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!post) throw errors.notFound("Post not found.");

  const [{ data: targets }, { data: mediaRows }, { data: jobs }] =
    await Promise.all([
      supabase
        .from("post_targets")
        .select(
          "id, platform, social_account_id, status, platform_content, external_url, is_sandbox, error_message, published_at, account:social_accounts(account_name)",
        )
        .eq("post_id", id),
      supabase
        .from("post_media")
        .select("sort_order, media:media(id, storage_path, mime_type, width, height)")
        .eq("post_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("publishing_jobs")
        .select(
          "id, post_target_id, status, attempts, max_attempts, run_after, last_error",
        )
        .eq("workspace_id", ctx.workspace.id)
        .in(
          "post_target_id",
          (
            await supabase
              .from("post_targets")
              .select("id")
              .eq("post_id", id)
          ).data?.map((t) => t.id) ?? ["00000000-0000-0000-0000-000000000000"],
        ),
    ]);

  const media: PostMediaView[] = [];
  for (const row of mediaRows ?? []) {
    const m = row.media as {
      id: string;
      storage_path: string;
      mime_type: string;
      width: number | null;
      height: number | null;
    } | null;
    if (!m) continue;
    media.push({
      id: m.id,
      url: (await signedUrl(m.storage_path)) ?? "",
      mimeType: m.mime_type,
      width: m.width,
      height: m.height,
    });
  }

  return {
    id: post.id,
    title: post.title,
    baseContent: post.base_content,
    status: post.status,
    scheduledAt: post.scheduled_at,
    publishedAt: post.published_at,
    timezone: post.timezone,
    campaignId: post.campaign_id,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    media,
    jobs: jobs ?? [],
    targets: (targets ?? []).map((t) => {
      const pc = (t.platform_content as PlatformContent | null) ?? {
        text: "",
        edited: false,
      };
      const account = t.account as { account_name: string } | null;
      return {
        id: t.id,
        platform: t.platform,
        socialAccountId: t.social_account_id,
        accountName: account?.account_name ?? "",
        status: t.status,
        content: pc.text,
        edited: pc.edited,
        externalUrl: t.external_url,
        isSandbox: t.is_sandbox,
        errorMessage: t.error_message,
        publishedAt: t.published_at,
      };
    }),
  };
}

export interface PostListItem {
  id: string;
  title: string | null;
  excerpt: string;
  status: PostRow["status"];
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  platforms: Platform[];
  thumbnailUrl: string | null;
}

export async function listPosts(params: {
  filter?: "all" | "draft" | "scheduled" | "published" | "failed";
  search?: string;
  limit?: number;
} = {}): Promise<PostListItem[]> {
  const ctx = await requireWorkspaceContext();
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("posts")
    .select(
      "id, title, base_content, status, scheduled_at, published_at, created_at, targets:post_targets(platform), media:post_media(sort_order, media:media(storage_path))",
    )
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 100);

  switch (params.filter) {
    case "draft":
      query = query.eq("status", "DRAFT");
      break;
    case "scheduled":
      query = query.eq("status", "SCHEDULED");
      break;
    case "published":
      query = query.in("status", ["PUBLISHED", "PARTIALLY_PUBLISHED"]);
      break;
    case "failed":
      query = query.eq("status", "FAILED");
      break;
  }
  if (params.search?.trim()) {
    query = query.ilike("base_content", `%${params.search.trim()}%`);
  }

  const { data } = await query;
  const items: PostListItem[] = [];
  for (const row of data ?? []) {
    const firstMedia = (row.media as { sort_order: number; media: { storage_path: string } | null }[])
      ?.sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => m.media)
      .find(Boolean);
    items.push({
      id: row.id,
      title: row.title,
      excerpt: row.base_content.slice(0, 140),
      status: row.status,
      scheduledAt: row.scheduled_at,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      platforms: [
        ...new Set(
          ((row.targets as { platform: Platform }[]) ?? []).map((t) => t.platform),
        ),
      ],
      thumbnailUrl: firstMedia
        ? await signedUrl(firstMedia.storage_path, 60 * 60)
        : null,
    });
  }
  return items;
}

export async function calendarPosts(rangeStartISO: string, rangeEndISO: string) {
  const ctx = await requireWorkspaceContext();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, base_content, status, scheduled_at, published_at, targets:post_targets(platform)")
    .eq("workspace_id", ctx.workspace.id)
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", rangeStartISO)
    .lte("scheduled_at", rangeEndISO);
  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: p.base_content.slice(0, 80),
    status: p.status,
    scheduledAt: p.scheduled_at,
    platforms: [
      ...new Set(((p.targets as { platform: Platform }[]) ?? []).map((t) => t.platform)),
    ],
  }));
}

// ── lifecycle ──────────────────────────────────────────────────────────────
async function loadOwnedPost(id: string) {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "EDITOR");
  const supabase = await createSupabaseServerClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!post) throw errors.notFound("Post not found.");
  return { ctx, supabase, post };
}

async function assertHasTargets(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, postId: string) {
  const { count } = await supabase
    .from("post_targets")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (!count) {
    throw errors.validation("Select at least one account to publish to.");
  }
}

export async function publishPost(id: string): Promise<void> {
  const { ctx, supabase, post } = await loadOwnedPost(id);
  await assertEditable(post.status);
  await assertHasTargets(supabase, id);
  if (!post.base_content.trim()) {
    throw errors.validation("Add some content before publishing.");
  }

  await enqueuePost(id, { runAfter: new Date() });
  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "post.publish_requested",
    targetType: "post",
    targetId: id,
  });

  // Best-effort immediate drain so the UI sees results without waiting for cron.
  try {
    await processDueJobs(20);
  } catch {
    // The cron route will pick it up.
  }
}

export async function schedulePost(id: string, whenISO: string): Promise<void> {
  const { ctx, supabase, post } = await loadOwnedPost(id);
  await assertEditable(post.status);
  await assertHasTargets(supabase, id);
  const when = new Date(whenISO);
  if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() + 60_000) {
    throw errors.validation("Pick a time at least a minute in the future.");
  }
  if (!post.base_content.trim()) {
    throw errors.validation("Add some content before scheduling.");
  }

  await enqueuePost(id, { runAfter: when });
  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "post.scheduled",
    targetType: "post",
    targetId: id,
    metadata: { scheduledAt: when.toISOString() },
  });
}

export async function reschedulePost(id: string, whenISO: string): Promise<void> {
  return schedulePost(id, whenISO);
}

export async function cancelPost(id: string): Promise<void> {
  const { ctx, supabase, post } = await loadOwnedPost(id);
  if (["PUBLISHED", "CANCELLED"].includes(post.status)) {
    throw errors.conflict("This post can't be cancelled.");
  }
  const admin = createSupabaseServiceRoleClient();
  const { data: targetIds } = await supabase
    .from("post_targets")
    .select("id")
    .eq("post_id", id);
  if (targetIds && targetIds.length) {
    await admin
      .from("publishing_jobs")
      .update({ status: "CANCELLED" })
      .in("status", ["PENDING", "RUNNING"])
      .in(
        "post_target_id",
        targetIds.map((t) => t.id),
      );
  }
  await supabase.from("posts").update({ status: "CANCELLED" }).eq("id", id);
  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "post.cancelled",
    targetType: "post",
    targetId: id,
  });
}

export async function deletePost(id: string): Promise<void> {
  const { ctx, supabase, post } = await loadOwnedPost(id);
  await supabase.from("posts").delete().eq("id", id);
  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "post.deleted",
    targetType: "post",
    targetId: id,
    metadata: { status: post.status },
  });
}

export async function duplicatePost(id: string): Promise<{ id: string }> {
  const { ctx, supabase, post } = await loadOwnedPost(id);
  await assertWithinPlan(ctx.workspace.id, ctx.subscription, "create_post");

  const { data: newPost, error } = await supabase
    .from("posts")
    .insert({
      workspace_id: ctx.workspace.id,
      author_id: ctx.user.id,
      title: post.title ? `${post.title} (copy)` : null,
      base_content: post.base_content,
      status: "DRAFT",
      timezone: post.timezone,
    })
    .select("id")
    .single();
  if (error || !newPost) throw errors.internal("Could not duplicate the post.");

  const [{ data: media }, { data: targets }] = await Promise.all([
    supabase.from("post_media").select("media_id, sort_order").eq("post_id", id),
    supabase
      .from("post_targets")
      .select("social_account_id, platform, platform_content")
      .eq("post_id", id),
  ]);

  if (media?.length) {
    await supabase
      .from("post_media")
      .insert(media.map((m) => ({ ...m, post_id: newPost.id })));
  }
  if (targets?.length) {
    await supabase.from("post_targets").insert(
      targets.map((t) => ({
        post_id: newPost.id,
        workspace_id: ctx.workspace.id,
        social_account_id: t.social_account_id,
        platform: t.platform,
        platform_content: t.platform_content,
      })),
    );
  }
  return { id: newPost.id };
}

export async function retryPostTarget(targetId: string): Promise<void> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "EDITOR");
  const supabase = await createSupabaseServerClient();
  const { data: target } = await supabase
    .from("post_targets")
    .select("id, post_id")
    .eq("id", targetId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!target) throw errors.notFound("Target not found.");

  await retryTargetJob(targetId);
  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "post.target_retried",
    targetType: "post_target",
    targetId,
  });
  try {
    await processDueJobs(10);
  } catch {
    /* cron will retry */
  }
}
