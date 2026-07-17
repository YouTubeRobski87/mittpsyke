-- MittPsyke Radar: secure daily Edge Function trigger.
-- The schema tables and radar-scan function already exist in the hosted project.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'radar_cron_secret') then
    perform vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'radar_cron_secret');
  end if;

  if not exists (select 1 from vault.secrets where name = 'radar_project_url') then
    perform vault.create_secret('https://rfxbytkhwxvxrqswdakh.supabase.co', 'radar_project_url');
  end if;
end
$$;

create or replace function public.radar_validate_secret(submitted_secret text)
returns boolean
language sql
security definer
set search_path = vault, pg_catalog
as $$
  select submitted_secret is not null
    and submitted_secret = (
      select decrypted_secret from vault.decrypted_secrets
      where name = 'radar_cron_secret'
      limit 1
    );
$$;

revoke all on function public.radar_validate_secret(text) from public, anon, authenticated;
grant execute on function public.radar_validate_secret(text) to service_role;

drop policy if exists "radar_findings_admin_select" on public.radar_findings;
create policy "radar_findings_admin_select"
on public.radar_findings for select
to authenticated
using ((select public.current_user_is_super_admin()));

drop policy if exists "radar_findings_admin_update" on public.radar_findings;
create policy "radar_findings_admin_update"
on public.radar_findings for update
to authenticated
using ((select public.current_user_is_super_admin()))
with check ((select public.current_user_is_super_admin()));

drop policy if exists "radar_sources_admin_select" on public.radar_sources;
create policy "radar_sources_admin_select"
on public.radar_sources for select
to authenticated
using ((select public.current_user_is_super_admin()));

drop policy if exists "radar_runs_admin_select" on public.radar_runs;
create policy "radar_runs_admin_select"
on public.radar_runs for select
to authenticated
using ((select public.current_user_is_super_admin()));

select cron.schedule(
  'mittpsyke-radar-daily',
  '15 6 * * *',
  $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'radar_project_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-radar-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'radar_cron_secret')
      ),
      body := jsonb_build_object('trigger', 'daily')
    );
  $cron$
);
