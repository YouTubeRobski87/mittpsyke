-- Allow users to edit their own entries (update generated_text)
create policy "Users can update own entries"
  on public.entries for update using (auth.uid() = user_id);

-- Track when an entry was last edited
alter table public.entries add column updated_at timestamptz;
