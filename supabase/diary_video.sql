-- Lägg till videokolumn på dagbokstabellen
alter table public.diary add column if not exists video_path text;

-- Privat bucket för dagboksvideor
insert into storage.buckets (id, name, public)
values ('diary-videos', 'diary-videos', false)
on conflict (id) do nothing;

-- RLS: användare får bara ladda upp sina egna videor
create policy "Users upload own diary videos"
on storage.objects for insert
with check (
  bucket_id = 'diary-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: användare får bara läsa sina egna videor
create policy "Users read own diary videos"
on storage.objects for select
using (
  bucket_id = 'diary-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: användare får ta bort sina egna videor
create policy "Users delete own diary videos"
on storage.objects for delete
using (
  bucket_id = 'diary-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
