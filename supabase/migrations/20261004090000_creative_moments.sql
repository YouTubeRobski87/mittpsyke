create extension if not exists pgcrypto;

create table if not exists public.creative_moments (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	activity_type text not null check (activity_type = 'world_coloring'),
	session_id uuid not null,
	occurred_at timestamptz not null default now(),
	constraint creative_moments_user_activity_session_key
		unique (user_id, activity_type, session_id)
);

create index if not exists creative_moments_user_activity_occurred_at_idx
	on public.creative_moments (user_id, activity_type, occurred_at desc);

alter table public.creative_moments enable row level security;

revoke all on table public.creative_moments from anon, authenticated;
grant select, insert on table public.creative_moments to authenticated;

drop policy if exists "creative_moments_select_own" on public.creative_moments;
create policy "creative_moments_select_own"
	on public.creative_moments
	for select
	to authenticated
	using ((select auth.uid()) = user_id);

drop policy if exists "creative_moments_insert_own" on public.creative_moments;
create policy "creative_moments_insert_own"
	on public.creative_moments
	for insert
	to authenticated
	with check ((select auth.uid()) = user_id);
