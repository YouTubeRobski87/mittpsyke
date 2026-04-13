create extension if not exists pgcrypto;

create table if not exists public.feedback_submissions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid null references auth.users (id) on delete set null,
	experience text not null check (experience in ('Väldigt bra', 'Bra', 'Okej', 'Inte så bra')),
	what_worked text null,
	unclear text null,
	missing text null,
	use_again text not null check (use_again in ('Ja', 'Kanske', 'Nej')),
	other text null,
	created_at timestamptz not null default now()
);

create index if not exists feedback_submissions_created_at_idx
	on public.feedback_submissions (created_at desc);

create index if not exists feedback_submissions_user_id_created_at_idx
	on public.feedback_submissions (user_id, created_at desc);

alter table public.feedback_submissions enable row level security;
