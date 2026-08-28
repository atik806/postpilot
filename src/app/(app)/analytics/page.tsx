import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { getAnalyticsData } from "@/server/analytics";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { AnalyticsCharts } from "./analytics-charts";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const data = await getAnalyticsData(30);

  return (
    <PageBody>
      <PageHeader
        title="Analytics"
        description="Track your social performance across every platform."
        actions={<Badge variant="muted">Last {data.rangeDays} days</Badge>}
      />

      {!data.hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description={
            data.planIncludesAnalytics
              ? "Analytics populate automatically once your connected platforms report engagement on published posts. PostPilot never shows placeholder numbers."
              : "Advanced analytics are available on the Pro plan. You'll also need real platform connections — analytics are never simulated."
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Reach" value={formatNumber(data.totals.reach)} />
            <MetricCard
              label="Engagement"
              value={`${data.totals.engagementRate}%`}
            />
            <MetricCard label="Likes" value={formatNumber(data.totals.likes)} />
            <MetricCard
              label="Comments"
              value={formatNumber(data.totals.comments)}
            />
          </div>
          <AnalyticsCharts data={data} />
        </>
      )}
    </PageBody>
  );
}
