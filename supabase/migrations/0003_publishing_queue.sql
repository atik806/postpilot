-- ============================================================================
-- PostPilot — publishing queue claim function
-- Atomically claims due jobs using FOR UPDATE SKIP LOCKED so multiple worker
-- invocations never process the same job (spec §11 idempotency).
-- ============================================================================

create or replace function public.claim_publishing_jobs(
  max_jobs integer default 10,
  lock_timeout_seconds integer default 300
)
returns setof public.publishing_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select j.id
    from public.publishing_jobs j
    where
      (
        j.status = 'PENDING'
        or (j.status = 'RUNNING' and j.locked_at < now() - make_interval(secs => lock_timeout_seconds))
      )
      and j.run_after <= now()
    order by j.run_after asc
    limit max_jobs
    for update skip locked
  )
  update public.publishing_jobs j
  set status = 'RUNNING',
      locked_at = now(),
      attempts = j.attempts + 1,
      updated_at = now()
  from due
  where j.id = due.id
  returning j.*;
end;
$$;

-- Callable only with the service role (worker). Not granted to authenticated.
revoke all on function public.claim_publishing_jobs(integer, integer) from public;
revoke all on function public.claim_publishing_jobs(integer, integer) from anon, authenticated;
grant execute on function public.claim_publishing_jobs(integer, integer) to service_role;
