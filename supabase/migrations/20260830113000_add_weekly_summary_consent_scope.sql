-- Consent Scope Separation V1: serverägt samtycke för veckosammanfattningen.
--
-- Veckosammanfattningen är en annan behandling än dagboksreflektionen. Copyn
-- bakom diary_ai_reflection beskriver en aktivt vald reflektion på EN
-- incheckning; weekly-summary skickar flera sparade inlägg över en period för
-- att hitta känslotrender och övergripande mönster. Att låta det gamla scopet
-- täcka det hade breddat betydelsen av ett samtycke användare redan gett.
--
-- Ingen ny tabell: samma user_ai_consents, samma primärnyckel (user_id, scope),
-- samma RLS, samma service-role-skrivning, samma FK mot auth.users. Enda
-- ändringen är att scope-villkoret vidgas med ett värde.
--
-- Ingen backfill. Ett granted diary_ai_reflection ger noll weekly-summary-
-- access även efter den här migrationen, eftersom hasAiConsent matchar på exakt
-- scope. Användaren måste ge det nya samtycket aktivt.
--
-- OBS vid driftsättning: den här migrationen MÅSTE vara körd i produktion INNAN
-- kod som skriver diary_ai_weekly_summary deployas. Utan den avvisar
-- constraintet skrivningen, och eftersom grinden är fail-closed skulle
-- funktionen svara 403 för alla användare.

alter table public.user_ai_consents
	drop constraint if exists user_ai_consents_scope_check;

alter table public.user_ai_consents
	add constraint user_ai_consents_scope_check
	check (scope in ('diary_ai_reflection', 'chat_ai_support', 'diary_ai_weekly_summary'));
