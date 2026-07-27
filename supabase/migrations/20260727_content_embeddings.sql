-- Grund för semantisk/hybrid sökning (embeddings). Innehållet är statiskt
-- webbplatsinnehåll (artiklar, guider, FAQ, stödlinjer) - ingen användardata.
-- Tabellen fylls och läses uteslutande server-side med service role, se
-- src/lib/server/search-index.ts, src/routes/api/cron/reindex-search och
-- src/routes/api/search. Klienten pratar aldrig direkt med den här tabellen.

create extension if not exists vector;

create table if not exists public.content_embeddings (
	id uuid primary key default gen_random_uuid(),
	content_type text not null,
	ref_id text not null,
	title text not null,
	url text not null,
	chunk_text text not null,
	content_hash text not null,
	-- 1536 dimensioner matchar text-embedding-3-small (se EMBEDDING_DIMENSIONS
	-- i search-index.ts). Byte av modell med annan dimension kräver en ny
	-- migration som ändrar den här kolumnen.
	embedding vector(1536) not null,
	model text not null default 'text-embedding-3-small',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (content_type, ref_id)
);

create index if not exists content_embeddings_embedding_idx
	on public.content_embeddings
	using hnsw (embedding vector_cosine_ops);

create index if not exists content_embeddings_content_type_idx
	on public.content_embeddings (content_type);

alter table public.content_embeddings enable row level security;
-- Medvetet inga policies: varken anon eller authenticated ska kunna läsa
-- eller skriva rakt mot tabellen. All åtkomst sker via service role
-- server-side, som kringgår RLS.

create or replace function public.match_content_embeddings(
	query_embedding vector(1536),
	match_count int default 20,
	filter_content_types text[] default null
)
returns table (
	id uuid,
	content_type text,
	ref_id text,
	title text,
	url text,
	chunk_text text,
	similarity float
)
language sql
stable
as $$
	select
		id,
		content_type,
		ref_id,
		title,
		url,
		chunk_text,
		1 - (embedding <=> query_embedding) as similarity
	from public.content_embeddings
	where filter_content_types is null or content_type = any(filter_content_types)
	order by embedding <=> query_embedding
	limit match_count;
$$;
