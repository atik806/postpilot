import "server-only";
import Anthropic from "@anthropic-ai/sdk";
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

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;
  readonly model = env.anthropicModel;
  private client: Anthropic;

  constructor() {
    const apiKey = env.anthropicApiKey();
    if (!apiKey) {
      throw errors.validation(
        "Anthropic is not configured. Set ANTHROPIC_API_KEY or switch AI_PROVIDER.",
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  private async complete(system: string, user: string): Promise<string> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = res.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") {
      throw errors.provider("The AI provider returned an empty response.");
    }
    return block.text;
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
