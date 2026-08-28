"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Loader2,
  PartyPopper,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { getPostStatusAction, retryTargetAction } from "@/lib/post-actions";
import { PlatformIcon } from "@/components/social/platform-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PostDetail } from "@/server/posts";
import { PLATFORM_META } from "@/lib/constants";

export function PublishProgress({
  postId,
  open,
  onOpenChange,
}: {
  postId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const res = await getPostStatusAction(postId);
      if (!active) return;
      if (res.ok) {
        setDetail(res.data!);
        const settled = res.data!.targets.every((t) =>
          ["PUBLISHED", "FAILED", "CANCELLED"].includes(t.status),
        );
        if (!settled) timer = setTimeout(poll, 1500);
      }
    }
    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, postId]);

  const targets = detail?.targets ?? [];
  const done = targets.length > 0 && targets.every((t) =>
    ["PUBLISHED", "FAILED", "CANCELLED"].includes(t.status),
  );
  const succeeded = targets.filter((t) => t.status === "PUBLISHED").length;
  const failed = targets.filter((t) => t.status === "FAILED").length;

  async function retry(targetId: string) {
    setRetrying(targetId);
    const res = await retryTargetAction(targetId);
    setRetrying(null);
    if (res.ok) {
      const fresh = await getPostStatusAction(postId);
      if (fresh.ok) setDetail(fresh.data!);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {!done
              ? "Publishing your post…"
              : failed === 0
                ? "Your post has been published!"
                : "Some platforms couldn't publish"}
          </DialogTitle>
        </DialogHeader>

        {done && failed === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
            <PartyPopper className="size-4" />
            {succeeded}/{targets.length} platforms successful.
          </div>
        )}

        <ul className="space-y-2">
          {targets.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <PlatformIcon platform={t.platform} brand className="size-4" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {PLATFORM_META[t.platform].label}
                </p>
                {t.status === "FAILED" && t.errorMessage && (
                  <p className="truncate text-xs text-destructive">
                    {t.errorMessage}
                  </p>
                )}
                {t.status === "PUBLISHED" && t.isSandbox && (
                  <p className="text-xs text-muted-foreground">
                    Sandbox — simulated publish
                  </p>
                )}
              </div>
              {t.status === "PUBLISHED" ? (
                <CheckCircle2 className="size-5 text-success" />
              ) : t.status === "PUBLISHING" ? (
                <Loader2 className="size-5 animate-spin text-warning-foreground" />
              ) : t.status === "FAILED" ? (
                <div className="flex items-center gap-2">
                  <XCircle className="size-5 text-destructive" />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={retrying === t.id}
                    onClick={() => retry(t.id)}
                  >
                    {retrying === t.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <RotateCcw className="size-3.5" />
                    )}
                    Retry
                  </Button>
                </div>
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
            </li>
          ))}
        </ul>

        {done && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button asChild>
              <Link href="/posts">View posts</Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
