import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errors } from "@/lib/errors";
import { assertRole, requireWorkspaceContext } from "@/server/session";
import { recordAudit } from "@/server/audit";
import type { Platform } from "@/types";

export interface CampaignView {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startsOn: string | null;
  postCount: number;
  platforms: Platform[];
  publishedCount: number;
}

export async function listCampaigns(): Promise<CampaignView[]> {
  const ctx = await requireWorkspaceContext();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("campaigns")
    .select("id, name, description, status, starts_on, posts:posts(id, status, targets:post_targets(platform))")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((c) => {
    const posts = (c.posts as { status: string; targets: { platform: Platform }[] }[]) ?? [];
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      status: c.status,
      startsOn: c.starts_on,
      postCount: posts.length,
      publishedCount: posts.filter((p) =>
        ["PUBLISHED", "PARTIALLY_PUBLISHED"].includes(p.status),
      ).length,
      platforms: [
        ...new Set(posts.flatMap((p) => (p.targets ?? []).map((t) => t.platform))),
      ],
    };
  });
}

export async function createCampaign(input: {
  name: string;
  description?: string;
  startsOn?: string | null;
}): Promise<{ id: string }> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "EDITOR");
  if (input.name.trim().length < 2) {
    throw errors.validation("Give the campaign a name.");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      workspace_id: ctx.workspace.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      starts_on: input.startsOn ?? null,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (error || !data) throw errors.internal("Could not create the campaign.");

  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "campaign.created",
    targetType: "campaign",
    targetId: data.id,
  });
  return { id: data.id };
}
