-- ============================================================
-- MittPsyke: Anonyma gästkonversationer (chatt utan konto)
-- Kör detta i Supabase SQL Editor
-- Idempotent – säker att köra flera gånger
--
-- Historiskt schema. Ny serverlagring av gästchatt är pausad från 9 augusti
-- 2026 medan datahantering och incidentbedömning ses över. Kör inte detta för
-- att återaktivera gästlagring utan ett uttryckligt, granskat beslut.
-- När detta schema var aktivt skedde skrivning/läsning enbart server-side med
-- service role. RLS är därför påslaget utan publika policys.
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
