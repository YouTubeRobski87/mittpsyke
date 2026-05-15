alter table public.diary
	add column if not exists prompt_question text null,
	add column if not exists daily_question_id uuid null references public.daily_questions (id) on delete set null;

create index if not exists diary_daily_question_id_idx
	on public.diary (daily_question_id)
	where daily_question_id is not null;
