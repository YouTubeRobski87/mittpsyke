-- Syntetiska testdata: en rad per exporterad tabell för varje testanvändare.
-- tag märker innehållet så att testet kan se vems rad som kom tillbaka.
select public._it_add_feedback_select_policy();

create or replace function public._it_seed_user(uid uuid, tag text) returns void language plpgsql as $$
declare
  diary_id uuid := gen_random_uuid();
  post_id uuid := gen_random_uuid();
  thread_id uuid := gen_random_uuid();
  conversation_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (uid, tag || '@example.test');
  insert into public.profiles (id, display_name) values (uid, tag);
  insert into public.journal_entries (user_id, content) values (uid, tag);
  insert into public.diary (id, user_id, text) values (diary_id, uid, tag);
  insert into public.evening_checkins (user_id, theme_id, parking_bucket, flow_version, thought)
    values (uid, 'tomorrow', 'tomorrow', 'evening-calm-v1', tag);
  insert into public.creative_moments (user_id, session_id, activity_type) values (uid, gen_random_uuid(), 'world_coloring');
  insert into public.companion_daily_answers (user_id, question_id, answer_id, answer_date) values (uid, tag, 'a1', current_date);
  insert into public.companion_presence_weeks (user_id, week_start) values (uid, date_trunc('week', current_date)::date);
  insert into public.daily_movement (user_id, entry_date, step_count) values (uid, current_date, 100);
  insert into public.weekly_reflections (user_id, week_start, open_question) values (uid, date_trunc('week', current_date)::date, tag);
  insert into public.daily_questions (user_id, date, question_text) values (uid, current_date, tag);
  insert into public.user_memories (user_id, content) values (uid, tag);
  insert into public.storify_entries (user_id, content) values (uid, tag);
  insert into public.chat_history (user_id, topic, messages) values (uid, 'angest', jsonb_build_array(jsonb_build_object('content', tag)));
  insert into public.community_posts (id, user_id, diary_entry_id, content) values (post_id, uid, diary_id, tag);
  insert into public.community_comments (user_id, post_id, body) values (uid, post_id, tag);
  insert into public.forum_categories (id, name, description) values ('cat-' || tag, tag, tag) on conflict do nothing;
  insert into public.forum_threads (id, user_id, category_id, title, body) values (thread_id, uid, 'cat-' || tag, tag || ' tråd', tag || ' brödtext här');
  insert into public.forum_replies (user_id, thread_id, body) values (uid, thread_id, tag);
  insert into public.user_category_follows (user_id, category_id) values (uid, 'cat-' || tag);
  insert into public.user_thread_follows (user_id, thread_id) values (uid, thread_id);
  insert into public.notifications (user_id, type, title) values (uid, 'forum_reply', tag);
  insert into public.feedback_submissions (user_id, experience, use_again, other) values (uid, 'Bra', 'Ja', tag);
  insert into public.user_ai_consents (user_id, scope, status, policy_version) values (uid, 'diary_ai_reflection', 'granted', tag);
  insert into public.forum_reports (reporter_id, thread_id, reason) values (uid, thread_id, tag);
  insert into public.user_sms_preferences (user_id) values (uid);
  insert into public.conversations (id, user_id, title) values (conversation_id, uid, tag);
  insert into public.messages (conversation_id, role, content) values (conversation_id, 'user', tag);
  insert into public.user_helpful_reminders (user_id, item_id, active, revision) values (uid, 'music', true, 1);
end $$;

select public._it_seed_user('11111111-1111-4111-8111-111111111111', 'ANVANDARE_A');
select public._it_seed_user('22222222-2222-4222-8222-222222222222', 'ANVANDARE_B');
