-- Stänger tre verifierade korsanvändarläsningar via Supabase-API:t med den
-- publika anon-nyckeln. Inget innehåll ändras eller raderas.
--
-- 1. analytics_events: "select_all"/"insert_all" gällde rollen public med
--    USING/WITH CHECK (true), och anon/authenticated hade full tabellbehörighet.
--    Vem som helst kunde läsa (och skriva) rader med user_id, session_id och
--    klientmetadata. Tabellen skrivs bara av /api/analytics med service role,
--    så den blir server-only.
--
-- 2. profiles: "Public can read profiles" (USING true, anon + authenticated)
--    lät vem som helst lista alla användares id och visningsnamn. Enda
--    klientläsningen är användarens eget visningsnamn i layouten.
--
-- 3. community_posts/community_comments: select-policyn släppte in alla
--    inloggade till alla rader inklusive user_id, trots att Gemenskapen visas
--    anonymt. Tillsammans med punkt 2 gick en anonym delning att koppla till ett
--    namn. Klientrollen ser nu bara egna rader (export och unshare behöver
--    dem); flödet och kommentarerna läses via servern med service role, och
--    user_id skickas aldrig till klienten.

-- 1. analytics_events → server-only
drop policy if exists "analytics_events_select_all" on public.analytics_events;
drop policy if exists "analytics_events_insert_all" on public.analytics_events;
revoke all on table public.analytics_events from anon, authenticated;

-- 2. profiles → bara egen rad
drop policy if exists "Public can read profiles" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

revoke all on table public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.profiles from authenticated;

-- 3. community → klienten ser bara egna, ej borttagna rader
drop policy if exists "community_posts_select_authenticated" on public.community_posts;
drop policy if exists "community_posts_select_own" on public.community_posts;
create policy "community_posts_select_own"
on public.community_posts
for select
to authenticated
using ((select auth.uid()) = user_id and deleted_at is null);

drop policy if exists "community_comments_select_authenticated" on public.community_comments;
drop policy if exists "community_comments_select_own" on public.community_comments;
create policy "community_comments_select_own"
on public.community_comments
for select
to authenticated
using ((select auth.uid()) = user_id and deleted_at is null);

revoke all on table public.community_posts from anon;
revoke all on table public.community_comments from anon;
