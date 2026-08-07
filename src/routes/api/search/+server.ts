import { json } from '@sveltejs/kit';
import { collectSearchContent } from '$lib/server/search-index';
import { normalizeForSearch, rankResults, type RankedResult } from '$lib/server/search-ranking';
import { TtlCache } from '$lib/server/search-cache';
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

// Rankade resultat cachas per normaliserad fråga. Rankningen är billig, men
// collectSearchContent() bygger om hela listan vid varje anrop.
const resultCache = new TtlCache<RankedResult[]>(10 * 60 * 1000, 500);

// Endpointen är öppen. Den kostar inte längre något per fråga, men gränsen
// ligger kvar som ett enkelt skydd mot att någon hamrar på den.
const SEARCH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const SEARCH_RATE_LIMIT_MAX_REQUESTS = 60;
const searchRateLimiter = new RateLimiter(SEARCH_RATE_LIMIT_WINDOW_MS, SEARCH_RATE_LIMIT_MAX_REQUESTS);

const SEARCH_CACHE_CONTROL = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	const rawQuery = url.searchParams.get('q') ?? '';
	const query = normalizeForSearch(rawQuery);

	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const pageSize = Math.min(
		MAX_PAGE_SIZE,
		Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
	);

	// Tom fråga returnerar tomt, aldrig hela indexet.
	if (!query) {
		return json({ results: [], page, pageSize, total: 0, mode: 'empty' });
	}

	let cached = resultCache.get(query);
	let mode: 'keyword' | 'cached' = 'cached';

	if (!cached) {
		if (searchRateLimiter.consume(`ip:${getClientAddress()}`)) {
			return json(
				{ error: 'För många sökningar just nu. Vänta en liten stund och försök igen.' },
				{ status: 429, headers: { 'cache-control': 'no-store' } }
			);
		}

		cached = rankResults(query, collectSearchContent());
		mode = 'keyword';
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
