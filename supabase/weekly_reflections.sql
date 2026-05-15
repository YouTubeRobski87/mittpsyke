create extension if not exists pgcrypto;

do $$
begin
	if not exists (select 1 from pg_type where typname = 'weekly_reflection_status') then
		create type public.weekly_reflection_status as enum ('ready', 'paused', 'opened', 'expired');
	end if;
end $$;

create table if not exists public.weekly_reflections (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	week_start date not null,
	words jsonb not null default '[]'::jsonb,
	quoted_sentence text null,
	quoted_sentence_post_id uuid null references public.diary (id) on delete set null,
	movement text null,
	open_question text null,
	status public.weekly_reflection_status not null default 'ready',
	paused_reason text null,
	context_snapshot jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	opened_at timestamptz null,
	constraint weekly_reflections_user_week_unique unique (user_id, week_start),
	constraint weekly_reflections_week_start_monday check (extract(isodow from week_start) = 1),
	constraint weekly_reflections_paused_reason_check check (
		(status = 'paused' and paused_reason is not null)
		or (status <> 'paused')
	)
);

create index if not exists weekly_reflections_user_week_idx
	on public.weekly_reflections (user_id, week_start desc);

alter table public.weekly_reflections enable row level security;

drop policy if exists "weekly_reflections_select_own" on public.weekly_reflections;
create policy "weekly_reflections_select_own"
	on public.weekly_reflections
	for select
	using (auth.uid() = user_id);

drop policy if exists "weekly_reflections_insert_own" on public.weekly_reflections;
create policy "weekly_reflections_insert_own"
	on public.weekly_reflections
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "weekly_reflections_update_own" on public.weekly_reflections;
create policy "weekly_reflections_update_own"
	on public.weekly_reflections
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);
