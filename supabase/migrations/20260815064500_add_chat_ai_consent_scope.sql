-- Trust Pass V3.2: serverägt samtycke för AI-chatten.
--
-- Chatten är en annan behandling än dagboksreflektionen: andra uppgifter
-- (meddelanden användaren skriver i chatten, inte sparade dagboksinlägg) och
-- ett annat ändamål (samtalsstöd, inte reflektion över ett inlägg). Därför får
-- den ett eget scope i stället för att återanvända diary_ai_reflection.
--
-- Ingen ny tabell: samma user_ai_consents, samma RLS, samma service-role-
-- skrivning, samma FK mot auth.users. Enda ändringen är att scope-villkoret
-- vidgas med ett värde.
--
-- OBS vid driftsättning: den här migrationen MÅSTE vara körd i produktion
-- INNAN koden deployas. Utan den avvisar constraintet skrivningar med
-- chat_ai_support, och eftersom grinden är fail-closed skulle inloggad chatt
-- svara 403 för alla användare.

alter table public.user_ai_consents
	drop constraint if exists user_ai_consents_scope_check;

alter table public.user_ai_consents
	add constraint user_ai_consents_scope_check
	check (scope in ('diary_ai_reflection', 'chat_ai_support'));
