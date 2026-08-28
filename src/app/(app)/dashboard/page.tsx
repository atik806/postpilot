import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  FileEdit,
  PlusCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { getDashboardData } from "@/server/dashboard";
import { PageBody } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import { EmptyState } from "@/components/common/empty-state";
import { PostStatusBadge } from "@/components/common/status-badge";
import { PlatformIcon } from "@/components/social/platform-icon";
import { AccountStatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/constants";
import { PLATFORMS } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <PageBody>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {data.greetingName} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your social media today.
          </p>
        </div>
        <Button asChild>
          <Link href="/create">
            <PlusCircle className="size-4" /> Create Post
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Published"
          value={formatNumber(data.stats.published)}
          icon={<CheckCircle2 className="size-4" />}
          hint="all time"
        />
        <MetricCard
          label="Scheduled"
          value={formatNumber(data.stats.scheduled)}
          icon={<CalendarClock className="size-4" />}
          hint={
            data.upcoming[0]
              ? `next ${new Date(data.upcoming[0].scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
              : "nothing queued"
          }
        />
        <MetricCard
          label="Drafts"
          value={formatNumber(data.stats.drafts)}
          icon={<FileEdit className="size-4" />}
          hint={data.stats.failed > 0 ? `${data.stats.failed} failed` : "in progress"}
        />
        <MetricCard
          label="Engagement"
          value={
            data.analytics.hasData && data.analytics.engagementRate != null
              ? `${data.analytics.engagementRate}%`
              : "—"
          }
          icon={<Sparkles className="size-4" />}
          hint={
            data.analytics.hasData
              ? `${formatNumber(data.analytics.reach ?? 0)} reach`
              : "connect a platform to see analytics"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Upcoming posts</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/calendar">View calendar</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Nothing scheduled"
                  description="Schedule a post and it will show up here and on your calendar."
                  action={
                    <Button asChild size="sm">
                      <Link href="/create">Create a post</Link>
                    </Button>
                  }
                />
              ) : (
                data.upcoming.map((p) => (
                  <Link
                    key={p.id}
                    href={`/posts/${p.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    {p.thumbnailUrl ? (
                      <Image
                        src={p.thumbnailUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="size-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Send className="size-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {p.title || p.excerpt || "Untitled post"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.scheduledAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {p.platforms.map((pl) => (
                        <PlatformIcon key={pl} platform={pl} className="size-4 text-muted-foreground" />
                      ))}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent posts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No posts yet.
                </p>
              ) : (
                data.recent.map((p) => (
                  <Link
                    key={p.id}
                    href={`/posts/${p.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.title || p.excerpt || "Untitled post"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {p.platforms.map((t) => (
                          <span
                            key={t.platform}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                          >
                            <PlatformIcon platform={t.platform} className="size-3" />
                            {t.status === "PUBLISHED" ? "✓" : t.status === "FAILED" ? "✕" : "•"}
                          </span>
                        ))}
                      </div>
                    </div>
                    <PostStatusBadge status={p.status as never} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Connected accounts</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/social-accounts">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {PLATFORMS.map((platform) => {
                const account = data.connectedAccounts.find(
                  (a) => a.platform === platform,
                );
                return (
                  <div
                    key={platform}
                    className="flex items-center justify-between gap-2 rounded-md border p-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <PlatformIcon platform={platform} brand className="size-4" />
                      {PLATFORM_META[platform].label}
                    </span>
                    {account ? (
                      <span className="flex items-center gap-1.5">
                        {account.isSandbox && (
                          <Badge variant="muted" className="text-[10px]">
                            Sandbox
                          </Badge>
                        )}
                        <AccountStatusBadge status={account.status as never} />
                      </span>
                    ) : (
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link href="/social-accounts">Connect</Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <UsageRow
                label="Social accounts"
                used={data.usage.socialAccounts}
                limit={data.limits.socialAccounts}
              />
              <UsageRow
                label="Posts this month"
                used={data.usage.postsThisMonth}
                limit={data.limits.postsPerMonth}
              />
              <UsageRow
                label="AI generations"
                used={data.usage.aiCallsThisMonth}
                limit={data.limits.aiCallsPerMonth}
              />
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/billing">Manage plan</Link>
              </Button>
            </CardContent>
          </Card>

          {data.stats.failed > 0 && (
            <Card className="border-destructive/40">
              <CardContent className="flex items-start gap-3 p-4">
                <CircleAlert className="mt-0.5 size-4 text-destructive" />
                <div className="text-sm">
                  <p className="font-medium">
                    {data.stats.failed} post{data.stats.failed > 1 ? "s" : ""} failed to publish
                  </p>
                  <Link href="/posts?filter=failed" className="text-primary hover:underline">
                    Review and retry
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageBody>
  );
}

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used}
          {unlimited ? "" : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
