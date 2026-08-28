import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errors } from "@/lib/errors";
import type { WorkspaceRole } from "@/types";
import type {
  ProfileRow,
  SubscriptionRow,
  WorkspaceRow,
} from "@/types/database.types";

export const ACTIVE_WORKSPACE_COOKIE = "pp_workspace";

export interface SessionUser {
  id: string;
  email: string;
  profile: ProfileRow;
}

export interface WorkspaceContext {
  user: SessionUser;
  workspace: WorkspaceRow;
  role: WorkspaceRole;
  subscription: SubscriptionRow;
  /** All workspaces the user belongs to (for the switcher). */
  memberships: { workspace: WorkspaceRow; role: WorkspaceRole }[];
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return { id: user.id, email: user.email ?? profile.email, profile };
});

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw errors.unauthenticated();
  return user;
}

export const getWorkspaceContext = cache(
  async (): Promise<WorkspaceContext | null> => {
    const user = await getSessionUser();
    if (!user) return null;

    const supabase = await createSupabaseServerClient();
    const { data: memberRows } = await supabase
      .from("workspace_members")
      .select("role, workspace:workspaces(*)")
      .eq("user_id", user.id);

    const memberships = (memberRows ?? [])
      .filter((m): m is typeof m & { workspace: WorkspaceRow } =>
        Boolean(m.workspace),
      )
      .map((m) => ({
        workspace: m.workspace as WorkspaceRow,
        role: m.role as WorkspaceRole,
      }))
      .sort((a, b) => a.workspace.name.localeCompare(b.workspace.name));

    if (memberships.length === 0) return null;

    const cookieStore = await cookies();
    const preferredId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
    const active =
      memberships.find((m) => m.workspace.id === preferredId) ?? memberships[0];

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("workspace_id", active.workspace.id)
      .single();

    if (!subscription) return null;

    return {
      user,
      workspace: active.workspace,
      role: active.role,
      subscription,
      memberships,
    };
  },
);

export async function requireWorkspaceContext(): Promise<WorkspaceContext> {
  const ctx = await getWorkspaceContext();
  if (!ctx) {
    const user = await getSessionUser();
    if (!user) throw errors.unauthenticated();
    // Signed in but no workspace yet → caller should route to onboarding.
    throw errors.notFound("No workspace. Complete onboarding first.");
  }
  return ctx;
}

const RANK: Record<WorkspaceRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function assertRole(
  ctx: WorkspaceContext,
  minimum: WorkspaceRole,
): void {
  if (RANK[ctx.role] < RANK[minimum]) {
    throw errors.forbidden(
      `This action requires the ${minimum} role or higher.`,
    );
  }
}
