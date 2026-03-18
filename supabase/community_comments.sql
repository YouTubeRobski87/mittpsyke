create extension if not exists pgcrypto;

create table if not exists public.community_comments (
	id uuid primary key default gen_random_uuid(),
	post_id uuid not null references public.community_posts (id) on delete cascade,
	user_id uuid not null references auth.users (id) on delete cascade,
	body text not null check (char_length(trim(body)) between 1 and 280),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz null
);

create index if not exists community_comments_post_id_created_at_idx
	on public.community_comments (post_id, created_at asc)
	where deleted_at is null;

create index if not exists community_comments_user_id_created_at_idx
	on public.community_comments (user_id, created_at desc)
	where deleted_at is null;

alter table public.community_comments enable row level security;

drop policy if exists "community_comments_select_authenticated" on public.community_comments;
create policy "community_comments_select_authenticated"
	on public.community_comments
	for select
	using (
		auth.role() = 'authenticated'
		and deleted_at is null
		and exists (
			select 1
			from public.community_posts post
			where post.id = post_id
				and post.deleted_at is null
		)
	);

drop policy if exists "community_comments_insert_authenticated" on public.community_comments;
create policy "community_comments_insert_authenticated"
	on public.community_comments
	for insert
	with check (
		auth.uid() = user_id
		and deleted_at is null
		and exists (
			select 1
			from public.community_posts post
			where post.id = post_id
				and post.deleted_at is null
				and post.user_id <> auth.uid()
		)
	);

drop policy if exists "community_comments_update_own" on public.community_comments;
create policy "community_comments_update_own"
	on public.community_comments
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);
