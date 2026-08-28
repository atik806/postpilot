import "server-only";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { PUBLISHING } from "@/lib/constants";
import { backoffSeconds } from "@/server/backoff";
import { getSocialProvider } from "@/lib/social/registry";
import type { PublishMedia } from "@/lib/social/types";
import { getPublishAccount, markAccountStatus } from "@/server/social-accounts";
import { signedUrlAdmin, mediaKind } from "@/server/media";
import type { PlatformContent } from "@/types";
import type {
  PostStatusEnum,
  PostTargetRow,
  PublishingJobRow,
} from "@/types/database.types";

export { backoffSeconds };

type Admin = ReturnType<typeof createSupabaseServiceRoleClient>;

/**
 * Ensures a publishing job exists for every target of a post, scheduled to run
 * at `runAfter`. Idempotent: existing SUCCEEDED jobs are left untouched;
 * PENDING/FAILED jobs are reset for a fresh attempt.
 */
export async function enqueuePost(
  postId: string,
  opts: { runAfter?: Date } = {},
): Promise<void> {
  const admin = createSupabaseServiceRoleClient();
  const runAfter = (opts.runAfter ?? new Date()).toISOString();

  const { data: targets } = await admin
    .from("post_targets")
    .select("id, workspace_id, status")
    .eq("post_id", postId);
  if (!targets || targets.length === 0) return;

  for (const target of targets) {
    if (target.status === "PUBLISHED") continue;

    const { data: existing } = await admin
      .from("publishing_jobs")
      .select("id, status")
      .eq("idempotency_key", target.id)
      .maybeSingle();

    if (existing?.status === "SUCCEEDED") continue;

    if (existing) {
      await admin
        .from("publishing_jobs")
        .update({
          status: "PENDING",
          run_after: runAfter,
          locked_at: null,
          last_error: null,
        })
        .eq("id", existing.id);
    } else {
      await admin.from("publishing_jobs").insert({
        post_target_id: target.id,
        workspace_id: target.workspace_id,
        idempotency_key: target.id,
        run_after: runAfter,
        max_attempts: PUBLISHING.maxAttempts,
      });
    }

    await admin
      .from("post_targets")
      .update({ status: "PENDING", error_message: null })
      .eq("id", target.id);
  }

  const isScheduled = (opts.runAfter?.getTime() ?? 0) > Date.now() + 1000;
  await admin
    .from("posts")
    .update({
      status: isScheduled ? "SCHEDULED" : "PUBLISHING",
      scheduled_at: isScheduled ? runAfter : null,
    })
    .eq("id", postId);
}

/** Re-queue a single failed target. */
export async function retryTarget(targetId: string): Promise<void> {
  const admin = createSupabaseServiceRoleClient();
  const { data: job } = await admin
    .from("publishing_jobs")
    .select("id")
    .eq("idempotency_key", targetId)
    .maybeSingle();

  if (job) {
    await admin
      .from("publishing_jobs")
      .update({
        status: "PENDING",
        run_after: new Date().toISOString(),
        locked_at: null,
        last_error: null,
      })
      .eq("id", job.id);
  } else {
    const { data: target } = await admin
      .from("post_targets")
      .select("id, workspace_id")
      .eq("id", targetId)
      .single();
    if (target) {
      await admin.from("publishing_jobs").insert({
        post_target_id: target.id,
        workspace_id: target.workspace_id,
        idempotency_key: target.id,
        max_attempts: PUBLISHING.maxAttempts,
      });
    }
  }

  await admin
    .from("post_targets")
    .update({ status: "PENDING", error_message: null })
    .eq("id", targetId);
}

async function loadPublishMedia(
  admin: Admin,
  postId: string,
): Promise<PublishMedia[]> {
  const { data } = await admin
    .from("post_media")
    .select("sort_order, media:media(storage_path, mime_type)")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true });

  const out: PublishMedia[] = [];
  for (const row of data ?? []) {
    const m = row.media as { storage_path: string; mime_type: string } | null;
    if (!m) continue;
    const url = await signedUrlAdmin(m.storage_path);
    if (!url) continue;
    out.push({ url, mimeType: m.mime_type, kind: mediaKind(m.mime_type) });
  }
  return out;
}

async function recomputePostStatus(admin: Admin, postId: string): Promise<void> {
  const { data: targets } = await admin
    .from("post_targets")
    .select("status")
    .eq("post_id", postId);
  if (!targets || targets.length === 0) return;

  const statuses = targets.map((t) => t.status);
  const published = statuses.filter((s) => s === "PUBLISHED").length;
  const pending = statuses.filter(
    (s) => s === "PENDING" || s === "PUBLISHING",
  ).length;

  let status: PostStatusEnum;
  if (pending > 0) status = "PUBLISHING";
  else if (published === statuses.length) status = "PUBLISHED";
  else if (published > 0) status = "PARTIALLY_PUBLISHED";
  else status = "FAILED";

  await admin
    .from("posts")
    .update({
      status,
      published_at:
        status === "PUBLISHED" || status === "PARTIALLY_PUBLISHED"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", postId);
}

async function processJob(admin: Admin, job: PublishingJobRow): Promise<void> {
  const log = logger.child({ jobId: job.id, targetId: job.post_target_id });

  const { data: target } = await admin
    .from("post_targets")
    .select("*")
    .eq("id", job.post_target_id)
    .single<PostTargetRow>();
  if (!target) {
    await admin
      .from("publishing_jobs")
      .update({ status: "CANCELLED", last_error: "target missing" })
      .eq("id", job.id);
    return;
  }

  // Idempotency guard — never publish an already-published target twice.
  if (target.status === "PUBLISHED" || target.external_post_id) {
    await admin
      .from("publishing_jobs")
      .update({ status: "SUCCEEDED" })
      .eq("id", job.id);
    log.info("publish.skip_already_published");
    return;
  }

  const { data: post } = await admin
    .from("posts")
    .select("id, base_content, status")
    .eq("id", target.post_id)
    .single();
  if (!post) return;
  if (post.status === "CANCELLED") {
    await admin
      .from("publishing_jobs")
      .update({ status: "CANCELLED" })
      .eq("id", job.id);
    return;
  }

  await admin
    .from("post_targets")
    .update({ status: "PUBLISHING" })
    .eq("id", target.id);

  const content =
    (target.platform_content as PlatformContent | null)?.text?.trim() ||
    post.base_content;

  try {
    const { account } = await getPublishAccount(target.social_account_id);
    const media = await loadPublishMedia(admin, target.post_id);
    const provider = getSocialProvider(target.platform);

    const result = await provider.publish({
      content,
      media,
      account,
      idempotencyKey: target.id,
    });

    await admin
      .from("post_targets")
      .update({
        status: "PUBLISHED",
        external_post_id: result.externalPostId,
        external_url: result.externalUrl,
        is_sandbox: result.isSandbox,
        published_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", target.id);

    await admin
      .from("publishing_jobs")
      .update({ status: "SUCCEEDED", last_error: null })
      .eq("id", job.id);

    log.info("publish.success", {
      platform: target.platform,
      external: result.externalPostId,
      sandbox: result.isSandbox,
    });
  } catch (err) {
    const message =
      err instanceof AppError ? err.message : "Publishing failed unexpectedly.";
    const reauth =
      err instanceof AppError && err.hint?.action === "reconnect";
    if (reauth) {
      await markAccountStatus(target.social_account_id, "REAUTH_REQUIRED");
    }

    const exhausted = job.attempts >= job.max_attempts;
    await admin
      .from("publishing_jobs")
      .update({
        status: exhausted ? "FAILED" : "PENDING",
        last_error: message,
        locked_at: null,
        run_after: exhausted
          ? job.run_after
          : new Date(Date.now() + backoffSeconds(job.attempts) * 1000).toISOString(),
      })
      .eq("id", job.id);

    await admin
      .from("post_targets")
      .update({
        status: exhausted ? "FAILED" : "PENDING",
        error_message: message,
      })
      .eq("id", target.id);

    log.warn("publish.failed", {
      platform: target.platform,
      attempt: job.attempts,
      exhausted,
      error: message,
    });
  }

  await recomputePostStatus(admin, target.post_id);
}

export interface ProcessResult {
  claimed: number;
  processed: number;
}

/** Drains the queue. Called by GET/POST /api/cron/publish. */
export async function processDueJobs(limit = 15): Promise<ProcessResult> {
  const admin = createSupabaseServiceRoleClient();
  const { data: jobs, error } = await admin.rpc("claim_publishing_jobs", {
    max_jobs: limit,
    lock_timeout_seconds: PUBLISHING.lockTimeoutSeconds,
  });
  if (error) {
    logger.error("queue.claim_failed", { error: error.message });
    throw error;
  }

  const claimed = (jobs ?? []) as PublishingJobRow[];
  for (const job of claimed) {
    try {
      await processJob(admin, job);
    } catch (err) {
      logger.error("queue.job_crashed", { jobId: job.id, err: String(err) });
      await admin
        .from("publishing_jobs")
        .update({ status: "PENDING", locked_at: null })
        .eq("id", job.id);
    }
  }

  return { claimed: claimed.length, processed: claimed.length };
}
