import "server-only";
import { env } from "@/lib/env";
import { errors } from "@/lib/errors";
import type { AIProvider } from "./types";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";

export type { AIProvider } from "./types";

/**
 * Resolves the configured AI provider. The rest of the app depends only on the
 * `AIProvider` interface, never on a concrete SDK (spec §10).
 */
export function getAIProvider(): AIProvider {
  switch (env.aiProvider) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    default:
      throw errors.internal(`Unknown AI_PROVIDER: ${env.aiProvider}`);
  }
}

/** True when at least one provider has credentials configured. */
export function isAIConfigured(): boolean {
  return Boolean(env.anthropicApiKey() || env.openaiApiKey());
}
