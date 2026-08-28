import "server-only";
import { startOfMonth } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { errors } from "@/lib/errors";
import { PLANS } from "@/lib/constants";
import type { PlanLimits, PlanTier } from "@/types";
import type { SubscriptionRow } from "@/types/database.types";

export function planLimits(sub: Pick<SubscriptionRow, "plan" | "limits">): PlanLimits {
  const base = PLANS[sub.plan as PlanTier].limits;
  const override =
    sub.limits && typeof sub.limits === "object" && !Array.isArray(sub.limits)
      ? (sub.limits as Partial<PlanLimits>)
      : {};
  return { ...base, ...override };
}

export interface UsageSnapshot {
  socialAccounts: number;
  postsThisMonth: number;
  aiCallsThisMonth: number;
  teamMembers: number;
}

export async function getUsage(workspaceId: string): Promise<UsageSnapshot> {
  const supabase = await createSupabaseServerClient();
  const monthStart = startOfMonth(new Date()).toISOString();

  const [accounts, posts, ai, members] = await Promise.all([
    supabase
      .from("social_accounts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .neq("status", "DISCONNECTED"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", monthStart),
    supabase
      .from("ai_content")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", monthStart),
    supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
  ]);

  return {
    socialAccounts: accounts.count ?? 0,
    postsThisMonth: posts.count ?? 0,
    aiCallsThisMonth: ai.count ?? 0,
    teamMembers: members.count ?? 0,
  };
}

type LimitedAction =
  | "connect_social_account"
  | "create_post"
  | "ai_call"
  | "invite_member";

const unlimited = (n: number) => n < 0;

/**
 * Central plan-limit gate (spec §28 — "do not hard-code limits throughout the
 * application. Create a subscription/feature-limit service.").
 */
export async function assertWithinPlan(
  workspaceId: string,
  sub: Pick<SubscriptionRow, "plan" | "limits">,
  action: LimitedAction,
): Promise<void> {
  const limits = planLimits(sub);
  const usage = await getUsage(workspaceId);

  switch (action) {
    case "connect_social_account":
      if (!unlimited(limits.socialAccounts) && usage.socialAccounts >= limits.socialAccounts) {
        throw errors.planLimit(
          `Your plan includes ${limits.socialAccounts} social accounts. Upgrade to connect more.`,
          { action: "upgrade" },
        );
      }
      return;
    case "create_post":
      if (!unlimited(limits.postsPerMonth) && usage.postsThisMonth >= limits.postsPerMonth) {
        throw errors.planLimit(
          `You've used all ${limits.postsPerMonth} posts on your plan this month. Upgrade for more.`,
          { action: "upgrade" },
        );
      }
      return;
    case "ai_call":
      if (!unlimited(limits.aiCallsPerMonth) && usage.aiCallsThisMonth >= limits.aiCallsPerMonth) {
        throw errors.planLimit(
          `You've reached your monthly AI usage limit (${limits.aiCallsPerMonth}). Upgrade for more.`,
          { action: "upgrade" },
        );
      }
      return;
    case "invite_member":
      if (!unlimited(limits.teamMembers) && usage.teamMembers >= limits.teamMembers) {
        throw errors.planLimit(
          `Your plan includes ${limits.teamMembers} team member(s). Upgrade to add more.`,
          { action: "upgrade" },
        );
      }
      return;
  }
}

/** Persist a coarse usage snapshot onto the subscription (best effort). */
export async function refreshUsageSnapshot(workspaceId: string): Promise<void> {
  const usage = await getUsage(workspaceId);
  const admin = createSupabaseServiceRoleClient();
  await admin
    .from("subscriptions")
    .update({ usage: { ...usage, updatedAt: new Date().toISOString() } })
    .eq("workspace_id", workspaceId);
}
