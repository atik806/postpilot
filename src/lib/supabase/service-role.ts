import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { env } from "@/lib/env";

/**
 * Privileged Supabase client that BYPASSES Row Level Security.
 *
 * Only for trusted server-side work that legitimately crosses the RLS
 * boundary: reading encrypted social tokens, running the publishing queue,
 * writing audit logs. Never import this into client code and never use it to
 * serve data to a user without first checking their workspace membership.
 */
export function createSupabaseServiceRoleClient() {
  return createClient<Database>(
    env.supabaseUrl(),
    env.supabaseServiceRoleKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
