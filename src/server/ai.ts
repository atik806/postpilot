import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import type {
  CaptionInput,
  CaptionResult,
  HashtagsInput,
  RewriteInput,
} from "@/lib/ai/types";
import { assertWithinPlan } from "@/server/limits";
import { assertRole, requireWorkspaceContext } from "@/server/session";
import type { Platform } from "@/types";

async function persist(params: {
  workspaceId: string;
  userId: string;
  postId?: string | null;
  platform?: Platform | null;
  kind: string;
  prompt: unknown;
  generated: string;
  provider: string;
  model: string;
}) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("ai_content").insert({
    workspace_id: params.workspaceId,
    post_id: params.postId ?? null,
    platform: params.platform ?? null,
    kind: params.kind,
    prompt: params.prompt as never,
    generated_content: params.generated,
    provider: params.provider,
    model: params.model,
    created_by: params.userId,
  });
}

export async function aiGenerateCaption(
  input: CaptionInput,
  postId?: string | null,
): Promise<CaptionResult> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "EDITOR");
  await assertWithinPlan(ctx.workspace.id, ctx.subscription, "ai_call");

  const provider = getAIProvider();
  const result = await provider.generateCaption(input);

  await persist({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    postId,
    platform: input.platform,
    kind: "caption",
    prompt: input,
    generated: JSON.stringify(result),
    provider: provider.name,
    model: provider.model,
  });
  return result;
}

export async function aiRewrite(
  input: RewriteInput,
  postId?: string | null,
): Promise<{ text: string }> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "EDITOR");
  await assertWithinPlan(ctx.workspace.id, ctx.subscription, "ai_call");

  const provider = getAIProvider();
  const result = await provider.rewriteForPlatform(input);

  await persist({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    postId,
    platform: input.platform,
    kind: "rewrite",
    prompt: input,
    generated: result.text,
    provider: provider.name,
    model: provider.model,
  });
  return result;
}

export async function aiHashtags(
  input: HashtagsInput,
  postId?: string | null,
): Promise<{ hashtags: string[] }> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "EDITOR");
  await assertWithinPlan(ctx.workspace.id, ctx.subscription, "ai_call");

  const provider = getAIProvider();
  const result = await provider.generateHashtags(input);

  await persist({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    postId,
    platform: input.platform,
    kind: "hashtags",
    prompt: input,
    generated: result.hashtags.join(" "),
    provider: provider.name,
    model: provider.model,
  });
  return result;
}
