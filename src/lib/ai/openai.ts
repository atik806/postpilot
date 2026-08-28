import "server-only";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { errors } from "@/lib/errors";
import type {
  AIProvider,
  CaptionInput,
  CaptionResult,
  HashtagsInput,
  RewriteInput,
} from "./types";
import {
  captionSystemPrompt,
  captionUserPrompt,
  hashtagsSystemPrompt,
  hashtagsUserPrompt,
  normalizeHashtags,
  parseJsonObject,
  rewriteSystemPrompt,
  rewriteUserPrompt,
} from "./prompts";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  readonly model = env.openaiModel;
  private client: OpenAI;

  constructor() {
    const apiKey = env.openaiApiKey();
    if (!apiKey) {
      throw errors.validation(
        "OpenAI is not configured. Set OPENAI_API_KEY or switch AI_PROVIDER.",
      );
    }
    this.client = new OpenAI({ apiKey });
  }

  private async complete(system: string, user: string): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const content = res.choices[0]?.message?.content;
    if (!content) {
      throw errors.provider("The AI provider returned an empty response.");
    }
    return content;
  }

  async generateCaption(input: CaptionInput): Promise<CaptionResult> {
    const text = await this.complete(
      captionSystemPrompt(),
      captionUserPrompt(input),
    );
    const parsed = parseJsonObject<{
      caption?: string;
      hashtags?: unknown;
      cta?: string;
    }>(text);
    return {
      caption: parsed.caption?.trim() ?? "",
      hashtags: normalizeHashtags(parsed.hashtags),
      cta: parsed.cta?.trim() ?? "",
    };
  }

  async rewriteForPlatform(input: RewriteInput): Promise<{ text: string }> {
    const text = await this.complete(
      rewriteSystemPrompt(),
      rewriteUserPrompt(input),
    );
    const parsed = parseJsonObject<{ text?: string }>(text);
    return { text: parsed.text?.trim() ?? "" };
  }

  async generateHashtags(input: HashtagsInput): Promise<{ hashtags: string[] }> {
    const text = await this.complete(
      hashtagsSystemPrompt(),
      hashtagsUserPrompt(input),
    );
    const parsed = parseJsonObject<{ hashtags?: unknown }>(text);
    return { hashtags: normalizeHashtags(parsed.hashtags) };
  }
}
