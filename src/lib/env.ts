/**
 * Centralised environment access. Import from here rather than touching
 * `process.env` directly so missing configuration fails loudly and early.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),

  tokenEncryptionKey: () => required("TOKEN_ENCRYPTION_KEY"),
  cronSecret: () => required("CRON_SECRET"),

  aiProvider: (process.env.AI_PROVIDER ?? "anthropic") as "anthropic" | "openai",
  anthropicApiKey: () => optional("ANTHROPIC_API_KEY"),
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
  openaiApiKey: () => optional("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
} as const;

/** OAuth credentials for a real social integration, if configured. */
export function socialCredentials(platform: string) {
  const key = platform.toUpperCase();
  const clientId = optional(`${key}_CLIENT_ID`);
  const clientSecret = optional(`${key}_CLIENT_SECRET`);
  if (clientId && clientSecret) return { clientId, clientSecret };
  return null;
}
