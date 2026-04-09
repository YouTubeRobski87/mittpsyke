-- Lägg till bildkolumn i dagbokstabellen
alter table public.diary
  add column if not exists image_url text null;

-- Skapa Storage-bucket för dagboksbilder (public = sann för direkta bildlänkar)
insert into storage.buckets (id, name, public)
values ('diary-images', 'diary-images', true)
on conflict (id) do nothing;

-- RLS: användare får ladda upp till sin egen mapp ({user_id}/...)
drop policy if exists "diary_images_insert_own" on storage.objects;
create policy "diary_images_insert_own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'diary-images'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- RLS: offentlig läsning av bucket (krävs för att img src ska fungera)
drop policy if exists "diary_images_select_public" on storage.objects;
create policy "diary_images_select_public"
  on storage.objects
  for select
  using (bucket_id = 'diary-images');

-- RLS: användare får ta bort sina egna filer
drop policy if exists "diary_images_delete_own" on storage.objects;
create policy "diary_images_delete_own"
  on storage.objects
  for delete
  using (
    bucket_id = 'diary-images'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );
