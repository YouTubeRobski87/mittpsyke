-- RLS begränsar vilka rader som får läsas, men inte vilka kolumner som
-- exponeras. Behåll publik läsning av godkända berättelser och ta bort
-- direktåtkomst till interna modererings- och rate-limitfält.
revoke select on table public.anonymous_stories from anon, authenticated;

grant select (
  id,
  content,
  age_range,
  gender,
  emotion_emoji,
  status,
  created_at,
  approved_at
) on table public.anonymous_stories to anon, authenticated;
