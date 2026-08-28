# PostPilot

**Create Once. Publish Everywhere.**

An AI-powered social media management and publishing platform. Create a post once,
select your connected accounts, and PostPilot adapts, schedules and publishes it
to multiple platforms.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript strict) — full-stack: UI, route
  handlers and server actions in one app
- **Supabase** — Postgres (schema + RLS in `supabase/migrations/`), Auth, Storage
- **Tailwind CSS v4** + a small shadcn-style component system + Lucide icons
- **TanStack Query** for client data, **Zod** for every input boundary
- **AI**: provider-agnostic abstraction (`src/lib/ai/`) with Anthropic (default) and
  OpenAI implementations
- **Publishing**: a database-backed job queue drained by an authenticated cron route
  — retries, exponential backoff, idempotency, no browser required

## Quick start

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migrations** — either with the CLI:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
   or paste `supabase/migrations/0001_init.sql`, `0002_storage.sql`,
   `0003_publishing_queue.sql` into the SQL editor in order.
3. **Configure env**:
   ```bash
   cp .env.example .env.local
   # fill in Supabase URL + keys and DB connection strings
   openssl rand -hex 32   # → TOKEN_ENCRYPTION_KEY
   openssl rand -hex 32   # → CRON_SECRET
   # add ANTHROPIC_API_KEY (or OPENAI_API_KEY + AI_PROVIDER=openai) for AI features
   ```
4. **Install & run**:
   ```bash
   npm install
   npm run dev
   ```
5. Sign up, complete onboarding, and connect a platform — with no OAuth credentials
   it connects in **Sandbox mode** so the whole create → publish flow works.

## Scheduled publishing

`GET|POST /api/cron/publish` drains the queue (auth: `Authorization: Bearer $CRON_SECRET`).
On Vercel, `vercel.json` runs it every minute. Locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" -X POST http://localhost:3000/api/cron/publish
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run gen:types` | Regenerate `src/types/database.types.ts` from the linked DB |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design and
[`docs/SETUP.md`](docs/SETUP.md) for detailed setup and going live with real platforms.
