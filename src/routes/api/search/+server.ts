import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import { createServiceClient } from '$lib/server/supabase-admin';
import { collectSearchContent, EMBEDDING_MODEL, type SearchContentItem } from '$lib/server/search-index';
import { TtlCache } from '$lib/server/search-cache';
import { RateLimiter } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

// ---------------------------------------------------------------------------
// Hybrid sökning: semantisk (embeddings/pgvector) + keyword, kombinerade och
// rankade. Om embedding-anropet eller vektorsökningen misslyckas (t.ex. innan
// migrationen i supabase/migrations/20260727_content_embeddings.sql körts,
// eller om OpenAI är nere) faller den tillbaka till ren keyword-sökning så
// /sok aldrig går sönder.
//
// Grund för framtida RAG/AI-assistent - bygger ingen RAG-logik här, bara
// den sökbara indexen och rankningen den skulle behöva.
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 30;
const VECTOR_MATCH_COUNT = 50;
const SEMANTIC_WEIGHT = 0.65;
const KEYWORD_WEIGHT = 0.35;
// Embeddingen är redan i ett try/catch med fallback till keyword-sökning,
// men utan gräns kunde ett hängande anrop ändå hålla kvar hela requesten.
const SEARCH_EMBEDDING_TIMEOUT_MS = 8_000;

// Rankade resultat cachas per normaliserad fråga i 10 minuter - täcker
// upprepade/populära sökningar utan nya embedding-anrop.
const resultCache = new TtlCache<RankedResult[]>(10 * 60 * 1000, 500);

// Endpointen är öppen (ingen inloggning krävs) och varje ocachad, unik fråga
// kostar ett OpenAI-embedding-anrop - begränsa per IP så den inte kan
// användas för att generera obegränsat många embeddingar.
const SEARCH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const SEARCH_RATE_LIMIT_MAX_REQUESTS = 20;
const searchRateLimiter = new RateLimiter(SEARCH_RATE_LIMIT_WINDOW_MS, SEARCH_RATE_LIMIT_MAX_REQUESTS);

// Sökresultat är publikt, icke-personligt innehåll - korta cache-headers
// låter webbläsare/CDN återanvända identiska sökningar en liten stund,
// samma mönster som redan används för /sok.
const SEARCH_CACHE_CONTROL = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

type RankedResult = {
	contentType: SearchContentItem['contentType'];
	title: string;
	url: string;
	snippet: string;
	score: number;
};

function normalizeQuery(value: string): string {
	return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function keywordScore(query: string, item: SearchContentItem): number {
	const haystack = `${item.title} ${item.chunkText}`.toLowerCase();
	if (!query) return 0;

	const substringBonus = haystack.includes(query) ? 1 : 0;

	const queryWords = query.split(' ').filter((word) => word.length > 1);
	const matchedWords = queryWords.filter((word) => haystack.includes(word));
	const wordOverlap = queryWords.length > 0 ? matchedWords.length / queryWords.length : 0;

	return Math.min(1, 0.5 * substringBonus + 0.5 * wordOverlap);
}

function buildSnippet(item: SearchContentItem): string {
	return item.chunkText.length > 220 ? `${item.chunkText.slice(0, 220)}…` : item.chunkText;
}

async function rankResults(query: string): Promise<{ results: RankedResult[]; mode: 'hybrid' | 'keyword-fallback' }> {
	const content = collectSearchContent();
	const keywordScores = new Map(content.map((item) => [`${item.contentType}:${item.refId}`, keywordScore(query, item)]));

	const apiKey = env.OPENAI_API_KEY;
	const supabase = createServiceClient();

	let semanticScores: Map<string, number> | null = null;

	if (apiKey && supabase) {
		try {
			const openai = new OpenAI({ apiKey, timeout: SEARCH_EMBEDDING_TIMEOUT_MS });
			const embeddingResponse = await openai.embeddings.create({
				model: EMBEDDING_MODEL,
				input: query
			});
			const queryEmbedding = embeddingResponse.data[0]?.embedding;

			if (queryEmbedding) {
				const { data, error } = await supabase.rpc('match_content_embeddings', {
					query_embedding: queryEmbedding,
					match_count: VECTOR_MATCH_COUNT,
					filter_content_types: null
				});

				if (error) throw error;

				semanticScores = new Map(
					(data ?? []).map((row: { content_type: string; ref_id: string; similarity: number }) => [
						`${row.content_type}:${row.ref_id}`,
						Math.max(0, row.similarity)
					])
				);
			}
		} catch (err) {
			console.error('[search] semantisk sökning misslyckades, faller tillbaka till keyword', err);
			semanticScores = null;
		}
	}

	const mode: 'hybrid' | 'keyword-fallback' = semanticScores ? 'hybrid' : 'keyword-fallback';

	const ranked = content
		.map((item) => {
			const key = `${item.contentType}:${item.refId}`;
			const keyword = keywordScores.get(key) ?? 0;
			const semantic = semanticScores?.get(key) ?? 0;
			const score = mode === 'hybrid' ? SEMANTIC_WEIGHT * semantic + KEYWORD_WEIGHT * keyword : keyword;

			return {
				contentType: item.contentType,
				title: item.title,
				url: item.url,
				snippet: buildSnippet(item),
				score
			};
		})
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score);

	return { results: ranked, mode };
}

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	const rawQuery = url.searchParams.get('q') ?? '';
	const query = normalizeQuery(rawQuery);

	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const pageSize = Math.min(
		MAX_PAGE_SIZE,
		Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
	);

	if (!query) {
		return json({ results: [], page, pageSize, total: 0, mode: 'empty' });
	}

	let cached = resultCache.get(query);
	let mode: 'hybrid' | 'keyword-fallback' | 'cached' = 'cached';

	if (!cached) {
		// Rate-limita bara ocachade frågor - populära/upprepade sökningar
		// serveras redan gratis från resultCache ovan.
		if (searchRateLimiter.consume(`ip:${getClientAddress()}`)) {
			return json(
				{ error: 'För många sökningar just nu. Vänta en liten stund och försök igen.' },
				{ status: 429, headers: { 'cache-control': 'no-store' } }
			);
		}

		const ranked = await rankResults(query);
		cached = ranked.results;
		mode = ranked.mode;
		resultCache.set(query, cached);
	}

	const start = (page - 1) * pageSize;
	const pageResults = cached.slice(start, start + pageSize);

	return json(
		{
			results: pageResults,
			page,
			pageSize,
			total: cached.length,
			mode
		},
		{ headers: { 'cache-control': SEARCH_CACHE_CONTROL } }
	);
};
