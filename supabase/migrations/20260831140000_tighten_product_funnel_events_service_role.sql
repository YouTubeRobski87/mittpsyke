-- Product Funnel Analytics V1, Pass B.1: least privilege för service_role.
--
-- Efter att 20260831120000_product_funnel_events.sql applicerats visade
-- produktionskontrollen att service_role hade samtliga sju rättigheter på
-- tabellen, inte bara de två som migrationen gav:
--
--   SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
--
-- Orsaken är Supabases ALTER DEFAULT PRIVILEGES på schemat public, som delar ut
-- arwdDxtm (ALL) till anon, authenticated OCH service_role på varje ny tabell:
--
--   {postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres,
--    authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres}
--
-- Den föregående migrationen återkallade det för public, anon och authenticated
-- men rörde aldrig service_role. Dess `grant select, insert to service_role`
-- blev därmed en no-op ovanpå ett redan utdelat ALL - raden såg restriktiv ut
-- utan att vara det.
--
-- Det här är ingen akut exponering: service_role är ett betrott
-- serverautentiseringsbevis med rolbypassrls, och den som har nyckeln kan redan
-- nå vilken tabell som helst. Problemet är att produktionens faktiska tillstånd
-- inte matchade migrationens uttryckta avsikt, så en läsare drog fel slutsats om
-- vad som var blockerat.
--
-- Applikationen skriver bara med INSERT (se recordFunnelEvent i
-- src/lib/server/funnel-events.ts) och läser med SELECT. Ingenting i koden
-- behöver UPDATE, DELETE, TRUNCATE, REFERENCES eller TRIGGER. Att eventen är
-- oföränderliga är dessutom en poäng i sig: en trattobservation ska inte kunna
-- redigeras i efterhand.
--
-- Idempotent: REVOKE av en rättighet som inte längre innehas är en no-op i
-- Postgres och ger inget fel.
--
-- Rör endast privilegier på public.product_funnel_events. Ingen policy, ingen
-- RLS-ändring, inget schema, ingen data, ingen annan tabell.

revoke update, delete, truncate, references, trigger
	on table public.product_funnel_events
	from service_role;
