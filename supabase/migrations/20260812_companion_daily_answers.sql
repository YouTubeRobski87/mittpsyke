-- Ett svar per användare och kalenderdag på följeslagarens dagliga fråga.
--
-- Raden innehåller inga fritexter: bara vilken fråga som ställdes och vilket
-- fördefinierat alternativ användaren valde. answer_id null betyder att
-- användaren hoppade över - dagen är hanterad, men ger varken bond eller
-- tillväxt i trädgården.
--
-- Tabellen är avsiktligt append-only. Utan update- och delete-policy kan ett
-- svar varken skrivas om eller tas bort, vilket gör "aldrig minus" till en
-- garanti i databasen och inte bara en regel i applikationskoden.
create table if not exists public.companion_daily_answers (
	user_id uuid not null references auth.users (id) on delete cascade,
	answer_date date not null,
	question_id text not null check (char_length(question_id) between 1 and 64),
	answer_id text check (char_length(answer_id) between 1 and 64),
	created_at timestamptz not null default now(),
	primary key (user_id, answer_date)
);

alter table public.companion_daily_answers enable row level security;

revoke all on table public.companion_daily_answers from anon, authenticated;
grant select, insert on table public.companion_daily_answers to authenticated;

drop policy if exists "companion_daily_answers_select_own" on public.companion_daily_answers;
create policy "companion_daily_answers_select_own"
	on public.companion_daily_answers
	for select
	to authenticated
	using ((select auth.uid()) = user_id);

-- Bara innevarande Stockholm-dag får skrivas. Det hindrar att en klient
-- efterhandsfyller dagar för att driva upp sitt eget band.
drop policy if exists "companion_daily_answers_insert_today" on public.companion_daily_answers;
create policy "companion_daily_answers_insert_today"
	on public.companion_daily_answers
	for insert
	to authenticated
	with check (
		(select auth.uid()) = user_id
		and answer_date = (timezone('Europe/Stockholm', now()))::date
	);
