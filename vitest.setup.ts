// Deterministic env for unit tests.
process.env.TOKEN_ENCRYPTION_KEY ??=
  "0000000000000000000000000000000000000000000000000000000000000000";
process.env.CRON_SECRET ??= "test-cron-secret";
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service";
