"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  publishPostAction,
  savePostAction,
  schedulePostAction,
} from "@/lib/post-actions";
import { MediaUploader, type MediaItem } from "./media-uploader";
import { PlatformPreview } from "./platform-preview";
import { AiAssist } from "./ai-assist";
import { PublishProgress } from "./publish-progress";
import { PlatformIcon } from "@/components/social/platform-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/constants";
import type { Platform } from "@/types";
import type { PostDetail } from "@/server/posts";

interface AccountOption {
  id: string;
  platform: Platform;
  accountName: string;
}

export function PostComposer({
  initialPost,
  accounts,
  aiConfigured,
}: {
  initialPost: PostDetail | null;
  accounts: AccountOption[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [postId, setPostId] = useState(initialPost?.id ?? null);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [baseContent, setBaseContent] = useState(initialPost?.baseContent ?? "");
  const [overrides, setOverrides] = useState<Partial<Record<Platform, string>>>(
    () => {
      const o: Partial<Record<Platform, string>> = {};
      for (const t of initialPost?.targets ?? []) {
        if (t.edited) o[t.platform] = t.content;
      }
      return o;
    },
  );
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(
    () => initialPost?.targets.map((t) => t.socialAccountId) ?? [],
  );
  const [media, setMedia] = useState<MediaItem[]>(
    () =>
      initialPost?.media.map((m) => ({
        id: m.id,
        url: m.url,
        mimeType: m.mimeType,
      })) ?? [],
  );

  const selectedPlatforms = useMemo(
    () => [
      ...new Set(
        accounts
          .filter((a) => selectedAccountIds.includes(a.id))
          .map((a) => a.platform),
      ),
    ],
    [accounts, selectedAccountIds],
  );

  const [previewPlatform, setPreviewPlatform] = useState<Platform>(
    selectedPlatforms[0] ?? accounts[0]?.platform ?? "linkedin",
  );
  const activePreview = selectedPlatforms.includes(previewPlatform)
    ? previewPlatform
    : (selectedPlatforms[0] ?? "linkedin");

  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"save" | "publish" | "schedule" | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");
  const [progressOpen, setProgressOpen] = useState(false);

  const contentFor = (p: Platform) => overrides[p] ?? baseContent;

  function toggleAccount(id: string) {
    setSelectedAccountIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }

  function buildInput() {
    const platformContent: Partial<Record<Platform, string>> = {};
    for (const p of selectedPlatforms) {
      if (overrides[p] !== undefined) platformContent[p] = overrides[p];
    }
    return {
      id: postId ?? undefined,
      title: title.trim() || null,
      baseContent,
      platformContent,
      mediaIds: media.map((m) => m.id),
      accountIds: selectedAccountIds,
    };
  }

  async function persist(): Promise<string | null> {
    const res = await savePostAction(buildInput());
    if (!res.ok) {
      toast.error(res.error);
      return null;
    }
    setPostId(res.data!.id);
    return res.data!.id;
  }

  function onSaveDraft() {
    setMode("save");
    startTransition(async () => {
      const id = await persist();
      setMode(null);
      if (id) {
        toast.success("Draft saved.");
        router.push(`/posts/${id}`);
      }
    });
  }

  function onPublish() {
    if (!baseContent.trim()) return toast.error("Write some content first.");
    if (selectedAccountIds.length === 0)
      return toast.error("Select at least one account.");
    setMode("publish");
    startTransition(async () => {
      const id = await persist();
      if (!id) return setMode(null);
      const res = await publishPostAction(id);
      setMode(null);
      if (res.ok) {
        setProgressOpen(true);
      } else {
        toast.error(res.error);
      }
    });
  }

  function onSchedule() {
    if (!scheduleValue) return;
    setMode("schedule");
    startTransition(async () => {
      const id = await persist();
      if (!id) return setMode(null);
      const res = await schedulePostAction(
        id,
        new Date(scheduleValue).toISOString(),
      );
      setMode(null);
      setScheduleOpen(false);
      if (res.ok) {
        toast.success("Post scheduled.");
        router.push(`/posts/${id}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  const charLimit = PLATFORM_META[activePreview].charLimit;
  const activeLen = contentFor(activePreview).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      {/* ── left ─────────────────────────────────────────────── */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title (internal only)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product launch announcement"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">What&apos;s on your mind?</Label>
              <Textarea
                id="content"
                value={baseContent}
                onChange={(e) => setBaseContent(e.target.value)}
                placeholder="Write your post once — PostPilot adapts it per platform."
                className="min-h-40"
              />
              <p className="text-xs text-muted-foreground">
                {baseContent.length} characters · used for every platform unless
                you override it below.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaUploader items={media} onChange={setMedia} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publish to</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {accounts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No connected accounts.{" "}
                <a href="/social-accounts" className="text-primary hover:underline">
                  Connect one
                </a>{" "}
                to publish.
              </p>
            )}
            {accounts.map((a) => {
              const selected = selectedAccountIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAccount(a.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent",
                  )}
                >
                  <PlatformIcon platform={a.platform} brand className="size-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {PLATFORM_META[a.platform].label}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.accountName}</p>
                  </div>
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border",
                      selected && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {selected && <Check className="size-3.5" />}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {selectedPlatforms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Per-platform text</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activePreview}
                onValueChange={(v) => setPreviewPlatform(v as Platform)}
              >
                <TabsList className="flex-wrap">
                  {selectedPlatforms.map((p) => (
                    <TabsTrigger key={p} value={p}>
                      <PlatformIcon platform={p} className="size-3.5" />
                      {PLATFORM_META[p].label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {selectedPlatforms.map((p) => (
                  <TabsContent key={p} value={p} className="space-y-2">
                    <Textarea
                      value={contentFor(p)}
                      onChange={(e) =>
                        setOverrides((o) => ({ ...o, [p]: e.target.value }))
                      }
                      className="min-h-32"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={cn(
                          "text-muted-foreground",
                          contentFor(p).length > PLATFORM_META[p].charLimit &&
                            "font-medium text-destructive",
                        )}
                      >
                        {contentFor(p).length} / {PLATFORM_META[p].charLimit}
                      </span>
                      {overrides[p] !== undefined ? (
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() =>
                            setOverrides((o) => {
                              const n = { ...o };
                              delete n[p];
                              return n;
                            })
                          }
                        >
                          Reset to base content
                        </button>
                      ) : (
                        <span className="text-muted-foreground">
                          following base content
                        </span>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        <AiAssist
          platform={activePreview}
          currentContent={contentFor(activePreview)}
          postId={postId}
          aiConfigured={aiConfigured}
          onApply={(text) => {
            if (overrides[activePreview] !== undefined || selectedPlatforms.length > 1) {
              setOverrides((o) => ({ ...o, [activePreview]: text }));
            } else {
              setBaseContent(text);
            }
          }}
          onAppendHashtags={(tags) => {
            const suffix = tags.map((t) => `#${t}`).join(" ");
            const apply = (prev: string) =>
              prev.includes(suffix) ? prev : `${prev}\n\n${suffix}`.trim();
            if (overrides[activePreview] !== undefined) {
              setOverrides((o) => ({
                ...o,
                [activePreview]: apply(o[activePreview] ?? ""),
              }));
            } else {
              setBaseContent((c) => apply(c));
            }
          }}
        />
      </div>

      {/* ── right ────────────────────────────────────────────── */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
        <div className="flex flex-wrap gap-1.5">
          {(selectedPlatforms.length ? selectedPlatforms : accounts.map((a) => a.platform))
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreviewPlatform(p)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  activePreview === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <PlatformIcon platform={p} className="size-3" />
                {PLATFORM_META[p].label}
              </button>
            ))}
        </div>

        <PlatformPreview
          platform={activePreview}
          content={contentFor(activePreview)}
          media={media}
          accountName={
            accounts.find(
              (a) =>
                a.platform === activePreview &&
                selectedAccountIds.includes(a.id),
            )?.accountName ?? ""
          }
        />

        {activeLen > charLimit && (
          <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            This is {activeLen - charLimit} characters over the{" "}
            {PLATFORM_META[activePreview].label} limit and will be trimmed.
          </p>
        )}

        <Card>
          <CardContent className="space-y-2 p-4">
            <Button
              className="w-full"
              disabled={pending}
              onClick={onPublish}
            >
              {pending && mode === "publish" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Publish now
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => {
                  const d = new Date(Date.now() + 60 * 60 * 1000);
                  d.setSeconds(0, 0);
                  setScheduleValue(toLocalInput(d));
                  setScheduleOpen(true);
                }}
              >
                <CalendarClock className="size-4" /> Schedule
              </Button>
              <Button
                variant="outline"
                disabled={pending}
                onClick={onSaveDraft}
              >
                {pending && mode === "save" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule post</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="schedule">Publish at</Label>
            <Input
              id="schedule"
              type="datetime-local"
              value={scheduleValue}
              onChange={(e) => setScheduleValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Uses your local timezone. A background worker publishes it — you
              don&apos;t need to keep this tab open.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSchedule} disabled={pending || !scheduleValue}>
              {pending && mode === "schedule" && (
                <Loader2 className="animate-spin" />
              )}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {postId && (
        <PublishProgress
          postId={postId}
          open={progressOpen}
          onOpenChange={(v) => {
            setProgressOpen(v);
            if (!v) router.push(`/posts/${postId}`);
          }}
        />
      )}
    </div>
  );
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
