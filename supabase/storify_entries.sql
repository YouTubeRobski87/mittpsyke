create extension if not exists pgcrypto;

create table if not exists public.storify_entries (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	content text not null check (char_length(trim(content)) > 0),
	tone text null,
	mood_emojis text[] null,
	energy_score integer null,
	created_at timestamptz not null default now()
);

create index if not exists storify_entries_user_id_created_at_idx
	on public.storify_entries (user_id, created_at desc);

alter table public.storify_entries enable row level security;

drop policy if exists "storify_select_own" on public.storify_entries;
create policy "storify_select_own"
	on public.storify_entries
	for select
	using (auth.uid() = user_id);

drop policy if exists "storify_insert_own" on public.storify_entries;
create policy "storify_insert_own"
	on public.storify_entries
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "storify_delete_own" on public.storify_entries;
create policy "storify_delete_own"
	on public.storify_entries
	for delete
	using (auth.uid() = user_id);
