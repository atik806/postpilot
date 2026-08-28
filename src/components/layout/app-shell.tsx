"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeft, PlusCircle, X } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/layout/nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { CommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkspaceRole } from "@/types";

interface Props {
  children: ReactNode;
  workspace: { id: string; name: string };
  memberships: { workspace: { id: string; name: string }; role: WorkspaceRole }[];
  user: { name: string | null; email: string; avatarUrl: string | null };
  planName: string;
  children_key?: string;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = [
    { key: "main", label: null },
    { key: "workspace", label: "Workspace" },
  ] as const;

  return (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-4">
      {groups.map((group) => (
        <div key={group.key} className="space-y-1">
          {group.label && (
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
          )}
          {NAV_ITEMS.filter((i) => i.group === group.key).map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  children,
  workspace,
  memberships,
  user,
  planName,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-card transition-[width] lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          {collapsed ? (
            <LogoMark className="text-primary" />
          ) : (
            <Logo />
          )}
        </div>
        {!collapsed && (
          <div className="px-3 pt-3">
            <WorkspaceSwitcher active={workspace} memberships={memberships} />
          </div>
        )}
        {collapsed ? (
          <nav className="flex flex-1 flex-col items-center gap-1 py-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <item.icon className="size-4" />
              </Link>
            ))}
          </nav>
        ) : (
          <NavLinks />
        )}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" /> Collapse
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="px-3 pt-3">
              <WorkspaceSwitcher active={workspace} memberships={memberships} />
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <CommandPalette />
          <div className="flex-1" />
          <Badge variant="muted" className="hidden sm:inline-flex">
            {planName} plan
          </Badge>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/create">
              <PlusCircle className="size-4" /> Create Post
            </Link>
          </Button>
          <ThemeToggle />
          <UserMenu
            name={user.name}
            email={user.email}
            avatarUrl={user.avatarUrl}
          />
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
