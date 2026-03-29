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

create table if not exists public.landing_pages (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	page_id text not null unique,
	name text not null,
	slug text not null unique,
	status text not null default 'draft' check (status in ('draft', 'published', 'planned')),
	conversions integer not null default 0,
	views integer not null default 0,
	description text
);

create table if not exists public.seo_prompts (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	landing_page_id uuid not null references public.landing_pages(id) on delete cascade,
	prompt_type text not null check (prompt_type in ('seo-title', 'seo-meta', 'heading', 'cta', 'keywords')),
	generated_content text not null,
	used boolean not null default false
);

create table if not exists public.ab_tests (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	ended_at timestamptz,
	landing_page_id uuid not null references public.landing_pages(id) on delete cascade,
	variant_a_name text,
	variant_b_name text,
	conversions_a integer not null default 0,
	conversions_b integer not null default 0,
	views_a integer not null default 0,
	views_b integer not null default 0,
	winner text check (winner is null or winner in ('A', 'B')),
	is_active boolean not null default true
);

create table if not exists public.landing_page_content (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	landing_page_id uuid not null unique references public.landing_pages(id) on delete cascade,
	html_content text,
	seo_title text,
	seo_meta text,
	h1_heading text,
	cta_text text,
	keywords text
);

create table if not exists public.analytics_events (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default timezone('utc', now()),
	landing_page_id uuid not null references public.landing_pages(id) on delete cascade,
	ab_test_id uuid references public.ab_tests(id) on delete set null,
	event_type text not null check (event_type in ('view', 'conversion', 'click')),
	variant text check (variant is null or variant in ('A', 'B')),
	user_id text,
	session_id text,
	metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_landing_pages_page_id on public.landing_pages(page_id);
create index if not exists idx_landing_pages_status on public.landing_pages(status);
create index if not exists idx_landing_pages_created_at on public.landing_pages(created_at);

create index if not exists idx_seo_prompts_landing_page_id on public.seo_prompts(landing_page_id);
create index if not exists idx_seo_prompts_prompt_type on public.seo_prompts(prompt_type);
create index if not exists idx_seo_prompts_created_at on public.seo_prompts(created_at);

create index if not exists idx_ab_tests_landing_page_id on public.ab_tests(landing_page_id);
create index if not exists idx_ab_tests_is_active on public.ab_tests(is_active);
create index if not exists idx_ab_tests_created_at on public.ab_tests(created_at);

create index if not exists idx_landing_page_content_landing_page_id on public.landing_page_content(landing_page_id);

create index if not exists idx_analytics_events_landing_page_id on public.analytics_events(landing_page_id);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at);
create index if not exists idx_analytics_events_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_events_session_id on public.analytics_events(session_id);

alter table public.landing_pages enable row level security;
alter table public.seo_prompts enable row level security;
alter table public.ab_tests enable row level security;
alter table public.landing_page_content enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "landing_pages_select_authenticated" on public.landing_pages;
create policy "landing_pages_select_authenticated"
on public.landing_pages
for select
using (auth.role() = 'authenticated');

drop policy if exists "landing_pages_manage_authenticated" on public.landing_pages;
create policy "landing_pages_manage_authenticated"
on public.landing_pages
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "seo_prompts_select_authenticated" on public.seo_prompts;
create policy "seo_prompts_select_authenticated"
on public.seo_prompts
for select
using (auth.role() = 'authenticated');

drop policy if exists "seo_prompts_manage_authenticated" on public.seo_prompts;
create policy "seo_prompts_manage_authenticated"
on public.seo_prompts
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "ab_tests_select_authenticated" on public.ab_tests;
create policy "ab_tests_select_authenticated"
on public.ab_tests
for select
using (auth.role() = 'authenticated');

drop policy if exists "ab_tests_manage_authenticated" on public.ab_tests;
create policy "ab_tests_manage_authenticated"
on public.ab_tests
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "landing_page_content_select_authenticated" on public.landing_page_content;
create policy "landing_page_content_select_authenticated"
on public.landing_page_content
for select
using (auth.role() = 'authenticated');

drop policy if exists "landing_page_content_manage_authenticated" on public.landing_page_content;
create policy "landing_page_content_manage_authenticated"
on public.landing_page_content
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "analytics_events_select_public" on public.analytics_events;
create policy "analytics_events_select_public"
on public.analytics_events
for select
using (true);

drop policy if exists "analytics_events_insert_public" on public.analytics_events;
create policy "analytics_events_insert_public"
on public.analytics_events
for insert
with check (true);

drop trigger if exists update_landing_pages_updated_at on public.landing_pages;
create trigger update_landing_pages_updated_at
before update on public.landing_pages
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_seo_prompts_updated_at on public.seo_prompts;
create trigger update_seo_prompts_updated_at
before update on public.seo_prompts
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_ab_tests_updated_at on public.ab_tests;
create trigger update_ab_tests_updated_at
before update on public.ab_tests
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_landing_page_content_updated_at on public.landing_page_content;
create trigger update_landing_page_content_updated_at
before update on public.landing_page_content
for each row
execute function public.update_updated_at_column();

create or replace function public.record_landing_page_event(
	p_landing_page_id uuid,
	p_event_type text,
	p_variant text default null,
	p_ab_test_id uuid default null,
	p_user_id text default null,
	p_session_id text default null,
	p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	new_event_id uuid;
begin
	if p_event_type not in ('view', 'conversion', 'click') then
		raise exception 'Unsupported event type: %', p_event_type;
	end if;

	insert into public.analytics_events (
		landing_page_id,
		ab_test_id,
		event_type,
		variant,
		user_id,
		session_id,
		metadata
	)
	values (
		p_landing_page_id,
		p_ab_test_id,
		p_event_type,
		p_variant,
		p_user_id,
		p_session_id,
		coalesce(p_metadata, '{}'::jsonb)
	)
	returning id into new_event_id;

	if p_event_type = 'view' then
		update public.landing_pages
		set views = views + 1
		where id = p_landing_page_id;

		if p_ab_test_id is not null and p_variant = 'A' then
			update public.ab_tests set views_a = views_a + 1 where id = p_ab_test_id;
		elsif p_ab_test_id is not null and p_variant = 'B' then
			update public.ab_tests set views_b = views_b + 1 where id = p_ab_test_id;
		end if;
	elsif p_event_type = 'conversion' then
		update public.landing_pages
		set conversions = conversions + 1
		where id = p_landing_page_id;

		if p_ab_test_id is not null and p_variant = 'A' then
			update public.ab_tests set conversions_a = conversions_a + 1 where id = p_ab_test_id;
		elsif p_ab_test_id is not null and p_variant = 'B' then
			update public.ab_tests set conversions_b = conversions_b + 1 where id = p_ab_test_id;
		end if;
	end if;

	return new_event_id;
end;
$$;

revoke all on function public.record_landing_page_event(uuid, text, text, uuid, text, text, jsonb) from public;
grant execute on function public.record_landing_page_event(uuid, text, text, uuid, text, text, jsonb) to anon;
grant execute on function public.record_landing_page_event(uuid, text, text, uuid, text, text, jsonb) to authenticated;

insert into public.landing_pages (page_id, name, slug, status, description)
values
	('angst', 'Ångest', '/angst', 'draft', 'Landningssida för ångest-relaterat innehåll.'),
	('social-angst', 'Social ångest', '/social-angst', 'planned', 'Landningssida för social ångest.'),
	('stress', 'Stress och utmattning', '/stress', 'planned', 'Landningssida för stress och utmattning.')
on conflict (page_id) do nothing;
