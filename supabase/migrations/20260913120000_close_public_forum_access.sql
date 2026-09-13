-- Stänger publik åtkomst till det gamla forumet.
--
-- Forumet finns inte längre i produkten, men trådar och svar gick fortfarande
-- att läsa för vem som helst via Supabase-API:t med den publika nyckeln:
-- policyerna *_public_select gällde rollen public, och anon hade full
-- tabellbehörighet. Svaret innehöll user_id, även för inlägg som visats som
-- anonyma.
--
-- Efter migrationen:
-- - anon har ingen behörighet alls på forum_threads, forum_replies eller
--   forum_reports.
-- - Inloggade ser bara sina egna trådar och svar (forum_*_owner_select), vilket
--   dataexporten behöver.
--
-- Innehållet ändras eller raderas inte här.

drop policy if exists "forum_threads_public_select" on public.forum_threads;
drop policy if exists "forum_replies_public_select" on public.forum_replies;

revoke all on table public.forum_threads from anon;
revoke all on table public.forum_replies from anon;
revoke all on table public.forum_reports from anon;
