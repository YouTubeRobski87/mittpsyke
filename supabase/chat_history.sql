-- ============================================================
-- MittPsyke chat history memory
-- Kor i Supabase SQL Editor
-- Idempotent - saker att kora flera ganger
-- ============================================================

create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = timezone('utc', now());
	return new;
end;
$$;

create table if not exists public.chat_history (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	topic text not null,
	messages jsonb not null default '[]'::jsonb,
	updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists chat_history_user_topic_idx
	on public.chat_history (user_id, topic);

create index if not exists chat_history_user_updated_at_idx
	on public.chat_history (user_id, updated_at desc);

alter table public.chat_history enable row level security;

drop policy if exists "chat_history_select_own" on public.chat_history;
create policy "chat_history_select_own"
	on public.chat_history
	for select
	using (auth.uid() = user_id);

drop policy if exists "chat_history_insert_own" on public.chat_history;
create policy "chat_history_insert_own"
	on public.chat_history
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "chat_history_update_own" on public.chat_history;
create policy "chat_history_update_own"
	on public.chat_history
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

drop policy if exists "chat_history_delete_own" on public.chat_history;
create policy "chat_history_delete_own"
	on public.chat_history
	for delete
	using (auth.uid() = user_id);

drop trigger if exists update_chat_history_updated_at on public.chat_history;
create trigger update_chat_history_updated_at
	before update on public.chat_history
	for each row
	execute function public.update_updated_at_column();
