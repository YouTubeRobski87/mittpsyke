create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = timezone('utc', now());
	return new;
end;
$$;

create table if not exists public.daily_movement (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	entry_date date not null,
	step_count integer null check (step_count is null or step_count >= 0),
	cycled_today boolean not null default false,
	cycled_km numeric(6, 1) null check (cycled_km is null or cycled_km >= 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint daily_movement_user_date_unique unique (user_id, entry_date)
);

create index if not exists daily_movement_user_date_idx
	on public.daily_movement (user_id, entry_date desc);

drop trigger if exists daily_movement_set_updated_at on public.daily_movement;
create trigger daily_movement_set_updated_at
	before update on public.daily_movement
	for each row
	execute function public.update_updated_at_column();

alter table public.daily_movement enable row level security;

drop policy if exists "daily_movement_select_own" on public.daily_movement;
create policy "daily_movement_select_own"
	on public.daily_movement
	for select
	using (auth.uid() = user_id);

drop policy if exists "daily_movement_insert_own" on public.daily_movement;
create policy "daily_movement_insert_own"
	on public.daily_movement
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "daily_movement_update_own" on public.daily_movement;
create policy "daily_movement_update_own"
	on public.daily_movement
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

drop policy if exists "daily_movement_delete_own" on public.daily_movement;
create policy "daily_movement_delete_own"
	on public.daily_movement
	for delete
	using (auth.uid() = user_id);
