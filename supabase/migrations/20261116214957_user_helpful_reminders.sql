begin;

create table if not exists public.user_helpful_reminders (
	user_id uuid not null references auth.users (id) on delete cascade,
	item_id text not null check (item_id in ('walk', 'family', 'music', 'rest', 'nature', 'create', 'talk')),
	active boolean not null,
	revision integer not null check (revision > 0),
	primary key (user_id, item_id)
);

alter table public.user_helpful_reminders enable row level security;
revoke all on public.user_helpful_reminders from public, anon, authenticated;
grant select, insert on public.user_helpful_reminders to authenticated;
grant update (active, revision) on public.user_helpful_reminders to authenticated;

drop policy if exists "user_helpful_reminders_select_own" on public.user_helpful_reminders;
create policy "user_helpful_reminders_select_own" on public.user_helpful_reminders
	for select to authenticated using (
		(select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false'
	);
drop policy if exists "user_helpful_reminders_insert_own" on public.user_helpful_reminders;
create policy "user_helpful_reminders_insert_own" on public.user_helpful_reminders
	for insert to authenticated with check (
		(select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false'
	);
drop policy if exists "user_helpful_reminders_update_own" on public.user_helpful_reminders;
create policy "user_helpful_reminders_update_own" on public.user_helpful_reminders
	for update to authenticated using (
		(select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false'
	) with check (
		(select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false'
	);

-- En tom retur betyder versionskonflikt. Raden ligger kvar vid borttagning
-- så att en fördröjd skrivning med en gammal revision inte kan återaktivera valet.
create or replace function public.set_helpful_reminder(p_item_id text, p_active boolean, p_revision integer)
returns table (item_id text, active boolean, revision integer)
language plpgsql
security invoker
set search_path = ''
as $$
begin
	if p_revision = 0 then
		return query
			insert into public.user_helpful_reminders as reminder (user_id, item_id, active, revision)
			values ((select auth.uid()), p_item_id, p_active, 1)
			on conflict on constraint user_helpful_reminders_pkey do nothing
			returning reminder.item_id, reminder.active, reminder.revision;
	else
		return query
			update public.user_helpful_reminders as reminder
			set active = p_active, revision = reminder.revision + 1
			where reminder.user_id = (select auth.uid())
				and reminder.item_id = p_item_id and reminder.revision = p_revision
			returning reminder.item_id, reminder.active, reminder.revision;
	end if;
end;
$$;

revoke all on function public.set_helpful_reminder(text, boolean, integer) from public, anon, authenticated;
grant execute on function public.set_helpful_reminder(text, boolean, integer) to authenticated;

-- Flytta bara giltiga val. Den gamla metadatanyckeln läses aldrig efter bytet.
insert into public.user_helpful_reminders (user_id, item_id, active, revision)
select distinct account.id, option.id, true, 1
from auth.users as account
cross join lateral jsonb_array_elements_text(
	case when jsonb_typeof(account.raw_user_meta_data -> 'progress_helpful_reminders') = 'array'
		then account.raw_user_meta_data -> 'progress_helpful_reminders' else '[]'::jsonb end
) as saved(label)
join (values ('walk', 'Promenader'), ('family', 'Tid med familjen'), ('music', 'Musik'),
	('rest', 'Vila'), ('nature', 'Tid i naturen'), ('create', 'Att skapa något'), ('talk', 'Att prata med någon')
) as option(id, label) on option.label = saved.label
where not coalesce(account.is_anonymous, false)
on conflict on constraint user_helpful_reminders_pkey do nothing;

-- Render läser markören före listen(). Den blir synlig först när hela
-- migrationen, inklusive överföringen av befintliga val, har slutförts.
create or replace function public.helpful_reminders_schema_version()
returns integer language sql stable security invoker set search_path = ''
as $$ select 1 $$;

revoke all on function public.helpful_reminders_schema_version() from public, anon, authenticated, service_role;
grant execute on function public.helpful_reminders_schema_version() to service_role;
notify pgrst, 'reload schema';

commit;