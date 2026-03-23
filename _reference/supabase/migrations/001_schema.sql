-- ============================================
-- Phase 4: Database Schema for Storify
-- ============================================

-- 4.1 Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text default '',
  birthday date,
  pronouns text default '',
  hometown text default '',
  family text[] default '{}',
  pets text[] default '{}',
  occupation_type text default '',
  occupation_detail text[] default '{}',
  interests text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users can only read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4.2 Entries table
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),

  -- Generated content
  generated_text text not null,
  tone_id text not null,

  -- Wizard metadata (for rich previews in journal)
  entry_date date not null,
  weekday text,
  emojis text[] default '{}',
  mood_color text,
  energy_level integer,
  sleep_quality integer,
  mood_level integer
);

-- RLS: users can only access their own entries
alter table public.entries enable row level security;

create policy "Users can view own entries"
  on public.entries for select using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.entries for insert with check (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.entries for delete using (auth.uid() = user_id);
