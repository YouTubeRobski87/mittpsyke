-- En enda rad betyder att användaren har haft minst ett lugnt livstecken
-- under den aktuella ISO-veckan i Stockholm. Tabellen innehåller medvetet
-- varken innehåll, signaltyp eller exakt tidpunkt.
create table if not exists public.companion_presence_weeks (
	user_id uuid not null references auth.users (id) on delete cascade,
	week_start date not null,
	primary key (user_id, week_start),
	constraint companion_presence_weeks_week_start_monday
		check (extract(isodow from week_start) = 1)
);

alter table public.companion_presence_weeks enable row level security;

-- Veckorna är läsbara bara för sin ägare. Direkt skrivåtkomst saknas helt:
-- den säkra funktionen nedan bestämmer alltid användare och vecka själv.
revoke all on table public.companion_presence_weeks from anon, authenticated;
grant select on table public.companion_presence_weeks to authenticated;

drop policy if exists "companion_presence_weeks_select_own" on public.companion_presence_weeks;
create policy "companion_presence_weeks_select_own"
	on public.companion_presence_weeks
	for select
	to authenticated
	using ((select auth.uid()) = user_id);

-- Säker, idempotent registrering av innevarande Stockholm-vecka. Anropet
-- accepterar inga parametrar, så klienten kan aldrig välja användare eller
-- datum. SECURITY DEFINER behövs eftersom tabellen saknar INSERT-policy.
create or replace function public.record_companion_presence_week()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	current_week_start date := date_trunc('week', timezone('Europe/Stockholm', now()))::date;
begin
	if current_user_id is null then
		raise exception 'Authentication required.';
	end if;

	if coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'true' then
		raise exception 'Anonymous users cannot record companion presence.';
	end if;

	insert into public.companion_presence_weeks (user_id, week_start)
	values (current_user_id, current_week_start)
	on conflict (user_id, week_start) do nothing;

	return found;
end;
$$;

revoke execute on function public.record_companion_presence_week() from public, anon;
grant execute on function public.record_companion_presence_week() to authenticated;
