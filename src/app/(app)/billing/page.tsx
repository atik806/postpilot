import type { Metadata } from "next";
import { Check } from "lucide-react";
import { requireWorkspaceContext } from "@/server/session";
import { getUsage, planLimits } from "@/server/limits";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/constants";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const ctx = await requireWorkspaceContext();
  const usage = await getUsage(ctx.workspace.id);
  const limits = planLimits(ctx.subscription);
  const current = ctx.subscription.plan;

  const rows: { label: string; used: number; limit: number }[] = [
    { label: "Social accounts", used: usage.socialAccounts, limit: limits.socialAccounts },
    { label: "Posts this month", used: usage.postsThisMonth, limit: limits.postsPerMonth },
    { label: "AI generations this month", used: usage.aiCallsThisMonth, limit: limits.aiCallsPerMonth },
    { label: "Team members", used: usage.teamMembers, limit: limits.teamMembers },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Billing"
        description="Your plan, usage and upgrade options."
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            Current plan: {PLANS[current].name}
          </CardTitle>
          <Badge variant={current === "FREE" ? "muted" : "default"}>
            {ctx.subscription.status}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => {
            const unlimited = r.limit < 0;
            const pct = unlimited
              ? 0
              : Math.min(100, Math.round((r.used / Math.max(1, r.limit)) * 100));
            return (
              <div key={r.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-medium">
                    {r.used}
                    {unlimited ? " / ∞" : ` / ${r.limit}`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      pct >= 100 ? "bg-destructive" : "bg-primary",
                    )}
                    style={{ width: `${unlimited ? 8 : pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.values(PLANS).map((plan) => (
          <Card
            key={plan.tier}
            className={cn(
              "flex flex-col",
              plan.recommended && "border-primary shadow-md",
            )}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.recommended && <Badge>Popular</Badge>}
              </div>
              <p className="text-2xl font-semibold">
                ${plan.priceMonthly}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-sm text-muted-foreground">{plan.blurb}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <ul className="flex-1 space-y-2 text-sm">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {h}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.tier === current ? "outline" : "default"}
                disabled={plan.tier === current}
                className="w-full"
              >
                {plan.tier === current ? "Current plan" : `Choose ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Checkout isn&apos;t wired up in this build — plans are managed by an admin.
      </p>
    </PageBody>
  );
}
