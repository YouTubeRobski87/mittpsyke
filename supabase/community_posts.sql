create extension if not exists pgcrypto;

create table if not exists public.community_posts (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	diary_entry_id uuid not null references public.diary (id) on delete cascade,
	content text not null check (char_length(trim(content)) > 0),
	mood text null,
	created_at timestamptz not null default now(),
	deleted_at timestamptz null
);

create index if not exists community_posts_created_at_idx
	on public.community_posts (created_at desc)
	where deleted_at is null;

create index if not exists community_posts_user_id_created_at_idx
	on public.community_posts (user_id, created_at desc)
	where deleted_at is null;

create unique index if not exists community_posts_unique_active_diary_entry_idx
	on public.community_posts (diary_entry_id)
	where deleted_at is null;

alter table public.community_posts enable row level security;

-- Klientrollen ser bara egna rader. Flödet läses av servern med service role
-- så user_id aldrig kan kopplas till ett anonymt visat inlägg. Se
-- migrations/20260926120000_restrict_cross_user_reads.sql.
drop policy if exists "community_posts_select_authenticated" on public.community_posts;
drop policy if exists "community_posts_select_own" on public.community_posts;
create policy "community_posts_select_own"
	on public.community_posts
	for select
	to authenticated
	using ((select auth.uid()) = user_id and deleted_at is null);

revoke all on table public.community_posts from anon;

drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own"
	on public.community_posts
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "community_posts_update_own" on public.community_posts;
create policy "community_posts_update_own"
	on public.community_posts
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);
