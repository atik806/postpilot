# Architecture

PostPilot is a single Next.js 16 app. The original spec assumed a NestJS + Redis +
BullMQ monorepo; this build keeps every architectural boundary but collapses it into
Next.js + Supabase.

```
Browser ──► Next.js (App Router)
              ├── Server Components  → src/server/*  (business logic, RLS client)
              ├── Server Actions     → src/lib/*-actions.ts
              └── Route Handlers     → src/app/api/*
                    │
                    ├── Supabase Postgres  (schema + RLS = the security boundary)
                    ├── Supabase Auth      (email/password, OAuth-ready)
                    ├── Supabase Storage   (media bucket, signed URLs)
                    └── publishing_jobs    (DB-backed queue)
                          ▲
              /api/cron/publish  ◄── Vercel Cron / external scheduler
                    │
                    └── SocialProvider adapters ─► Facebook / Instagram / LinkedIn / X / YouTube
                                                   (Sandbox provider when no credentials)
```

## Layers

| Layer | Location | Responsibility |
|---|---|---|
| UI | `src/app/**`, `src/components/**`, `src/features/**` | Rendering only; no business logic |
| Actions | `src/lib/*-actions.ts` (`"use server"`) | Thin — parse with Zod, call a service, shape the result |
| Services | `src/server/**` (`"server-only"`) | All business logic, authorization, DB access |
| Adapters | `src/lib/social/**`, `src/lib/ai/**` | Provider-specific code, isolated behind an interface |
| Data | `supabase/migrations/**` | Schema, enums, helper functions, RLS |

## Security

- **Workspace isolation is enforced in the database.** Every workspace-scoped table
  has RLS policies keyed on `workspace_members`. `SECURITY DEFINER` helpers
  (`is_workspace_member`, `has_workspace_role`) avoid policy recursion.
- **Social tokens never touch the client.** They live in `social_account_secrets`,
  a table with *no* `authenticated` policies — only the service-role key reads it —
  and are encrypted with AES-256-GCM (`src/lib/crypto/tokens.ts`).
- The **service-role client** (`src/lib/supabase/service-role.ts`) bypasses RLS and
  is used only by trusted server code (the queue worker, token access, audit log).
- Route protection is in `src/proxy.ts` (Next 16 renamed `middleware` → `proxy`),
  but every service re-checks authorization — the proxy is defence in depth, not the
  boundary.

## Provider abstraction

`SocialProvider` (`src/lib/social/types.ts`) declares `capabilities` so the composer
and queue never assume a uniform feature set. `getSocialProvider(platform)` returns
the real adapter when it has credentials **and** an implementation, otherwise the
`SandboxProvider` — which simulates the full lifecycle but tags every result
`isSandbox: true` and prefixes ids `sandbox_`. It never reports a simulated post as
real.

`AIProvider` (`src/lib/ai/`) is selected from `AI_PROVIDER`. The app depends only on
the interface.

## Publishing queue

1. `savePost` creates `post_targets` (one per destination account).
2. `enqueuePost` upserts a `publishing_jobs` row per target,
   `idempotency_key = post_target_id`, `run_after = now | scheduledAt`.
3. `/api/cron/publish` → `processDueJobs` calls the `claim_publishing_jobs` RPC
   (`FOR UPDATE SKIP LOCKED`), publishes via the provider, and on failure reschedules
   with exponential backoff (`src/server/backoff.ts`) until `max_attempts`.
4. Parent post status is recomputed: all ok → `PUBLISHED`, some ok → `PARTIALLY_PUBLISHED`,
   none → `FAILED`. An already-published target is skipped — publishing is idempotent.

## Plan limits

`src/server/limits.ts` is the single gate. Limits come from `subscriptions.limits`
(jsonb, seeded per plan) — never hard-coded at call sites.
