import { json } from '@sveltejs/kit';
import { collectSearchContent } from '$lib/server/search-index';
import { normalizeForSearch, rankResults, type RankedResult } from '$lib/server/search-ranking';
import { RateLimiter } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

// ---------------------------------------------------------------------------
// Gemensam innehållssökning över artiklar, guider, övningar, pelarsidor, FAQ
// och stödlinjer. Viktad keyword-rankning, se search-ranking.ts.
//
// Sökningen gör medvetet inga externa anrop: ingen OpenAI, ingen databas. Hela
// indexet byggs in-memory av collectSearchContent() och rankas lokalt, så en
// sökning kostar ingenting och kan inte gå sönder för att en extern tjänst är
// nere eller för att cron-reindexeringen inte hunnit köra efter en publicering.
//
// Embeddinginfrastrukturen (content_embeddings + /api/cron/reindex-search) är
// orörd och ligger kvar. Ska semantisk recall återinföras som förstärkning är
// det rankResults i search-ranking.ts som ska ta emot den, som en bonus ovanpå
// keyword-poängen - inte som en egen väg in i resultatlistan.
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 30;
const MAX_QUERY_LENGTH = 200;

// Endpointen är öppen. Den kostar inte längre något per fråga, men gränsen
// ligger kvar som ett enkelt skydd mot att någon hamrar på den.
const SEARCH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const SEARCH_RATE_LIMIT_MAX_REQUESTS = 60;
const searchRateLimiter = new RateLimiter(SEARCH_RATE_LIMIT_WINDOW_MS, SEARCH_RATE_LIMIT_MAX_REQUESTS);

type SearchInput = { q?: unknown; page?: unknown; pageSize?: unknown };

function positiveInteger(value: unknown, fallback: number) {
	return Math.max(1, Number.parseInt(String(value ?? fallback), 10) || fallback);
}

function runSearch(input: SearchInput, getClientAddress: () => string) {
	const rawQuery = typeof input.q === 'string' ? input.q.slice(0, MAX_QUERY_LENGTH) : '';
	const query = normalizeForSearch(rawQuery);
	const page = positiveInteger(input.page, 1);
	const pageSize = Math.min(MAX_PAGE_SIZE, positiveInteger(input.pageSize, DEFAULT_PAGE_SIZE));

	// Tom fråga returnerar tomt, aldrig hela indexet.
	if (!query) {
		return json({ results: [], page, pageSize, total: 0, mode: 'empty' });
	}

	if (searchRateLimiter.consume(`ip:${getClientAddress()}`)) {
		return json(
			{ error: 'För många sökningar just nu. Vänta en liten stund och försök igen.' },
			{ status: 429, headers: { 'cache-control': 'no-store' } }
		);
	}

	const ranked: RankedResult[] = rankResults(query, collectSearchContent());

	const start = (page - 1) * pageSize;
	const pageResults = ranked.slice(start, start + pageSize);

	return json(
		{
			results: pageResults,
			page,
			pageSize,
			total: ranked.length,
			mode: 'keyword'
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	let input: SearchInput;
	try {
		input = (await request.json()) as SearchInput;
	} catch {
		return json({ error: 'Ogiltig sökning.' }, { status: 400, headers: { 'cache-control': 'no-store' } });
	}
	return runSearch(input, getClientAddress);
};

// Legacy/bookmarked API URLs remain readable, but the active UI never places
// the search text in a URL.
export const GET: RequestHandler = async ({ url, getClientAddress }) =>
	runSearch(
		{ q: url.searchParams.get('q'), page: url.searchParams.get('page'), pageSize: url.searchParams.get('pageSize') },
		getClientAddress
	);
