create table if not exists public.anonymous_stories (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 50 and 2000),
  age_range text check (age_range in ('under_18', '18_25', '26_35', '36_50', '51_plus') or age_range is null),
  gender text check (gender in ('kvinna', 'man', 'ickebinar', 'vill_ej_ange') or gender is null),
  emotion_emoji text check (char_length(emotion_emoji) <= 8),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ai_flag_reason text,
  created_at timestamptz default now(),
  approved_at timestamptz,
  ip_hash text
);

create index if not exists idx_stories_status_created on public.anonymous_stories(status, created_at desc);

alter table public.anonymous_stories enable row level security;

-- Publik läsning endast av godkända
drop policy if exists "Public can read approved stories" on public.anonymous_stories;
create policy "Public can read approved stories"
  on public.anonymous_stories
  for select
  to anon, authenticated
  using (status = 'approved');

-- Endast service role kan skriva. Inga insert/update/delete policies för anon/authenticated.
revoke all on table public.anonymous_stories from anon, authenticated;
grant select on table public.anonymous_stories to anon, authenticated;
grant all on table public.anonymous_stories to service_role;
