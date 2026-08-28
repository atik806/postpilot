import "server-only";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { errors } from "@/lib/errors";
import { recordAudit } from "@/server/audit";
import {
  ACTIVE_WORKSPACE_COOKIE,
  assertRole,
  requireSessionUser,
  requireWorkspaceContext,
} from "@/server/session";
import type { WorkspaceRole } from "@/types";
import type { ProfileRow } from "@/types/database.types";

export async function createWorkspace(name: string): Promise<string> {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw errors.validation("Workspace name must be at least 2 characters.");
  }
  const user = await requireSessionUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_workspace", {
    workspace_name: trimmed,
  });
  if (error || !data) {
    throw errors.internal("Could not create the workspace.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, data, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  await recordAudit({
    workspaceId: data,
    actorId: user.id,
    action: "workspace.created",
    targetType: "workspace",
    targetId: data,
    metadata: { name: trimmed },
  });

  return data;
}

export async function setActiveWorkspace(workspaceId: string): Promise<void> {
  const user = await requireSessionUser();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw errors.forbidden("You're not a member of that workspace.");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export interface WorkspaceMemberView {
  id: string;
  role: WorkspaceRole;
  createdAt: string;
  profile: Pick<ProfileRow, "id" | "name" | "email" | "avatar_url">;
}

export async function listMembers(): Promise<WorkspaceMemberView[]> {
  const ctx = await requireWorkspaceContext();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("id, role, created_at, profile:profiles(id, name, email, avatar_url)")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: true });

  return (data ?? [])
    .filter((m) => m.profile)
    .map((m) => ({
      id: m.id,
      role: m.role as WorkspaceRole,
      createdAt: m.created_at,
      profile: m.profile as WorkspaceMemberView["profile"],
    }));
}

export async function updateMemberRole(
  memberId: string,
  role: WorkspaceRole,
): Promise<void> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "ADMIN");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) throw errors.internal("Could not update the member's role.");

  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "member.role_changed",
    targetType: "workspace_member",
    targetId: memberId,
    metadata: { role },
  });
}

export async function removeMember(memberId: string): Promise<void> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "ADMIN");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) throw errors.internal("Could not remove the member.");

  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "member.removed",
    targetType: "workspace_member",
    targetId: memberId,
  });
}

/**
 * Invite by email. If the person already has a PostPilot account they're added
 * immediately; otherwise this records the intent (email delivery is out of
 * scope for this build).
 */
export async function inviteMember(
  email: string,
  role: WorkspaceRole,
): Promise<{ added: boolean }> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx, "ADMIN");
  const admin = createSupabaseServiceRoleClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (!profile) {
    await recordAudit({
      workspaceId: ctx.workspace.id,
      actorId: ctx.user.id,
      action: "member.invited",
      metadata: { email, role, delivered: false },
    });
    return { added: false };
  }

  const { error } = await admin.from("workspace_members").upsert(
    {
      workspace_id: ctx.workspace.id,
      user_id: profile.id,
      role,
    },
    { onConflict: "workspace_id,user_id" },
  );
  if (error) throw errors.internal("Could not add the member.");

  await recordAudit({
    workspaceId: ctx.workspace.id,
    actorId: ctx.user.id,
    action: "member.added",
    targetType: "profile",
    targetId: profile.id,
    metadata: { role },
  });
  return { added: true };
}
