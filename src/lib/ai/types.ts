import type { Platform, Tone } from "@/types";

export interface CaptionInput {
  topic: string;
  platform: Platform;
  tone: Tone;
  audience?: string;
  cta?: string;
}

export interface CaptionResult {
  caption: string;
  hashtags: string[];
  cta: string;
}

export interface RewriteInput {
  content: string;
  platform: Platform;
  tone: Tone;
  /** e.g. "shorter", "more professional", "more engaging". */
  instruction?: string;
}

export interface HashtagsInput {
  content: string;
  platform: Platform;
  count?: number;
}

export interface AIProvider {
  readonly name: "anthropic" | "openai";
  readonly model: string;
  generateCaption(input: CaptionInput): Promise<CaptionResult>;
  rewriteForPlatform(input: RewriteInput): Promise<{ text: string }>;
  generateHashtags(input: HashtagsInput): Promise<{ hashtags: string[] }>;
}
