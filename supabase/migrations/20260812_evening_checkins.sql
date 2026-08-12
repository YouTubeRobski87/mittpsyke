create extension if not exists pgcrypto;

create table if not exists public.evening_checkins (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	theme_id text not null check (theme_id in ('racing_thoughts', 'body_anxiety', 'loneliness', 'tomorrow', 'other')),
	thought text null check (thought is null or char_length(thought) <= 1200),
	parking_bucket text not null check (parking_bucket in ('tomorrow', 'small_step', 'not_tonight')),
	created_at timestamptz not null default now(),
	checkin_date date not null default (timezone('Europe/Stockholm', now()))::date,
	flow_version text not null check (flow_version = 'evening-calm-v1')
);

create index if not exists evening_checkins_user_id_checkin_date_idx
	on public.evening_checkins (user_id, checkin_date desc);

alter table public.evening_checkins enable row level security;

revoke all on table public.evening_checkins from anon, authenticated;
grant select, insert on table public.evening_checkins to authenticated;

drop policy if exists "evening_checkins_select_own" on public.evening_checkins;
create policy "evening_checkins_select_own"
	on public.evening_checkins
	for select
	to authenticated
	using ((select auth.uid()) = user_id);

drop policy if exists "evening_checkins_insert_own" on public.evening_checkins;
create policy "evening_checkins_insert_own"
	on public.evening_checkins
	for insert
	to authenticated
	with check (
		(select auth.uid()) = user_id
		and checkin_date = (timezone('Europe/Stockholm', now()))::date
	);
