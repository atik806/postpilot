import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errors } from "@/lib/errors";
import {
  assertRole,
  requireSessionUser,
  requireWorkspaceContext,
} from "@/server/session";
import { recordAudit } from "@/server/audit";
import type { ProfileRow } from "@/types/database.types";

export async function updateProfile(input: {
  name?: string;
  timezone?: string;
}): Promise<void> {
  const user = await requireSessionUser();
  const supabase = await createSupabaseServerClient();
  const patch: Partial<ProfileRow> = {};
  if (input.name !== undefined) patch.name = input.name.trim().slice(0, 80);
  if (input.timezone !== undefined) patch.timezone = input.timezone;
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);
  if (error) throw errors.internal("Could not update your profile.");
}

export async function updateWorkspaceName(name: string): Promise<void> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "ADMIN");
  if (name.trim().length < 2) {
    throw errors.validation("Workspace name must be at least 2 characters.");
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ name: name.trim() })
    .eq("id", ctx.workspace.id);
  if (error) throw errors.internal("Could not rename the workspace.");

  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "workspace.renamed",
    metadata: { name: name.trim() },
  });
}
