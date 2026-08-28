import type { Platform } from "@/types";
import { PLATFORM_META, TONE_LABELS } from "@/lib/constants";
import type { CaptionInput, HashtagsInput, RewriteInput } from "./types";

const PLATFORM_GUIDANCE: Record<Platform, string> = {
  facebook:
    "Facebook: conversational, 1–3 short paragraphs, a hook in the first line, minimal hashtags (0–2), can include a question to drive comments.",
  instagram:
    "Instagram: an engaging first line that works as a preview, line breaks for readability, 5–15 relevant hashtags at the end, 1–3 emojis max.",
  linkedin:
    "LinkedIn: professional and insight-led, first line is a strong hook, short paragraphs, no more than 3 hashtags, no hype.",
  x: "X: one punchy thought under 280 characters, at most 1–2 hashtags, no filler.",
  youtube:
    "YouTube: a compelling description — first two lines summarise the value, then details, then a call to action. Hashtags (3–5) at the very end.",
};

export function captionSystemPrompt(): string {
  return [
    "You are PostPilot's social copywriter. You write platform-native captions that never feel generic or AI-generated.",
    "Always respond with a single JSON object and nothing else.",
  ].join(" ");
}

export function captionUserPrompt(input: CaptionInput): string {
  const meta = PLATFORM_META[input.platform];
  return JSON.stringify(
    {
      task: "generate_caption",
      topic: input.topic,
      platform: input.platform,
      platform_guidance: PLATFORM_GUIDANCE[input.platform],
      character_limit: meta.charLimit,
      tone: TONE_LABELS[input.tone],
      audience: input.audience || "a general audience",
      desired_cta: input.cta || null,
      response_shape: {
        caption: "string — the caption body WITHOUT hashtags",
        hashtags: "string[] — without the # prefix",
        cta: "string — a short call to action",
      },
    },
    null,
    2,
  );
}

export function rewriteSystemPrompt(): string {
  return [
    "You are PostPilot's editor. You adapt a single piece of content for a specific platform, preserving meaning and facts.",
    "Respond with a single JSON object: { \"text\": string } and nothing else.",
  ].join(" ");
}

export function rewriteUserPrompt(input: RewriteInput): string {
  return JSON.stringify(
    {
      task: "rewrite_for_platform",
      original: input.content,
      platform: input.platform,
      platform_guidance: PLATFORM_GUIDANCE[input.platform],
      character_limit: PLATFORM_META[input.platform].charLimit,
      tone: TONE_LABELS[input.tone],
      instruction: input.instruction || "adapt naturally for this platform",
    },
    null,
    2,
  );
}

export function hashtagsSystemPrompt(): string {
  return 'You generate relevant, non-spammy hashtags. Respond with a single JSON object: { "hashtags": string[] } (no # prefix) and nothing else.';
}

export function hashtagsUserPrompt(input: HashtagsInput): string {
  return JSON.stringify(
    {
      task: "generate_hashtags",
      content: input.content,
      platform: input.platform,
      count: input.count ?? 8,
    },
    null,
    2,
  );
}

/** Best-effort extraction of a JSON object from a model response. */
export function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("AI response did not contain a JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

export function normalizeHashtags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((h) => String(h).trim().replace(/^#+/, ""))
    .filter(Boolean)
    .slice(0, 30);
}
