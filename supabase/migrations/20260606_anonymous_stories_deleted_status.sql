alter table public.anonymous_stories
  drop constraint if exists anonymous_stories_status_check;

alter table public.anonymous_stories
  add constraint anonymous_stories_status_check
  check (status in ('pending', 'approved', 'rejected', 'deleted'));
