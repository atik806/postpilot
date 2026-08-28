"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  generateCaptionAction,
  hashtagsAction,
  rewriteAction,
} from "@/lib/ai-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TONE_LABELS } from "@/lib/constants";
import { TONES, type Platform, type Tone } from "@/types";

interface Props {
  platform: Platform;
  currentContent: string;
  postId?: string | null;
  aiConfigured: boolean;
  onApply: (text: string) => void;
  onAppendHashtags: (tags: string[]) => void;
}

const QUICK_REWRITES = [
  { label: "Make shorter", instruction: "make it noticeably shorter" },
  { label: "More professional", instruction: "make it more professional" },
  { label: "More engaging", instruction: "make it more engaging and punchy" },
] as const;

export function AiAssist({
  platform,
  currentContent,
  postId,
  aiConfigured,
  onApply,
  onAppendHashtags,
}: Props) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [cta, setCta] = useState("");
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<string | null>(null);

  if (!aiConfigured) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="size-4" /> AI Assist
        </p>
        <p className="mt-1">
          Add <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code> or{" "}
          <code className="rounded bg-muted px-1">OPENAI_API_KEY</code> to enable
          caption generation and rewrites.
        </p>
      </div>
    );
  }

  function run(name: string, fn: () => Promise<void>) {
    setAction(name);
    startTransition(async () => {
      try {
        await fn();
      } finally {
        setAction(null);
      }
    });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 text-primary" /> AI Assist
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ai-topic">What&apos;s the post about?</Label>
          <Input
            id="ai-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Launching our new pricing page"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TONE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-cta">Call to action</Label>
            <Input
              id="ai-cta"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="optional"
            />
          </div>
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={pending || topic.trim().length < 3}
          onClick={() =>
            run("caption", async () => {
              const res = await generateCaptionAction({
                topic,
                platform,
                tone,
                cta: cta || undefined,
                postId,
              });
              if (res.ok) {
                const parts = [res.data!.caption];
                if (res.data!.cta) parts.push(res.data!.cta);
                if (res.data!.hashtags.length)
                  parts.push(res.data!.hashtags.map((h) => `#${h}`).join(" "));
                onApply(parts.filter(Boolean).join("\n\n"));
                toast.success("Caption generated.");
              } else toast.error(res.error);
            })
          }
        >
          {pending && action === "caption" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Wand2 />
          )}
          Generate caption
        </Button>
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground">
          Rewrite current {platform} text
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_REWRITES.map((q) => (
            <Button
              key={q.label}
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || !currentContent.trim()}
              onClick={() =>
                run(q.label, async () => {
                  const res = await rewriteAction({
                    content: currentContent,
                    platform,
                    tone,
                    instruction: q.instruction,
                    postId,
                  });
                  if (res.ok && res.data!.text) {
                    onApply(res.data!.text);
                    toast.success("Rewritten.");
                  } else if (!res.ok) toast.error(res.error);
                })
              }
            >
              {pending && action === q.label && (
                <Loader2 className="animate-spin" />
              )}
              {q.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !currentContent.trim()}
            onClick={() =>
              run("hashtags", async () => {
                const res = await hashtagsAction({
                  content: currentContent,
                  platform,
                  postId,
                });
                if (res.ok) {
                  onAppendHashtags(res.data!.hashtags);
                  toast.success("Hashtags added.");
                } else toast.error(res.error);
              })
            }
          >
            {pending && action === "hashtags" && (
              <Loader2 className="animate-spin" />
            )}
            Hashtags
          </Button>
        </div>
      </div>
    </div>
  );
}
