create table if not exists public.framsteg_comprehension_responses (
	id uuid primary key default gen_random_uuid(),
	user_ref text not null check (user_ref ~ '^[0-9a-f]{64}$'),
	clarity_answer text not null check (clarity_answer in ('yes', 'partial', 'no')),
	world_change_answer text not null check (world_change_answer in ('yes', 'partial', 'no')),
	source text not null default 'framsteg_comprehension'
		check (source = 'framsteg_comprehension'),
	created_at timestamptz not null default now(),
	constraint framsteg_comprehension_one_response_per_user unique (user_ref, source)
);

create index if not exists framsteg_comprehension_created_at_idx
	on public.framsteg_comprehension_responses (created_at desc);

alter table public.framsteg_comprehension_responses enable row level security;

revoke all on table public.framsteg_comprehension_responses from public;
revoke all on table public.framsteg_comprehension_responses from anon;
revoke all on table public.framsteg_comprehension_responses from authenticated;
grant select, insert on table public.framsteg_comprehension_responses to service_role;
