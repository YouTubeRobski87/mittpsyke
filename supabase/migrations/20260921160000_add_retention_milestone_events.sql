-- Prospektiva, gemensamma retentionmilestones för kontoaktivitet.
--
-- Ändrar endast den befintliga eventnamnsbegränsningen. Tabellen, befintliga
-- rader, DB-genererad occurred_at, unique(user_ref, event_name), RLS och
-- privilegier lämnas orörda.

alter table public.product_funnel_events
	drop constraint if exists product_funnel_events_event_name_check;

alter table public.product_funnel_events
	add constraint product_funnel_events_event_name_check
	check (
		event_name in (
			'first_entry_saved',
			'second_active_day',
			'first_meaningful_reflection',
			'w1_return',
			'w4_return'
		)
	);
