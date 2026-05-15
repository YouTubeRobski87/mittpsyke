create extension if not exists pgcrypto;

create table if not exists public.daily_questions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	date date not null,
	question_text text not null check (char_length(trim(question_text)) > 0),
	context_snapshot jsonb not null default '{}'::jsonb,
	regenerations int not null default 0 check (regenerations >= 0 and regenerations <= 2),
	created_at timestamptz not null default now(),
	constraint daily_questions_user_date_unique unique (user_id, date)
);

create index if not exists daily_questions_user_date_idx
	on public.daily_questions (user_id, date desc);

alter table public.daily_questions enable row level security;

drop policy if exists "daily_questions_select_own" on public.daily_questions;
create policy "daily_questions_select_own"
	on public.daily_questions
	for select
	using (auth.uid() = user_id);

drop policy if exists "daily_questions_insert_own" on public.daily_questions;
create policy "daily_questions_insert_own"
	on public.daily_questions
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "daily_questions_update_own" on public.daily_questions;
create policy "daily_questions_update_own"
	on public.daily_questions
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);
