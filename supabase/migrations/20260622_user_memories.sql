-- ============================================================
-- MittPsyke: Användarminne (korta återkommande teman)
-- Kör detta i Supabase SQL Editor
-- Idempotent – säker att köra flera gånger
--
-- Syfte: kontinuitet mellan samtal, INTE personlig profilering.
-- Vi lagrar aldrig hela samtal här – bara korta, distillerade teman.
-- Max 10 minnespunkter per användare (säkras både i appen och via trigger).
-- All åtkomst sker per användare via RLS (auth.uid()).
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.user_memories (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 500),
	created_at timestamptz not null default now()
);

create index if not exists user_memories_user_id_created_at_idx
	on public.user_memories (user_id, created_at desc);

-- ------------------------------------------------------------
-- Säkerställ max 10 minnespunkter per användare.
-- Behåller de 10 senaste och rensar äldre vid varje insert.
-- ------------------------------------------------------------
create or replace function public.enforce_user_memories_limit()
returns trigger
language plpgsql
as $$
begin
	delete from public.user_memories
	where user_id = new.user_id
		and id not in (
			select id
			from public.user_memories
			where user_id = new.user_id
			order by created_at desc, id desc
			limit 10
		);
	return new;
end;
$$;

drop trigger if exists trg_enforce_user_memories_limit on public.user_memories;
create trigger trg_enforce_user_memories_limit
	after insert on public.user_memories
	for each row
	execute function public.enforce_user_memories_limit();

-- ------------------------------------------------------------
-- RLS: varje användare når enbart sina egna minnen.
-- ------------------------------------------------------------
alter table public.user_memories enable row level security;

drop policy if exists "user_memories_select_own" on public.user_memories;
create policy "user_memories_select_own"
	on public.user_memories
	for select
	using (auth.uid() = user_id);

drop policy if exists "user_memories_insert_own" on public.user_memories;
create policy "user_memories_insert_own"
	on public.user_memories
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "user_memories_update_own" on public.user_memories;
create policy "user_memories_update_own"
	on public.user_memories
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

drop policy if exists "user_memories_delete_own" on public.user_memories;
create policy "user_memories_delete_own"
	on public.user_memories
	for delete
	using (auth.uid() = user_id);
