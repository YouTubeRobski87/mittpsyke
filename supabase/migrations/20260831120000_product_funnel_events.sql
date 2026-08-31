-- Product Funnel Analytics V1, Pass A: serverägd tratt-tabell.
--
-- Egen tabell, inte public.analytics_events. Den senare är landningssidornas
-- A/B-logg och duger inte här av fyra skäl som var för sig hade räckt:
--
--   * landing_page_id är NOT NULL med FK mot landing_pages - ett trattevent
--     som first_entry_saved hör inte till någon landningssida
--   * event_type har ett CHECK låst till 'view'/'conversion'/'click'
--   * policyn analytics_events_select_all är USING (true) för rollen public,
--     dvs. hela innehållet är läsbart för anon via PostgREST
--   * policyn analytics_events_insert_all är WITH CHECK (true), dvs. vem som
--     helst kan skriva påhittade rader
--
-- Den här tabellen mäter ATT en produktinteraktion skedde, aldrig VAD
-- användaren skrev eller kände. Ingen dagbokstext, inget utdrag, inget
-- humörvärde, ingen ordräkning, ingen e-post och inget rått user_id.
--
-- OBS: ingen backfill. Tabellen börjar tom och fylls först av nya, vid
-- eventtillfället sanningsenliga skrivningar. public.diary använder hard
-- delete utan spår, så en historisk backfill hade ändå bara kunnat bli en
-- undre gräns.

create extension if not exists pgcrypto;

create table if not exists public.product_funnel_events (
	id uuid primary key default gen_random_uuid(),

	-- occurred_at, inte created_at. Raden är en observation av ett
	-- produktögonblick, inte innehåll som skapas. I dag sammanfaller de två
	-- eftersom båda eventen skrivs synkront i samma request som lyckades, men
	-- Pass C:s anonyma klientevent passerar ett nätverkshopp och kan komma in
	-- efter en keepalive-retry. Namnet väljs nu så att vi slipper antingen döpa
	-- om kolumnen senare eller lägga till en andra tidskolumn och få två
	-- konkurrerande sanningar. Ett enda begrepp, konsekvent använt.
	occurred_at timestamptz not null default now(),

	-- Endast Pass A:s två event. Nya namn kräver en egen migration, vilket är
	-- meningen: eventlistan ska inte kunna växa av misstag.
	event_name text not null check (event_name in ('first_entry_saved', 'second_active_day')),

	-- Pseudonym, aldrig auth.users.id. Serverberäknad HMAC-SHA256 över
	-- user-id:t med en serverhemlighet, se src/lib/server/funnel-events.ts.
	-- Går inte att räkna tillbaka utan hemligheten.
	user_ref text not null,

	-- Avsedd att låta intern testtrafik filtreras bort ur funnel-siffrorna.
	--
	-- OBS: ingen mekanism för att avgöra detta finns ännu, så kolumnen är
	-- alltid false i Pass A. Ett false-värde betyder alltså INTE att raden kommer
	-- från en extern användare - det betyder bara att frågan ännu inte ställs.
	-- Siffrorna innehåller intern test- och utvecklartrafik tills
	-- INTERNAL_USER_IDS eller motsvarande finns på plats. Se Pass C/E.
	is_internal boolean not null default false,

	-- Alltid '{}' i Pass A. Helpern har en allowlist per event och båda
	-- listorna är tomma - ingen property behövs för att besvara "aktiverade
	-- användaren?" respektive "kom hen tillbaka en andra dag?". Kolumnen finns
	-- för att senare pass ska slippa en ALTER TABLE, inte för att fyllas nu.
	properties jsonb not null default '{}'::jsonb,

	-- Idempotens i schemat, inte i applikationslogiken. Båda eventen är
	-- once-per-account. Utan detta kan två samtidiga första sparningar båda
	-- tro att de är först; med det blir den andra en ren
	-- unique_violation som helpern sväljer.
	constraint product_funnel_events_once_per_user unique (user_ref, event_name)
);

-- Frågemönstret är "hur många first_entry_saved de senaste 28 dagarna".
-- Unique-constraintet täcker uppslag per användare.
create index if not exists idx_product_funnel_events_event_name_occurred_at
	on public.product_funnel_events (event_name, occurred_at desc);

-- ============================================================
-- RLS och privilegier: tabellen är serverägd.
-- ============================================================
--
-- Två oberoende spärrar, avsiktligt:
--
--   1. RLS på UTAN en enda policy. I Postgres nekas allt som inte uttryckligen
--      tillåts av en policy, så anon och authenticated får noll rader och noll
--      skrivningar även om någon senare råkar dela ut grants igen.
--   2. Grants återkallade. Supabase delar som standard ut alla rättigheter på
--      nya tabeller i public till anon och authenticated via ALTER DEFAULT
--      PRIVILEGES - det är precis så analytics_events blev publikt läsbar.
--      Utan det här REVOKE:t hade den här tabellen ärvt samma problem.
--
-- service_role har rolbypassrls och behöver därför ingen policy, bara grants.
-- Webbläsaren ska aldrig kunna skriva hit: all skrivning går genom serverkod.

alter table public.product_funnel_events enable row level security;

revoke all on table public.product_funnel_events from public;
revoke all on table public.product_funnel_events from anon;
revoke all on table public.product_funnel_events from authenticated;

grant select, insert on table public.product_funnel_events to service_role;
