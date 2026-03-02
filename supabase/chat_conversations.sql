create extension if not exists pgcrypto;

create table if not exists public.conversations (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	category text,
	created_at timestamptz not null default now()
);

create index if not exists conversations_user_id_created_at_idx
	on public.conversations (user_id, created_at desc);

alter table public.conversations enable row level security;

drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own"
	on public.conversations
	for select
	using (auth.uid() = user_id);

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own"
	on public.conversations
	for insert
	with check (auth.uid() = user_id);

create table if not exists public.messages (
	id uuid primary key default gen_random_uuid(),
	conversation_id uuid not null references public.conversations (id) on delete cascade,
	role text not null check (role in ('user', 'assistant')),
	content text not null check (char_length(trim(content)) > 0),
	created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_created_at_idx
	on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
	on public.messages
	for select
	using (
		exists (
			select 1
			from public.conversations c
			where c.id = messages.conversation_id
				and c.user_id = auth.uid()
		)
	);

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
	on public.messages
	for insert
	with check (
		exists (
			select 1
			from public.conversations c
			where c.id = messages.conversation_id
				and c.user_id = auth.uid()
		)
	);
