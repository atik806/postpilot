"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { schedulePostAction } from "@/lib/post-actions";
import { PlatformIcon } from "@/components/social/platform-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Platform } from "@/types";

interface CalPost {
  id: string;
  title: string | null;
  excerpt: string;
  status: string;
  scheduledAt: string | null;
  platforms: Platform[];
}

export function CalendarClient({ posts }: { posts: CalPost[] }) {
  const router = useRouter();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<CalPost | null>(null);
  const [when, setWhen] = useState("");
  const [pending, startTransition] = useTransition();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalPost[]>();
    for (const p of posts) {
      if (!p.scheduledAt) continue;
      const key = format(new Date(p.scheduledAt), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return map;
  }, [posts]);

  function reschedule() {
    if (!selected || !when) return;
    startTransition(async () => {
      const res = await schedulePostAction(
        selected.id,
        new Date(when).toISOString(),
      );
      if (res.ok) {
        toast.success("Rescheduled.");
        setSelected(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(subMonths(cursor, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-40 text-center text-sm font-semibold">
            {format(cursor, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
        </div>
        <Button asChild size="sm">
          <Link href="/create">
            <PlusCircle className="size-4" /> Create Post
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="p-2 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = byDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={cn(
                  "min-h-28 border-b border-r p-1.5",
                  !isSameMonth(day, cursor) && "bg-muted/30 text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "mb-1 flex size-6 items-center justify-center rounded-full text-xs",
                    isSameDay(day, new Date()) &&
                      "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {items.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelected(p);
                        setWhen(
                          p.scheduledAt
                            ? format(new Date(p.scheduledAt), "yyyy-MM-dd'T'HH:mm")
                            : "",
                        );
                      }}
                      className="w-full truncate rounded bg-primary/10 px-1.5 py-1 text-left text-xs text-primary hover:bg-primary/20"
                    >
                      {p.scheduledAt && format(new Date(p.scheduledAt), "h:mma ")}
                      {p.title || p.excerpt || "Post"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="truncate">
              {selected?.title || selected?.excerpt || "Scheduled post"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-1.5">
            {selected?.platforms.map((pl) => (
              <PlatformIcon key={pl} platform={pl} className="size-4 text-muted-foreground" />
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cal-when">Reschedule to</Label>
            <Input
              id="cal-when"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <Button asChild variant="ghost">
              <Link href={`/posts/${selected?.id}`}>Open post</Link>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button onClick={reschedule} disabled={pending || !when}>
                {pending && <Loader2 className="animate-spin" />}
                Reschedule
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
