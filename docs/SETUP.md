# Setup

## 1. Supabase project

1. Create a project at supabase.com.
2. **Project Settings → API**: copy `Project URL`, `anon` key, `service_role` key.
3. **Project Settings → Database**: copy the connection strings
   - `DATABASE_URL` — the **pooled** (Transaction) connection, port `6543`
   - `DIRECT_URL` — the **direct** connection, port `5432`

## 2. Schema

Run the migrations in order. With the CLI:

```bash
npx supabase link --project-ref <your-ref>
npx supabase db push
```

Or open the SQL editor and run, in order:

1. `supabase/migrations/0001_init.sql` — tables, enums, helper functions, RLS
2. `supabase/migrations/0002_storage.sql` — the `media` storage bucket + policies
3. `supabase/migrations/0003_publishing_queue.sql` — the queue claim function

Then regenerate the typed schema (optional but recommended):

```bash
npm run gen:types
```

## 3. Environment

```bash
cp .env.example .env.local
```

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only; bypasses RLS |
| `DATABASE_URL` / `DIRECT_URL` | for the Supabase CLI / migrations |
| `TOKEN_ENCRYPTION_KEY` | `openssl rand -hex 32` — 32 bytes, encrypts social tokens |
| `CRON_SECRET` | `openssl rand -hex 32` — protects `/api/cron/publish` |
| `AI_PROVIDER` | `anthropic` (default) or `openai` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | at least one for AI features |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` — used for OAuth redirect URIs |

## 4. Auth settings

In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback`
(and your production URL) to the redirect allow-list. For local dev you can disable
"Confirm email" so sign-up logs you straight in.

## 5. Run

```bash
npm install
npm run dev
```

## 6. Scheduled publishing

Deploy to Vercel and `vercel.json` invokes `/api/cron/publish` every minute
(set `CRON_SECRET` in the Vercel project — Vercel Cron sends it automatically).
Elsewhere, point any scheduler at:

```
POST https://<host>/api/cron/publish
Authorization: Bearer <CRON_SECRET>
```

## 7. Going live with a real platform

Every platform runs in **Sandbox mode** until you provide OAuth credentials:

1. Register an OAuth app with the platform (Meta, LinkedIn, X, Google).
2. Set the redirect URI to `${NEXT_PUBLIC_APP_URL}/api/social/<platform>/callback`.
3. Add `<PLATFORM>_CLIENT_ID` and `<PLATFORM>_CLIENT_SECRET` to your env.
4. Implement `handleCallback` / `publish` in the matching class in
   `src/lib/social/scaffolds.ts` and set `RealProviderScaffold.implemented = true`.

The registry (`src/lib/social/registry.ts`) then uses the real adapter automatically.
