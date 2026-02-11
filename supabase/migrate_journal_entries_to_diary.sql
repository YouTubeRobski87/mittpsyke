-- One-time migration: copy legacy rows from public.journal_entries to public.diary.
-- Safe to re-run: existing rows are skipped.

do $$
declare
	inserted_count integer := 0;
begin
	if to_regclass('public.journal_entries') is null then
		raise notice 'Skipping migration: table public.journal_entries does not exist.';
		return;
	end if;

	if to_regclass('public.diary') is null then
		raise notice 'Skipping migration: table public.diary does not exist.';
		return;
	end if;

	-- Copy only valid, non-empty notes and avoid duplicates on re-run.
	insert into public.diary (user_id, text, mood, tags, created_at)
	select
		j.user_id,
		trim(j.content) as text,
		j.mood,
		j.tags,
		coalesce(j.created_at, now()) as created_at
	from public.journal_entries j
	where j.content is not null
		and char_length(trim(j.content)) > 0
		and not exists (
			select 1
			from public.diary d
			where d.user_id = j.user_id
				and d.text = trim(j.content)
				and d.created_at is not distinct from j.created_at
		);

	get diagnostics inserted_count = row_count;
	raise notice 'Migration complete. Inserted % row(s) into public.diary.', inserted_count;
end $$;
