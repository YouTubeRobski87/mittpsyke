-- Äldre tabeller som finns i den hostade databasen men saknar CREATE TABLE i
-- repot (se LEGACY_UNDECLARED_TABLES i scripts/check-schema.mjs). Kolumner
-- och SELECT-policyer motsvarar den hostade databasens metadata.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  content text,
  created_at timestamptz default now()
);
alter table public.journal_entries enable row level security;
drop policy if exists "select own journal entries" on public.journal_entries;
create policy "select own journal entries" on public.journal_entries for select
  using (auth.uid() = user_id);

-- Avvikelse mellan repot och den hostade databasen: där finns en SELECT-policy
-- för egna feedbacksvar som saknas i supabase/feedback_submissions.sql.
-- Läggs till här så att testet speglar den hostade databasen.
create or replace function public._it_add_feedback_select_policy() returns void language plpgsql as $$
begin
  if not exists (select 1 from pg_policies where tablename = 'feedback_submissions' and cmd = 'SELECT') then
    execute 'create policy feedback_submissions_select_own on public.feedback_submissions for select to authenticated using (user_id = auth.uid())';
  end if;
end $$;
