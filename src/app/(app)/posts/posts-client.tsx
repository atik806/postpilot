"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Copy,
  FileText,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  deletePostAction,
  duplicatePostAction,
} from "@/lib/post-actions";
import { PlatformIcon } from "@/components/social/platform-icon";
import { PostStatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PostListItem } from "@/server/posts";
import type { PostStatus } from "@/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "failed", label: "Failed" },
] as const;

export function PostsClient({
  posts,
  filter,
  search,
}: {
  posts: PostListItem[];
  filter: string;
  search: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [pending, startTransition] = useTransition();

  function applyParams(next: { filter?: string; search?: string }) {
    const params = new URLSearchParams();
    const f = next.filter ?? filter;
    const s = next.search ?? query;
    if (f && f !== "all") params.set("filter", f);
    if (s.trim()) params.set("search", s.trim());
    router.push(`/posts${params.toString() ? `?${params}` : ""}`);
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deletePostAction(id);
      if (res.ok) {
        toast.success("Post deleted.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function onDuplicate(id: string) {
    startTransition(async () => {
      const res = await duplicatePostAction(id);
      if (res.ok) router.push(`/create?post=${res.data!.id}`);
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => applyParams({ filter: f.key })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                (filter || "all") === f.key
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyParams({ search: query });
          }}
          className="relative sm:w-64"
        >
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="pl-8"
          />
        </form>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No posts here yet"
          description="Create your first post and publish it across all your platforms."
          action={
            <Button asChild>
              <Link href="/create">Create Post</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Post</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Platforms</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((p) => (
                <tr key={p.id} className={cn("hover:bg-accent/40", pending && "opacity-70")}>
                  <td className="px-4 py-3">
                    <Link href={`/posts/${p.id}`} className="flex items-center gap-3">
                      {p.thumbnailUrl ? (
                        <Image
                          src={p.thumbnailUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded bg-muted text-muted-foreground">
                          <FileText className="size-4" />
                        </div>
                      )}
                      <span className="line-clamp-2 max-w-xs font-medium">
                        {p.title || p.excerpt || "Untitled post"}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex gap-1">
                      {p.platforms.map((pl) => (
                        <PlatformIcon
                          key={pl}
                          platform={pl}
                          className="size-4 text-muted-foreground"
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PostStatusBadge status={p.status as PostStatus} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {p.scheduledAt
                      ? new Date(p.scheduledAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/create?post=${p.id}`}>
                            <Pencil className="size-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDuplicate(p.id)}>
                          <Copy className="size-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => onDelete(p.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
