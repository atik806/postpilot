import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser, getWorkspaceContext } from "@/server/session";
import { AppShell } from "@/components/layout/app-shell";
import { PLANS } from "@/lib/constants";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/onboarding");

  return (
    <TooltipProvider delayDuration={200}>
      <AppShell
        workspace={{ id: ctx.workspace.id, name: ctx.workspace.name }}
        memberships={ctx.memberships.map((m) => ({
          workspace: { id: m.workspace.id, name: m.workspace.name },
          role: m.role,
        }))}
        user={{
          name: ctx.user.profile.name,
          email: ctx.user.email,
          avatarUrl: ctx.user.profile.avatar_url,
        }}
        planName={PLANS[ctx.subscription.plan].name}
      >
        {children}
      </AppShell>
    </TooltipProvider>
  );
}
