"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Plug, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  connectAccountAction,
  disconnectAccountAction,
} from "@/lib/social-actions";
import { PlatformIcon } from "@/components/social/platform-icon";
import { AccountStatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PLATFORM_META, PLATFORM_LIST } from "@/lib/constants";
import type { Platform, SocialAccountStatus } from "@/types";

interface AccountView {
  id: string;
  platform: Platform;
  accountName: string;
  status: SocialAccountStatus;
  isSandbox: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
}

export function AccountsClient({
  accounts,
  modes,
}: {
  accounts: AccountView[];
  modes: Record<Platform, { sandbox: boolean }>;
}) {
  const [pendingPlatform, setPendingPlatform] = useState<Platform | null>(null);
  const [isPending, startTransition] = useTransition();

  function connect(platform: Platform, reauthAccountId?: string) {
    setPendingPlatform(platform);
    startTransition(async () => {
      const res = await connectAccountAction(platform, reauthAccountId);
      if (res.ok) {
        window.location.href = res.data!.authUrl;
      } else {
        toast.error(res.error);
        setPendingPlatform(null);
      }
    });
  }

  function disconnect(id: string) {
    startTransition(async () => {
      const res = await disconnectAccountAction(id);
      if (res.ok) toast.success("Account disconnected.");
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2">
        {accounts.length === 0 && (
          <EmptyState
            className="md:col-span-2"
            icon={Plug}
            title="No accounts connected yet"
            description="Connect a platform below to start publishing. No credentials? Platforms connect in Sandbox mode so you can try the full flow."
          />
        )}
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg border">
                    <PlatformIcon platform={account.platform} brand className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium">{PLATFORM_META[account.platform].label}</p>
                    <p className="text-sm text-muted-foreground">{account.accountName}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <AccountStatusBadge status={account.status} />
                  {account.isSandbox && <Badge variant="muted">Sandbox mode</Badge>}
                </div>
              </div>

              {account.status === "REAUTH_REQUIRED" && (
                <p className="flex items-center gap-2 rounded-md bg-warning/10 p-2 text-xs text-warning-foreground">
                  <TriangleAlert className="size-3.5" />
                  This account needs to be reconnected before it can publish.
                </p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {account.lastSyncedAt
                    ? `Synced ${formatDistanceToNow(new Date(account.lastSyncedAt), { addSuffix: true })}`
                    : "Not synced yet"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => connect(account.platform, account.id)}
                  >
                    <RefreshCw className="size-3.5" /> Reconnect
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => disconnect(account.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Connect a platform
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_LIST.map((meta) => (
            <div
              key={meta.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium">
                <PlatformIcon platform={meta.id} brand className="size-5" />
                {meta.label}
              </span>
              <div className="flex items-center gap-2">
                {modes[meta.id].sandbox && (
                  <Badge variant="muted" className="text-[10px]">
                    Sandbox
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => connect(meta.id)}
                >
                  {isPending && pendingPlatform === meta.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Real OAuth activates automatically once you add a platform&apos;s
          <code className="mx-1 rounded bg-muted px-1">CLIENT_ID</code>/
          <code className="mx-1 rounded bg-muted px-1">CLIENT_SECRET</code>.
        </p>
      </section>
    </div>
  );
}
