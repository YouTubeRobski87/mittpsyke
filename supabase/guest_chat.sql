-- ============================================================
-- MittPsyke: Anonyma gästkonversationer (chatt utan konto)
-- Kör detta i Supabase SQL Editor
-- Idempotent – säker att köra flera gånger
--
-- Gästdata är kortlivad och får inte ligga kvar långsiktigt. Den rensas
-- automatiskt (retention 24h) via cron-rutten /api/cron/guest-cleanup.
-- Skrivning/läsning sker enbart server-side med service role; därför är
-- RLS påslaget utan publika policys (anonyma klienter når aldrig tabellerna
-- direkt, service role kringgår RLS).
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.guest_conversations (
	id uuid primary key default gen_random_uuid(),
	guest_id text not null,
	category text,
	title text,
	created_at timestamptz not null default now()
);

-- Lägg till kolumner i efterhand om tabellen redan finns utan dem.
alter table public.guest_conversations add column if not exists title text;
alter table public.guest_conversations add column if not exists created_at timestamptz not null default now();

create index if not exists guest_conversations_guest_id_idx
	on public.guest_conversations (guest_id);

-- Index för retention-rensning på ålder.
create index if not exists guest_conversations_created_at_idx
	on public.guest_conversations (created_at);

create table if not exists public.guest_messages (
	id uuid primary key default gen_random_uuid(),
	conversation_id uuid not null references public.guest_conversations (id) on delete cascade,
	role text not null check (role in ('user', 'assistant')),
	content text not null check (char_length(trim(content)) > 0),
	created_at timestamptz not null default now()
);

create index if not exists guest_messages_conversation_id_created_at_idx
	on public.guest_messages (conversation_id, created_at);

-- Index för retention-rensning på ålder.
create index if not exists guest_messages_created_at_idx
	on public.guest_messages (created_at);

-- RLS på, men inga publika policys: endast service role (server-side) når
-- gästdata. Hindrar anonyma klienter från att läsa andra gästers samtal.
alter table public.guest_conversations enable row level security;
alter table public.guest_messages enable row level security;
