-- Dagars avtryck sends an interview transcript to Anthropic and therefore has
-- its own purpose/provider-specific consent. No backfill: older diary AI
-- consent must not authorize this separate processing.
-- Deploy this migration before application code that grants this scope.

alter table public.user_ai_consents
	drop constraint if exists user_ai_consents_scope_check;

alter table public.user_ai_consents
	add constraint user_ai_consents_scope_check
	check (
		scope in (
			'diary_ai_reflection',
			'chat_ai_support',
			'diary_ai_weekly_summary',
			'diary_ai_daily_question',
			'diary_ai_storify'
		)
	);
