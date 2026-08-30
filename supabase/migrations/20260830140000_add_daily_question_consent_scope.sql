-- Diary AI Consent Coverage Audit V2: eget scope för dagens fråga.
--
-- Daily-question är en annan behandling än dagboksreflektionen, av tre skäl som
-- var för sig hade räckt:
--
--   * providern är Anthropic, medan diary_ai_reflection-copyn namnger OpenAI
--   * anropet sker automatiskt vid sidladdning, medan copyn säger "bara när du
--     aktivt väljer"
--   * ändamålet är att skapa en NY fråga ur historisk kontext, inte att spegla
--     tillbaka en text användaren just skrev
--
-- Att låta det gamla scopet täcka det hade breddat betydelsen av ett samtycke
-- användare redan gett.
--
-- Ingen ny tabell: samma user_ai_consents, samma primärnyckel (user_id, scope),
-- samma RLS, samma service-role-skrivning, samma FK mot auth.users. Enda
-- ändringen är att scope-villkoret vidgas med ett värde.
--
-- Ingen backfill. Ett granted diary_ai_reflection ger noll daily-question-
-- access även efter den här migrationen, eftersom hasAiConsent matchar på exakt
-- scope. Användaren måste ge det nya samtycket aktivt.
--
-- OBS vid driftsättning: den här migrationen MÅSTE vara körd i produktion INNAN
-- kod som skriver diary_ai_daily_question deployas. Utan den avvisar
-- constraintet skrivningen, och eftersom grinden är fail-closed skulle
-- funktionen svara 403 för alla användare.

alter table public.user_ai_consents
	drop constraint if exists user_ai_consents_scope_check;

alter table public.user_ai_consents
	add constraint user_ai_consents_scope_check
	check (
		scope in (
			'diary_ai_reflection',
			'chat_ai_support',
			'diary_ai_weekly_summary',
			'diary_ai_daily_question'
		)
	);
