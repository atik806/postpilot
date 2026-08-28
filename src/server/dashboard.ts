import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireWorkspaceContext } from "@/server/session";
import { getUsage, planLimits } from "@/server/limits";
import { signedUrl } from "@/server/media";
import type { Platform } from "@/types";

export interface DashboardData {
  greetingName: string;
  stats: {
    published: number;
    scheduled: number;
    failed: number;
    drafts: number;
  };
  analytics: {
    hasData: boolean;
    reach: number | null;
    engagementRate: number | null;
  };
  upcoming: {
    id: string;
    title: string | null;
    excerpt: string;
    scheduledAt: string;
    platforms: Platform[];
    thumbnailUrl: string | null;
  }[];
  recent: {
    id: string;
    title: string | null;
    excerpt: string;
    status: string;
    platforms: { platform: Platform; status: string }[];
  }[];
  connectedAccounts: { platform: Platform; accountName: string; status: string; isSandbox: boolean }[];
  usage: Awaited<ReturnType<typeof getUsage>>;
  limits: ReturnType<typeof planLimits>;
}

export async function getDashboardData(): Promise<DashboardData> {
  const ctx = await requireWorkspaceContext();
  const supabase = await createSupabaseServerClient();
  const wsId = ctx.workspace.id;

  const [
    published,
    scheduled,
    failed,
    drafts,
    upcomingRows,
    recentRows,
    accounts,
    analyticsRows,
    usage,
  ] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).in("status", ["PUBLISHED", "PARTIALLY_PUBLISHED"]),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "SCHEDULED"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "FAILED"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "DRAFT"),
    supabase
      .from("posts")
      .select("id, title, base_content, scheduled_at, targets:post_targets(platform), media:post_media(sort_order, media:media(storage_path))")
      .eq("workspace_id", wsId)
      .eq("status", "SCHEDULED")
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("posts")
      .select("id, title, base_content, status, targets:post_targets(platform, status)")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("social_accounts")
      .select("platform, account_name, status, is_sandbox")
      .eq("workspace_id", wsId)
      .neq("status", "DISCONNECTED"),
    supabase
      .from("analytics")
      .select("reach, engagement_rate")
      .eq("workspace_id", wsId)
      .order("recorded_at", { ascending: false })
      .limit(200),
    getUsage(wsId),
  ]);

  const analyticsData = analyticsRows.data ?? [];
  const reachValues = analyticsData.map((a) => a.reach).filter((v): v is number => v != null);
  const engagementValues = analyticsData
    .map((a) => a.engagement_rate)
    .filter((v): v is number => v != null);

  const upcoming = [];
  for (const p of upcomingRows.data ?? []) {
    const firstPath = (p.media as { sort_order: number; media: { storage_path: string } | null }[])
      ?.sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => m.media?.storage_path)
      .find(Boolean);
    upcoming.push({
      id: p.id,
      title: p.title,
      excerpt: p.base_content.slice(0, 100),
      scheduledAt: p.scheduled_at as string,
      platforms: [...new Set(((p.targets as { platform: Platform }[]) ?? []).map((t) => t.platform))],
      thumbnailUrl: firstPath ? await signedUrl(firstPath, 3600) : null,
    });
  }

  return {
    greetingName: ctx.user.profile.name?.split(" ")[0] ?? "there",
    stats: {
      published: published.count ?? 0,
      scheduled: scheduled.count ?? 0,
      failed: failed.count ?? 0,
      drafts: drafts.count ?? 0,
    },
    analytics: {
      hasData: reachValues.length > 0,
      reach: reachValues.length ? reachValues.reduce((a, b) => a + b, 0) : null,
      engagementRate: engagementValues.length
        ? Number(
            (
              engagementValues.reduce((a, b) => a + b, 0) / engagementValues.length
            ).toFixed(2),
          )
        : null,
    },
    upcoming,
    recent: (recentRows.data ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: p.base_content.slice(0, 100),
      status: p.status,
      platforms: ((p.targets as { platform: Platform; status: string }[]) ?? []).map(
        (t) => ({ platform: t.platform, status: t.status }),
      ),
    })),
    connectedAccounts: (accounts.data ?? []).map((a) => ({
      platform: a.platform,
      accountName: a.account_name,
      status: a.status,
      isSandbox: a.is_sandbox,
    })),
    usage,
    limits: planLimits(ctx.subscription),
  };
}
