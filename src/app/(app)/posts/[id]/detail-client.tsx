"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  ExternalLink,
  Loader2,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelPostAction,
  deletePostAction,
  publishPostAction,
  retryTargetAction,
} from "@/lib/post-actions";
import { PublishProgress } from "@/features/composer/publish-progress";
import { PlatformIcon } from "@/components/social/platform-icon";
import { TargetStatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_META } from "@/lib/constants";
import type { PostDetail } from "@/server/posts";

export function PostDetailClient({ post }: { post: PostDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [retryId, setRetryId] = useState<string | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);

  const isEditable = ["DRAFT", "SCHEDULED", "FAILED"].includes(post.status);

  function act(fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(msg);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function retry(targetId: string) {
    setRetryId(targetId);
    startTransition(async () => {
      const res = await retryTargetAction(targetId);
      setRetryId(null);
      if (res.ok) {
        toast.success("Retrying…");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {post.baseContent || (
                <span className="text-muted-foreground">No content.</span>
              )}
            </p>
            {post.media.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {post.media.map((m) =>
                  m.mimeType.startsWith("video/") ? (
                    <video
                      key={m.id}
                      src={m.url}
                      className="aspect-square w-full rounded object-cover"
                      controls
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={m.id}
                      src={m.url}
                      alt=""
                      className="aspect-square w-full rounded object-cover"
                    />
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publishing status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {post.targets.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No platforms selected for this post.
              </p>
            )}
            {post.targets.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <PlatformIcon platform={t.platform} brand className="size-4" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {PLATFORM_META[t.platform].label}
                    {t.isSandbox && (
                      <Badge variant="muted" className="ml-2 text-[10px]">
                        Sandbox
                      </Badge>
                    )}
                  </p>
                  {t.errorMessage && (
                    <p className="truncate text-xs text-destructive">
                      {t.errorMessage}
                    </p>
                  )}
                  {t.externalUrl && t.status === "PUBLISHED" && (
                    <a
                      href={t.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View post <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <TargetStatusBadge status={t.status} />
                {t.status === "FAILED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => retry(t.id)}
                  >
                    {retryId === t.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <RotateCcw className="size-3.5" />
                    )}
                    Retry
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Card>
          <CardContent className="space-y-2 p-4">
            {post.status === "DRAFT" && post.targets.length > 0 && (
              <Button
                className="w-full"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await publishPostAction(post.id);
                    if (res.ok) setProgressOpen(true);
                    else toast.error(res.error);
                  })
                }
              >
                <Send className="size-4" /> Publish now
              </Button>
            )}
            {isEditable && (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/create?post=${post.id}`}>
                  <Pencil className="size-4" /> Edit
                </Link>
              </Button>
            )}
            {["SCHEDULED", "PUBLISHING"].includes(post.status) && (
              <Button
                variant="outline"
                className="w-full"
                disabled={pending}
                onClick={() =>
                  act(() => cancelPostAction(post.id), "Post cancelled.")
                }
              >
                <Ban className="size-4" /> Cancel
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full text-destructive"
              disabled={pending}
              onClick={() =>
                act(async () => {
                  const res = await deletePostAction(post.id);
                  if (res.ok) router.push("/posts");
                  return res;
                }, "Post deleted.")
              }
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </CardContent>
        </Card>
      </div>

      <PublishProgress
        postId={post.id}
        open={progressOpen}
        onOpenChange={(v) => {
          setProgressOpen(v);
          if (!v) router.refresh();
        }}
      />
    </div>
  );
}
