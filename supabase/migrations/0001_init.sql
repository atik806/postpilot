-- ============================================================================
-- PostPilot — initial schema, helpers, RLS
-- ============================================================================
set check_function_bodies = off;

-- ── Enums ───────────────────────────────────────────────────────────────────
create type public.platform as enum ('facebook', 'instagram', 'linkedin', 'x', 'youtube');
create type public.workspace_role as enum ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');
create type public.social_account_status as enum ('CONNECTED', 'EXPIRED', 'REAUTH_REQUIRED', 'DISCONNECTED', 'ERROR');
create type public.post_status as enum ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'PARTIALLY_PUBLISHED', 'FAILED', 'CANCELLED');
create type public.post_target_status as enum ('PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');
create type public.publishing_job_status as enum ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
create type public.plan_tier as enum ('FREE', 'STARTER', 'PRO', 'AGENCY');

-- ── Utility: updated_at ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles (mirror of auth.users) ────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text,
  avatar_url  text,
  timezone    text not null default 'UTC',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── workspaces ─────────────────────────────────────────────────────────────
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  owner_id    uuid not null references public.profiles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index workspaces_owner_id_idx on public.workspaces (owner_id);

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create table public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  role          public.workspace_role not null default 'EDITOR',
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index workspace_members_user_id_idx on public.workspace_members (user_id);

-- ── Membership helpers (SECURITY DEFINER → bypass RLS, avoid recursion) ─────
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(ws uuid)
returns public.workspace_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role from public.workspace_members m
  where m.workspace_id = ws and m.user_id = auth.uid();
$$;

create or replace function public.has_workspace_role(ws uuid, roles public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid() and m.role = any (roles)
  );
$$;

-- ── subscriptions ──────────────────────────────────────────────────────────
create table public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null unique references public.workspaces (id) on delete cascade,
  plan                public.plan_tier not null default 'FREE',
  status              text not null default 'active',
  limits              jsonb not null default '{}'::jsonb,
  usage               jsonb not null default '{}'::jsonb,
  current_period_end  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.default_plan_limits(p public.plan_tier)
returns jsonb
language sql
immutable
as $$
  select case p
    when 'FREE'    then '{"workspaces":1,"socialAccounts":2,"postsPerMonth":10,"aiCallsPerMonth":20,"teamMembers":1,"analytics":false,"aiCampaigns":false,"whiteLabel":false}'::jsonb
    when 'STARTER' then '{"workspaces":1,"socialAccounts":5,"postsPerMonth":100,"aiCallsPerMonth":300,"teamMembers":2,"analytics":false,"aiCampaigns":false,"whiteLabel":false}'::jsonb
    when 'PRO'     then '{"workspaces":3,"socialAccounts":20,"postsPerMonth":-1,"aiCallsPerMonth":2000,"teamMembers":10,"analytics":true,"aiCampaigns":true,"whiteLabel":false}'::jsonb
    when 'AGENCY'  then '{"workspaces":-1,"socialAccounts":-1,"postsPerMonth":-1,"aiCallsPerMonth":10000,"teamMembers":-1,"analytics":true,"aiCampaigns":true,"whiteLabel":true}'::jsonb
  end;
$$;

-- ── Transactional workspace creation (avoids RLS chicken-and-egg) ──────────
create or replace function public.create_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
  base_slug text;
  final_slug text;
  n int := 0;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(trim(workspace_name), '') = '' then
    raise exception 'workspace name is required';
  end if;

  base_slug := regexp_replace(lower(trim(workspace_name)), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'workspace'; end if;
  final_slug := base_slug;
  while exists (select 1 from public.workspaces w where w.slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;

  insert into public.workspaces (name, slug, owner_id)
  values (trim(workspace_name), final_slug, uid)
  returning id into new_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_id, uid, 'OWNER');

  insert into public.subscriptions (workspace_id, plan, limits)
  values (new_id, 'FREE', public.default_plan_limits('FREE'));

  return new_id;
end;
$$;

-- ── social_accounts (NO tokens here — see social_account_secrets) ──────────
create table public.social_accounts (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces (id) on delete cascade,
  platform              public.platform not null,
  account_name          text not null,
  external_account_id   text not null,
  status                public.social_account_status not null default 'CONNECTED',
  is_sandbox            boolean not null default false,
  metadata              jsonb not null default '{}'::jsonb,
  connected_by          uuid references public.profiles (id) on delete set null,
  last_synced_at        timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (workspace_id, platform, external_account_id)
);
create index social_accounts_workspace_id_idx on public.social_accounts (workspace_id);
create index social_accounts_platform_idx on public.social_accounts (platform);

create trigger social_accounts_set_updated_at
  before update on public.social_accounts
  for each row execute function public.set_updated_at();

-- Secrets live in a separate table with NO authenticated/anon policies:
-- only the service-role key (used server-side) can read or write them.
create table public.social_account_secrets (
  social_account_id       uuid primary key references public.social_accounts (id) on delete cascade,
  access_token_encrypted  text,
  refresh_token_encrypted text,
  token_expires_at        timestamptz,
  updated_at              timestamptz not null default now()
);

create trigger social_account_secrets_set_updated_at
  before update on public.social_account_secrets
  for each row execute function public.set_updated_at();

-- ── campaigns ──────────────────────────────────────────────────────────────
create table public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  name          text not null,
  description   text,
  status        text not null default 'DRAFT',
  starts_on     date,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index campaigns_workspace_id_idx on public.campaigns (workspace_id);

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ── media ──────────────────────────────────────────────────────────────────
create table public.media (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  uploaded_by   uuid references public.profiles (id) on delete set null,
  storage_path  text not null,
  storage_url   text not null,
  mime_type     text not null,
  file_size     bigint not null default 0,
  width         integer,
  height        integer,
  duration      numeric,
  created_at    timestamptz not null default now()
);
create index media_workspace_id_idx on public.media (workspace_id);

-- ── posts ──────────────────────────────────────────────────────────────────
create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  author_id     uuid references public.profiles (id) on delete set null,
  campaign_id   uuid references public.campaigns (id) on delete set null,
  title         text,
  base_content  text not null default '',
  status        public.post_status not null default 'DRAFT',
  scheduled_at  timestamptz,
  timezone      text not null default 'UTC',
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index posts_workspace_id_idx on public.posts (workspace_id);
create index posts_status_idx on public.posts (status);
create index posts_scheduled_at_idx on public.posts (scheduled_at);
create index posts_campaign_id_idx on public.posts (campaign_id);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create table public.post_media (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  media_id    uuid not null references public.media (id) on delete cascade,
  sort_order  integer not null default 0,
  unique (post_id, media_id)
);
create index post_media_post_id_idx on public.post_media (post_id);

-- ── post_targets (one row per destination account) ────────────────────────
create table public.post_targets (
  id                 uuid primary key default gen_random_uuid(),
  post_id            uuid not null references public.posts (id) on delete cascade,
  workspace_id       uuid not null references public.workspaces (id) on delete cascade,
  social_account_id  uuid not null references public.social_accounts (id) on delete cascade,
  platform           public.platform not null,
  platform_content   jsonb not null default '{}'::jsonb,
  status             public.post_target_status not null default 'PENDING',
  external_post_id   text,
  external_url       text,
  error_message      text,
  is_sandbox         boolean not null default false,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (post_id, social_account_id)
);
create index post_targets_post_id_idx on public.post_targets (post_id);
create index post_targets_workspace_id_idx on public.post_targets (workspace_id);
create index post_targets_social_account_id_idx on public.post_targets (social_account_id);
create index post_targets_status_idx on public.post_targets (status);

create trigger post_targets_set_updated_at
  before update on public.post_targets
  for each row execute function public.set_updated_at();

-- ── publishing_jobs (database-backed queue) ───────────────────────────────
create table public.publishing_jobs (
  id              uuid primary key default gen_random_uuid(),
  post_target_id  uuid not null unique references public.post_targets (id) on delete cascade,
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  status          public.publishing_job_status not null default 'PENDING',
  attempts        integer not null default 0,
  max_attempts    integer not null default 5,
  run_after       timestamptz not null default now(),
  locked_at       timestamptz,
  last_error      text,
  idempotency_key text not null unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index publishing_jobs_due_idx on public.publishing_jobs (status, run_after);

create trigger publishing_jobs_set_updated_at
  before update on public.publishing_jobs
  for each row execute function public.set_updated_at();

-- ── analytics (metrics nullable — never fabricated) ───────────────────────
create table public.analytics (
  id               uuid primary key default gen_random_uuid(),
  post_target_id   uuid not null references public.post_targets (id) on delete cascade,
  workspace_id     uuid not null references public.workspaces (id) on delete cascade,
  platform         public.platform not null,
  likes            integer,
  comments         integer,
  shares           integer,
  views            integer,
  reach            integer,
  clicks           integer,
  engagement_rate  numeric,
  recorded_at      timestamptz not null default now()
);
create index analytics_workspace_id_idx on public.analytics (workspace_id);
create index analytics_post_target_id_idx on public.analytics (post_target_id);
create index analytics_recorded_at_idx on public.analytics (recorded_at);

-- ── ai_content ─────────────────────────────────────────────────────────────
create table public.ai_content (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid not null references public.workspaces (id) on delete cascade,
  post_id            uuid references public.posts (id) on delete set null,
  platform           public.platform,
  kind               text not null,
  prompt             jsonb not null default '{}'::jsonb,
  generated_content  text not null,
  provider           text not null,
  model              text not null,
  created_by         uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now()
);
create index ai_content_workspace_id_idx on public.ai_content (workspace_id);
create index ai_content_post_id_idx on public.ai_content (post_id);

-- ── audit_logs ─────────────────────────────────────────────────────────────
create table public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  actor_id      uuid references public.profiles (id) on delete set null,
  action        text not null,
  target_type   text,
  target_id     uuid,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index audit_logs_workspace_id_idx on public.audit_logs (workspace_id, created_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles                enable row level security;
alter table public.workspaces              enable row level security;
alter table public.workspace_members       enable row level security;
alter table public.subscriptions           enable row level security;
alter table public.social_accounts         enable row level security;
alter table public.social_account_secrets  enable row level security;
alter table public.campaigns               enable row level security;
alter table public.media                   enable row level security;
alter table public.posts                   enable row level security;
alter table public.post_media              enable row level security;
alter table public.post_targets            enable row level security;
alter table public.publishing_jobs         enable row level security;
alter table public.analytics               enable row level security;
alter table public.ai_content              enable row level security;
alter table public.audit_logs              enable row level security;

-- profiles: own row + profiles that share a workspace with me
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.workspace_members me
      join public.workspace_members them on them.workspace_id = me.workspace_id
      where me.user_id = auth.uid() and them.user_id = public.profiles.id
    )
  );
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- workspaces
create policy workspaces_select on public.workspaces for select to authenticated
  using (public.is_workspace_member(id));
create policy workspaces_insert on public.workspaces for insert to authenticated
  with check (owner_id = auth.uid());
create policy workspaces_update on public.workspaces for update to authenticated
  using (public.has_workspace_role(id, array['OWNER']::public.workspace_role[]))
  with check (public.has_workspace_role(id, array['OWNER']::public.workspace_role[]));
create policy workspaces_delete on public.workspaces for delete to authenticated
  using (public.has_workspace_role(id, array['OWNER']::public.workspace_role[]));

-- workspace_members
create policy members_select on public.workspace_members for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy members_insert on public.workspace_members for insert to authenticated
  with check (public.has_workspace_role(workspace_id, array['OWNER','ADMIN']::public.workspace_role[]));
create policy members_update on public.workspace_members for update to authenticated
  using (public.has_workspace_role(workspace_id, array['OWNER','ADMIN']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['OWNER','ADMIN']::public.workspace_role[]));
create policy members_delete on public.workspace_members for delete to authenticated
  using (
    public.has_workspace_role(workspace_id, array['OWNER','ADMIN']::public.workspace_role[])
    or user_id = auth.uid() -- allow leaving a workspace
  );

-- subscriptions
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy subscriptions_update on public.subscriptions for update to authenticated
  using (public.has_workspace_role(workspace_id, array['OWNER','ADMIN']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['OWNER','ADMIN']::public.workspace_role[]));

-- social_accounts (row visible to members; tokens are NOT in this table)
create policy social_accounts_select on public.social_accounts for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy social_accounts_write on public.social_accounts for all to authenticated
  using (public.has_workspace_role(workspace_id, array['OWNER','ADMIN']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['OWNER','ADMIN']::public.workspace_role[]));

-- social_account_secrets: NO policies for authenticated → service-role only.

-- helper: membership by post
create or replace function public.is_post_member(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.posts po
    join public.workspace_members m on m.workspace_id = po.workspace_id
    where po.id = p and m.user_id = auth.uid()
  );
$$;

-- campaigns
create policy campaigns_select on public.campaigns for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy campaigns_write on public.campaigns for all to authenticated
  using (public.has_workspace_role(workspace_id, array['OWNER','ADMIN','EDITOR']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['OWNER','ADMIN','EDITOR']::public.workspace_role[]));

-- media
create policy media_select on public.media for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy media_write on public.media for all to authenticated
  using (public.has_workspace_role(workspace_id, array['OWNER','ADMIN','EDITOR']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['OWNER','ADMIN','EDITOR']::public.workspace_role[]));

-- posts
create policy posts_select on public.posts for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy posts_write on public.posts for all to authenticated
  using (public.has_workspace_role(workspace_id, array['OWNER','ADMIN','EDITOR']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['OWNER','ADMIN','EDITOR']::public.workspace_role[]));

-- post_media
create policy post_media_select on public.post_media for select to authenticated
  using (public.is_post_member(post_id));
create policy post_media_write on public.post_media for all to authenticated
  using (public.is_post_member(post_id))
  with check (public.is_post_member(post_id));

-- post_targets (read for members; writes go through the service role)
create policy post_targets_select on public.post_targets for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- publishing_jobs (read-only for members; queue is driven by the service role)
create policy publishing_jobs_select on public.publishing_jobs for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- analytics (read-only for members)
create policy analytics_select on public.analytics for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- ai_content
create policy ai_content_select on public.ai_content for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- audit_logs (admins/owners read; writes via service role)
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (public.has_workspace_role(workspace_id, array['OWNER','ADMIN']::public.workspace_role[]));

-- ── grants ────────────────────────────────────────────────────────────────
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.workspace_role(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, public.workspace_role[]) to authenticated;
grant execute on function public.is_post_member(uuid) to authenticated;
