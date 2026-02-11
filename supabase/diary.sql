create extension if not exists pgcrypto;

create table if not exists public.diary (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	text text not null check (char_length(trim(text)) > 0),
	mood text null,
	tags text[] null,
	created_at timestamptz not null default now()
);

create index if not exists diary_user_id_created_at_idx on public.diary (user_id, created_at desc);

alter table public.diary enable row level security;

drop policy if exists "diary_select_own" on public.diary;
create policy "diary_select_own"
	on public.diary
	for select
	using (auth.uid() = user_id);

drop policy if exists "diary_insert_own" on public.diary;
create policy "diary_insert_own"
	on public.diary
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "diary_update_own" on public.diary;
create policy "diary_update_own"
	on public.diary
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

drop policy if exists "diary_delete_own" on public.diary;
create policy "diary_delete_own"
	on public.diary
	for delete
	using (auth.uid() = user_id);
