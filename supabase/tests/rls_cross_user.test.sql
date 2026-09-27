-- Korsanvändartest för RLS: user A !== user B.
--
-- Verifierar faktisk databasbehörighet, inte bara att en policy finns. Varje
-- kontroll körs som rollen PostgREST använder (anon/authenticated) med en
-- JWT-claim för en viss användare, precis som ett anrop med den publika
-- anon-nyckeln plus användarens access token.
--
-- Körs mot lokal stack eller en branch-databas (`supabase test db`), aldrig mot
-- produktion. Allt sker i en transaktion som rullas tillbaka.

begin;

select plan(78);

-- ── Testanvändare ────────────────────────────────────────────────────────
-- A = '…0a', B = '…0b'. Seed sker som tabellägare (förbi RLS).
insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'),
  ('00000000-0000-4000-8000-00000000000b');

-- Kör en SQL-sats som en viss roll/användare och returnerar antal lästa eller
-- påverkade rader, eller 'denied' om databasen nekar (42501).
create or replace function pg_temp.try(p_role text, p_sub uuid, p_sql text)
returns text language plpgsql as $$
declare n bigint;
begin
  perform set_config(
    'request.jwt.claims',
    case when p_sub is null then json_build_object('role', p_role)::text
         else json_build_object('sub', p_sub, 'role', p_role)::text end,
    true
  );
  execute format('set local role %I', p_role);
  begin
    -- SELECT returnerar ett antal. DML körs utan RETURNING, som PostgREST gör
    -- med "Prefer: return=minimal" (supabase-js .update() utan .select()).
    -- Med RETURNING hade SELECT-policyn kunnat dölja en lyckad skrivning.
    if p_sql ~* '^\s*select' then
      execute p_sql into n;
    else
      execute p_sql;
      get diagnostics n = row_count;
    end if;
  exception
    when insufficient_privilege then
      reset role;
      return 'denied';
    when others then
      reset role;
      return 'error:' || sqlstate;
  end;
  reset role;
  return n::text;
end $$;

-- ── Seed: en rad per känslig tabell, ägd av A ────────────────────────────
insert into public.diary (id, user_id, text) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000000a', 'A privat');
insert into public.chat_history (id, user_id, topic) values
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-00000000000a', 'A');
insert into public.conversations (id, user_id, category) values
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-00000000000a', 'G');
insert into public.messages (id, conversation_id, role, content) values
  ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', 'user', 'A privat');
insert into public.evening_checkins (id, user_id, theme_id, parking_bucket, flow_version) values
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-00000000000a', 'other', 'tomorrow', 'evening-calm-v1');
insert into public.companion_daily_answers (user_id, answer_date, question_id, answer_id) values
  ('00000000-0000-4000-8000-00000000000a', current_date, 'q', 'a');
insert into public.user_memories (id, user_id, content) values
  ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-00000000000a', 'A tema');
insert into public.notifications (id, user_id, type, title) values
  ('10000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-00000000000a', 't', 'A');
insert into public.storify_entries (id, user_id, content) values
  ('10000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-00000000000a', 'A');
insert into public.user_sms_preferences (user_id, phone_number) values
  ('00000000-0000-4000-8000-00000000000a', '+46700000000');
insert into public.profiles (id, display_name) values
  ('00000000-0000-4000-8000-00000000000a', 'A namn');
insert into public.community_posts (id, user_id, diary_entry_id, content) values
  ('10000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000001', 'A delat');
insert into public.community_comments (id, post_id, user_id, body) values
  ('10000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-00000000000a', 'A svar');
insert into public.user_ai_consents (user_id, scope, status, policy_version) values
  ('00000000-0000-4000-8000-00000000000a', 'chat_ai_support', 'granted', 'v1');
insert into public.forum_categories (id, name) values ('test', 'Test');
insert into public.forum_threads (id, category_id, user_id, title, body) values
  ('10000000-0000-4000-8000-000000000011', 'test', '00000000-0000-4000-8000-00000000000b', 'B tråd', 'B tråd innehåll');

-- ── Dagbok ───────────────────────────────────────────────────────────────
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$select count(*) from public.diary where id = '10000000-0000-4000-8000-000000000001'$q$), '1',
  'diary: A läser egen rad');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$update public.diary set mood = mood where id = '10000000-0000-4000-8000-000000000001'$q$), '1',
  'diary: A uppdaterar egen rad');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.diary where id = '10000000-0000-4000-8000-000000000001'$q$), '0',
  'diary: B läser inte A');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$update public.diary set text = 'B' where id = '10000000-0000-4000-8000-000000000001'$q$) in ('0', 'denied'),
  'diary: B kan inte uppdatera A');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$delete from public.diary where id = '10000000-0000-4000-8000-000000000001'$q$) in ('0', 'denied'),
  'diary: B kan inte radera A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$insert into public.diary (user_id, text) values ('00000000-0000-4000-8000-00000000000a', 'B')$q$), 'denied',
  'diary: B kan inte skapa rad med user_id=A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$update public.diary set user_id = '00000000-0000-4000-8000-00000000000b' where id = '10000000-0000-4000-8000-000000000001'$q$), '0',
  'diary: B kan inte ta över A:s rad');
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.diary$q$) in ('0', 'denied'),
  'diary: anon får 0 rader');
select is((select text from public.diary where id = '10000000-0000-4000-8000-000000000001'), 'A privat',
  'diary: A:s rad är oförändrad efter B:s försök');

-- ── Chatt (inloggad) ─────────────────────────────────────────────────────
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$select count(*) from public.messages where id = '10000000-0000-4000-8000-000000000004'$q$), '1',
  'messages: A läser eget meddelande');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.messages where id = '10000000-0000-4000-8000-000000000004'$q$), '0',
  'messages: B läser inte A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$insert into public.messages (conversation_id, role, content) values ('10000000-0000-4000-8000-000000000003', 'user', 'B')$q$), 'denied',
  'messages: B kan inte skriva in i A:s konversation');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$delete from public.messages where id = '10000000-0000-4000-8000-000000000004'$q$) in ('0', 'denied'),
  'messages: B kan inte radera A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.conversations where id = '10000000-0000-4000-8000-000000000003'$q$), '0',
  'conversations: B läser inte A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$insert into public.conversations (user_id, category) values ('00000000-0000-4000-8000-00000000000a', 'G')$q$), 'denied',
  'conversations: B kan inte skapa rad med user_id=A');
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.messages$q$) in ('0', 'denied'),
  'messages: anon får 0 rader');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.chat_history where id = '10000000-0000-4000-8000-000000000002'$q$), '0',
  'chat_history: B läser inte A');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$update public.chat_history set topic = 'B' where id = '10000000-0000-4000-8000-000000000002'$q$) in ('0', 'denied'),
  'chat_history: B kan inte uppdatera A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$insert into public.chat_history (user_id, topic) values ('00000000-0000-4000-8000-00000000000a', 'B')$q$), 'denied',
  'chat_history: B kan inte skapa rad med user_id=A');

-- ── Kvällsincheckning och följeslagare ───────────────────────────────────
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$select count(*) from public.evening_checkins where id = '10000000-0000-4000-8000-000000000005'$q$), '1',
  'evening_checkins: A läser egen rad');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.evening_checkins where id = '10000000-0000-4000-8000-000000000005'$q$), '0',
  'evening_checkins: B läser inte A');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$update public.evening_checkins set thought = 'B' where id = '10000000-0000-4000-8000-000000000005'$q$) in ('0', 'denied'),
  'evening_checkins: B kan inte uppdatera A');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$delete from public.evening_checkins where id = '10000000-0000-4000-8000-000000000005'$q$) in ('0', 'denied'),
  'evening_checkins: B kan inte radera A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$insert into public.evening_checkins (user_id, theme_id, parking_bucket, flow_version) values ('00000000-0000-4000-8000-00000000000a', 'other', 'tomorrow', 'evening-calm-v1')$q$), 'denied',
  'evening_checkins: B kan inte skapa rad med user_id=A');
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.evening_checkins$q$) in ('0', 'denied'),
  'evening_checkins: anon får 0 rader');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.companion_daily_answers where user_id = '00000000-0000-4000-8000-00000000000a'$q$), '0',
  'companion_daily_answers: B läser inte A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$insert into public.companion_daily_answers (user_id, answer_date, question_id, answer_id) values ('00000000-0000-4000-8000-00000000000a', (timezone('Europe/Stockholm', now()))::date, 'q2', 'a')$q$), 'denied',
  'companion_daily_answers: B kan inte skapa rad med user_id=A');

-- ── AI-minne, notiser, storify, sms ──────────────────────────────────────
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.user_memories where id = '10000000-0000-4000-8000-000000000006'$q$), '0',
  'user_memories: B läser inte A');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$delete from public.user_memories where id = '10000000-0000-4000-8000-000000000006'$q$) in ('0', 'denied'),
  'user_memories: B kan inte radera A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$insert into public.user_memories (user_id, content) values ('00000000-0000-4000-8000-00000000000a', 'B')$q$), 'denied',
  'user_memories: B kan inte skapa rad med user_id=A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.notifications where id = '10000000-0000-4000-8000-000000000007'$q$), '0',
  'notifications: B läser inte A');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$update public.notifications set is_read = true where id = '10000000-0000-4000-8000-000000000007'$q$) in ('0', 'denied'),
  'notifications: B kan inte uppdatera A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.storify_entries where id = '10000000-0000-4000-8000-000000000008'$q$), '0',
  'storify_entries: B läser inte A');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$update public.storify_entries set content = 'B' where id = '10000000-0000-4000-8000-000000000008'$q$) in ('0', 'denied'),
  'storify_entries: B kan inte uppdatera A');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.user_sms_preferences where user_id = '00000000-0000-4000-8000-00000000000a'$q$), '0',
  'user_sms_preferences: B läser inte A:s telefonnummer');
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.user_sms_preferences$q$) in ('0', 'denied'),
  'user_sms_preferences: anon får 0 rader');

-- ── Server-only-tabeller ─────────────────────────────────────────────────
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$select count(*) from public.user_ai_consents$q$) in ('0', 'denied'),
  'user_ai_consents: klienten läser inte ens egna samtycken direkt (server-only)');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$insert into public.user_ai_consents (user_id, scope, status, policy_version) values ('00000000-0000-4000-8000-00000000000a', 'diary_ai_reflection', 'granted', 'v1')$q$) = 'denied',
  'user_ai_consents: klienten kan inte bevilja samtycke själv');
select is(pg_temp.try('anon', null,
  $q$select count(*) from public.product_funnel_events$q$), 'denied',
  'product_funnel_events: anon nekas');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$select count(*) from public.product_funnel_events$q$), 'denied',
  'product_funnel_events: authenticated nekas läsning');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$insert into public.product_funnel_events (event_name, user_ref) values ('first_entry_saved', 'x')$q$), 'denied',
  'product_funnel_events: klienten kan inte skriva egna events');
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.guest_messages$q$) in ('0', 'denied'),
  'guest_messages: anon läser inga gästmeddelanden direkt');
select ok(pg_temp.try('anon', null,
  $q$insert into public.guest_conversations (guest_id, category) values ('g', 'G')$q$) = 'denied',
  'guest_conversations: anon kan inte skriva direkt (bara servern)');

-- ── Analytics (fynd: tidigare läs- och skrivbar för alla) ────────────────
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.analytics_events$q$) in ('0', 'denied'),
  'analytics_events: anon kan inte läsa events (user_id/session_id)');
select is(pg_temp.try('anon', null,
  $q$select count(*) from public.analytics_events$q$), 'denied',
  'analytics_events: anon saknar SELECT-behörighet helt');
select is(pg_temp.try('anon', null,
  $q$insert into public.analytics_events (landing_page_id, event_type) values (gen_random_uuid(), 'view')$q$), 'denied',
  'analytics_events: anon kan inte skriva events direkt');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.analytics_events$q$), 'denied',
  'analytics_events: inloggad klient saknar SELECT-behörighet');

-- ── Profiler (fynd: tidigare läsbara för anon) ───────────────────────────
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$select count(*) from public.profiles where id = '00000000-0000-4000-8000-00000000000a'$q$), '1',
  'profiles: A läser eget visningsnamn (layouten behöver det)');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.profiles where id = '00000000-0000-4000-8000-00000000000a'$q$), '0',
  'profiles: B läser inte A:s visningsnamn');
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.profiles$q$) in ('0', 'denied'),
  'profiles: anon kan inte lista användare');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$update public.profiles set display_name = 'B' where id = '00000000-0000-4000-8000-00000000000a'$q$) in ('0', 'denied'),
  'profiles: B kan inte ändra A:s profil');
select is((select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000a'), 'A namn',
  'profiles: A:s visningsnamn är oförändrat');

-- ── Gemenskapen (fynd: user_id för anonymt visade inlägg var läsbart) ────
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000a',
  $q$select count(*) from public.community_posts where id = '10000000-0000-4000-8000-000000000009'$q$), '1',
  'community_posts: A läser eget delat inlägg (export/unshare behöver det)');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.community_posts where user_id = '00000000-0000-4000-8000-00000000000a'$q$), '0',
  'community_posts: B kan inte koppla A:s user_id till ett anonymt inlägg');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.community_comments where user_id = '00000000-0000-4000-8000-00000000000a'$q$), '0',
  'community_comments: B kan inte koppla A:s user_id till en kommentar');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$update public.community_posts set content = 'B' where id = '10000000-0000-4000-8000-000000000009'$q$) in ('0', 'denied'),
  'community_posts: B kan inte ändra A:s inlägg');
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$insert into public.community_posts (user_id, diary_entry_id, content) values ('00000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000001', 'B')$q$), 'denied',
  'community_posts: B kan inte skapa inlägg med user_id=A');
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.community_posts$q$) in ('0', 'denied'),
  'community_posts: anon får 0 rader');
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.community_comments$q$) in ('0', 'denied'),
  'community_comments: anon får 0 rader');
select is((select content from public.community_posts where id = '10000000-0000-4000-8000-000000000009'), 'A delat',
  'community_posts: A:s inlägg är oförändrat');

-- ── Tidigare forum ───────────────────────────────────────────────────────
-- UPDATE-policyn har WITH CHECK (true). Att skriva över user_id stoppas ändå
-- av SELECT-policyn på den nya raden; det verifieras här. Att ägaren kan ändra
-- is_hidden/is_pinned och fortfarande skapa trådar är rapporterat som P2.
select is(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$select count(*) from public.forum_threads where id = '10000000-0000-4000-8000-000000000011'$q$), '1',
  'forum_threads: B läser egen tråd (dataexporten behöver det)');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b',
  $q$update public.forum_threads set user_id = '00000000-0000-4000-8000-00000000000a' where id = '10000000-0000-4000-8000-000000000011'$q$) in ('0', 'denied'),
  'forum_threads: B kan inte skriva över user_id till A');
select is((select user_id::text from public.forum_threads where id = '10000000-0000-4000-8000-000000000011'), '00000000-0000-4000-8000-00000000000b',
  'forum_threads: ägarskapet är oförändrat');
select ok(pg_temp.try('anon', null,
  $q$select count(*) from public.forum_threads$q$) in ('0', 'denied'),
  'forum_threads: anon får 0 rader');

-- ── Övriga användarägda tabeller: anon får inget ─────────────────────────
select ok(pg_temp.try('anon', null, $q$select count(*) from public.chat_history$q$) in ('0', 'denied'), 'chat_history: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.conversations$q$) in ('0', 'denied'), 'conversations: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.user_memories$q$) in ('0', 'denied'), 'user_memories: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.notifications$q$) in ('0', 'denied'), 'notifications: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.storify_entries$q$) in ('0', 'denied'), 'storify_entries: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.companion_daily_answers$q$) in ('0', 'denied'), 'companion_daily_answers: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.daily_questions$q$) in ('0', 'denied'), 'daily_questions: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.weekly_reflections$q$) in ('0', 'denied'), 'weekly_reflections: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.feedback_submissions$q$) in ('0', 'denied'), 'feedback_submissions: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.daily_movement$q$) in ('0', 'denied'), 'daily_movement: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.user_ai_consents$q$) in ('0', 'denied'), 'user_ai_consents: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.journal_entries$q$) in ('0', 'denied'), 'journal_entries: anon får 0 rader');
select ok(pg_temp.try('anon', null, $q$select count(*) from public.radar_config$q$) in ('0', 'denied'), 'radar_config: anon läser inte cron-hemligheten');
select ok(pg_temp.try('authenticated', '00000000-0000-4000-8000-00000000000b', $q$select count(*) from public.radar_config$q$) in ('0', 'denied'), 'radar_config: inloggad icke-admin läser inte cron-hemligheten');

select * from finish();
rollback;
