import "server-only";
import { subDays } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireWorkspaceContext } from "@/server/session";
import { planLimits } from "@/server/limits";
import type { Platform } from "@/types";

export interface AnalyticsData {
  /** Analytics is only populated from real platform syncs — never fabricated. */
  hasData: boolean;
  planIncludesAnalytics: boolean;
  rangeDays: number;
  totals: {
    reach: number;
    engagementRate: number;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    clicks: number;
  };
  reachOverTime: { date: string; reach: number }[];
  engagementByPlatform: { platform: Platform; engagementRate: number }[];
  postCounts: { published: number; failed: number; scheduled: number };
}

export async function getAnalyticsData(rangeDays = 30): Promise<AnalyticsData> {
  const ctx = await requireWorkspaceContext();
  const supabase = await createSupabaseServerClient();
  const wsId = ctx.workspace.id;
  const since = subDays(new Date(), rangeDays).toISOString();

  const [{ data: rows }, published, failed, scheduled] = await Promise.all([
    supabase
      .from("analytics")
      .select("*")
      .eq("workspace_id", wsId)
      .gte("recorded_at", since),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).in("status", ["PUBLISHED", "PARTIALLY_PUBLISHED"]).gte("created_at", since),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "FAILED").gte("created_at", since),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "SCHEDULED"),
  ]);

  const data = rows ?? [];
  const sum = (k: keyof (typeof data)[number]) =>
    data.reduce((acc, r) => acc + (Number(r[k]) || 0), 0);

  const byDate = new Map<string, number>();
  for (const r of data) {
    const d = r.recorded_at.slice(0, 10);
    byDate.set(d, (byDate.get(d) ?? 0) + (r.reach ?? 0));
  }

  const byPlatform = new Map<Platform, number[]>();
  for (const r of data) {
    if (r.engagement_rate == null) continue;
    const arr = byPlatform.get(r.platform) ?? [];
    arr.push(r.engagement_rate);
    byPlatform.set(r.platform, arr);
  }

  const engagementRates = data
    .map((r) => r.engagement_rate)
    .filter((v): v is number => v != null);

  return {
    hasData: data.length > 0,
    planIncludesAnalytics: planLimits(ctx.subscription).analytics,
    rangeDays,
    totals: {
      reach: sum("reach"),
      engagementRate: engagementRates.length
        ? Number(
            (engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length).toFixed(2),
          )
        : 0,
      likes: sum("likes"),
      comments: sum("comments"),
      shares: sum("shares"),
      views: sum("views"),
      clicks: sum("clicks"),
    },
    reachOverTime: [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, reach]) => ({ date, reach })),
    engagementByPlatform: [...byPlatform.entries()].map(([platform, vals]) => ({
      platform,
      engagementRate: Number(
        (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
      ),
    })),
    postCounts: {
      published: published.count ?? 0,
      failed: failed.count ?? 0,
      scheduled: scheduled.count ?? 0,
    },
  };
}
