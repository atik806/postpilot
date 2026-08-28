"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateCaptionAction, rewriteAction } from "@/lib/ai-actions";
import { PlatformIcon } from "@/components/social/platform-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLATFORM_META, TONE_LABELS } from "@/lib/constants";
import { PLATFORMS, TONES, type Platform, type Tone } from "@/types";

function ResultBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <div className="relative rounded-lg border bg-muted/40 p-4">
      <pre className="whitespace-pre-wrap font-sans text-sm">{text}</pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-2 top-2 size-7"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

function PlatformSelect({
  value,
  onChange,
}: {
  value: Platform;
  onChange: (p: Platform) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Platform)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PLATFORMS.map((p) => (
          <SelectItem key={p} value={p}>
            <span className="flex items-center gap-2">
              <PlatformIcon platform={p} className="size-3.5" />
              {PLATFORM_META[p].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ToneSelect({
  value,
  onChange,
}: {
  value: Tone;
  onChange: (t: Tone) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Tone)}>
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
  );
}

export function StudioClient() {
  const [pending, startTransition] = useTransition();

  // caption
  const [topic, setTopic] = useState("");
  const [cPlatform, setCPlatform] = useState<Platform>("linkedin");
  const [cTone, setCTone] = useState<Tone>("professional");
  const [audience, setAudience] = useState("");
  const [cta, setCta] = useState("");
  const [caption, setCaption] = useState("");

  // rewrite
  const [original, setOriginal] = useState("");
  const [rPlatform, setRPlatform] = useState<Platform>("x");
  const [rTone, setRTone] = useState<Tone>("casual");
  const [rewritten, setRewritten] = useState("");

  return (
    <Tabs defaultValue="caption" className="space-y-4">
      <TabsList>
        <TabsTrigger value="caption">Generate caption</TabsTrigger>
        <TabsTrigger value="rewrite">Rewrite for platform</TabsTrigger>
      </TabsList>

      <TabsContent value="caption">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Brief</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="topic">Topic</Label>
                <Textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="We just shipped dark mode and a faster editor."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <PlatformSelect value={cPlatform} onChange={setCPlatform} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tone</Label>
                  <ToneSelect value={cTone} onChange={setCTone} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="audience">Audience</Label>
                  <Input
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="indie developers"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cta">CTA</Label>
                  <Input
                    id="cta"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="Try it free"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={pending || topic.trim().length < 3}
                onClick={() =>
                  startTransition(async () => {
                    const res = await generateCaptionAction({
                      topic,
                      platform: cPlatform,
                      tone: cTone,
                      audience: audience || undefined,
                      cta: cta || undefined,
                    });
                    if (res.ok) {
                      const d = res.data!;
                      setCaption(
                        [
                          d.caption,
                          d.cta,
                          d.hashtags.map((h) => `#${h}`).join(" "),
                        ]
                          .filter(Boolean)
                          .join("\n\n"),
                      );
                    } else toast.error(res.error);
                  })
                }
              >
                {pending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Generate
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              {caption ? (
                <ResultBox text={caption} />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Your generated caption appears here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="rewrite">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Original</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Paste the content you want to adapt."
                className="min-h-32"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <PlatformSelect value={rPlatform} onChange={setRPlatform} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tone</Label>
                  <ToneSelect value={rTone} onChange={setRTone} />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={pending || original.trim().length < 3}
                onClick={() =>
                  startTransition(async () => {
                    const res = await rewriteAction({
                      content: original,
                      platform: rPlatform,
                      tone: rTone,
                    });
                    if (res.ok) setRewritten(res.data!.text);
                    else toast.error(res.error);
                  })
                }
              >
                {pending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Rewrite
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{PLATFORM_META[rPlatform].label} version</CardTitle>
            </CardHeader>
            <CardContent>
              {rewritten ? (
                <ResultBox text={rewritten} />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  The adapted version appears here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
