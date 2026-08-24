import { SORO_EMBED_SRC } from '$lib/soro';
const LOCAL_FEATURED_IMAGE_BY_SLUG = new Map([['ai-dagbok', '/storify-og-image.png']]);

// Bildfält Soro använder/har använt för olika artiklar. Ordningen är prioritetsordning.
const IMAGE_FIELD_CANDIDATES = [
	'image',
	'imageUrl',
	'image_url',
	'featuredImage',
	'featured_image',
	'coverImage',
	'cover_image',
	'thumbnail',
	'thumbnailUrl',
	'thumbnail_url',
	'ogImage',
	'og_image',
	'media'
] as const;

export type SoroArticleListItem = {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	date: string;
	isoDate: string;
	imageUrl: string | null;
};

export const SORO_REQUEST_TIMEOUT_MS = 8_000;

export type SoroArticleLoadError =
	| 'timeout'
	| 'network'
	| 'upstream_5xx'
	| 'upstream_4xx'
	| 'invalid_payload'
	| 'empty_payload';

type SoroRequestFailure = Extract<SoroArticleLoadError, 'timeout' | 'network' | 'upstream_5xx' | 'upstream_4xx'>;

type SoroRequestResult =
	| { response: Response; failure?: never; status?: never }
	| { response?: never; failure: SoroRequestFailure; status?: number };

export type SoroArticleLoadResult =
	| { articles: SoroArticleListItem[]; loadError: false; errorReason?: never }
	| { articles: SoroArticleListItem[]; loadError: true; errorReason: SoroArticleLoadError };

type SoroRawArticle = Record<string, unknown>;

// Normaliserar en slug-sträng oavsett om det är full URL, query-värde eller ren slug.
export function normalizeSoroArticleSlug(value: unknown) {
	if (typeof value !== 'string') return '';
	try {
		const decoded = decodeURIComponent(value);
		const url = decoded.startsWith('http') ? new URL(decoded) : null;
		const path = (url?.pathname ?? decoded).replace(/^\/+|\/+$/g, '');
		return (path.startsWith('blogg/') ? path.slice('blogg/'.length) : path).toLowerCase();
	} catch {
		const path = value.replace(/^\/+|\/+$/g, '');
		return (path.startsWith('blogg/') ? path.slice('blogg/'.length) : path).toLowerCase();
	}
}

function asString(value: unknown): string {
	return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function isValidDate(value: string) {
	return Boolean(value.trim()) && !Number.isNaN(Date.parse(value));
}

function isPublishedArticle(article: SoroRawArticle) {
	if (article.draft === true || article.published === false || article.isPublished === false) return false;

	for (const field of ['publicationState', 'status']) {
		if (!(field in article)) continue;
		const state = asString(article[field]).trim().toLowerCase();
		if (!['published', 'public', 'live', 'active'].includes(state)) return false;
	}

	return true;
}

function validateArticle(article: SoroRawArticle): article is SoroRawArticle {
	const slug = normalizeSoroArticleSlug(asString(article.slug));
	const date = asString(article.isoDate || article.date);

	return Boolean(
		asString(article.id).trim() &&
		asString(article.title).trim() &&
		slug &&
		!slug.includes('/') &&
		isValidDate(date) &&
		isPublishedArticle(article)
	);
}

function isRetryableStatus(status: number) {
	return status >= 500 && status <= 599;
}

async function fetchWithTimeout(fetcher: typeof fetch, url: string, init: RequestInit): Promise<Response> {
	const controller = new AbortController();
	let timedOut = false;
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			timedOut = true;
			controller.abort();
			reject(new Error('Soro request timed out'));
		}, SORO_REQUEST_TIMEOUT_MS);
	});

	try {
		return await Promise.race([
			fetcher(url, { ...init, signal: controller.signal }),
			timeout
		]);
	} catch (error) {
		if (timedOut) throw Object.assign(new Error('Soro request timed out'), { code: 'timeout' });
		throw error;
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
}

export async function fetchSoroResponse(
	fetcher: typeof fetch,
	url: string,
	init: RequestInit
): Promise<SoroRequestResult> {
	let lastFailure: SoroRequestFailure = 'network';
	let lastStatus: number | undefined;

	for (let attempt = 0; attempt < 2; attempt += 1) {
		try {
			const response = await fetchWithTimeout(fetcher, url, init);
			if (response.ok) return { response };

			lastStatus = response.status;
			lastFailure = isRetryableStatus(response.status) ? 'upstream_5xx' : 'upstream_4xx';
			if (!isRetryableStatus(response.status) || attempt === 1) break;
			await response.body?.cancel();
		} catch (error) {
			lastFailure = error instanceof Error && 'code' in error && error.code === 'timeout' ? 'timeout' : 'network';
			if (attempt === 1) break;
		}
	}

	return { failure: lastFailure, ...(lastStatus ? { status: lastStatus } : {}) };
}

// Plockar ut första giltiga bild-URL från en artikelpost. Soro varierar fältnamn
// per artikel (vissa har "image", andra "featuredImage", "coverImage" osv) och
// kan dessutom slå in värdet som ett objekt med "url"/"src" eller en array.
function extractImageUrl(article: SoroRawArticle): string | null {
	for (const field of IMAGE_FIELD_CANDIDATES) {
		const raw = article[field];
		const url = coerceImageValue(raw);
		if (url) return url;
	}
	return null;
}

function getArticleImageUrl(article: SoroRawArticle): string | null {
	const slug = normalizeSoroArticleSlug(asString(article.slug));
	return LOCAL_FEATURED_IMAGE_BY_SLUG.get(slug) ?? extractImageUrl(article);
}

function coerceImageValue(value: unknown): string | null {
	if (!value) return null;
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed ? trimmed : null;
	}
	if (Array.isArray(value)) {
		for (const entry of value) {
			const url = coerceImageValue(entry);
			if (url) return url;
		}
		return null;
	}
	if (typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		for (const key of ['url', 'src', 'href', 'secure_url', 'large', 'medium', 'small', 'original']) {
			const url = coerceImageValue(obj[key]);
			if (url) return url;
		}
	}
	return null;
}

// Plockar ut artikellistan från Soro:s embed-script.
function extractArticles(embedScript: string): { articles: SoroArticleListItem[]; invalidCount: number } | null {
	const match = embedScript.match(/var SORO_ARTICLES = (\[[\s\S]*?\]);/);
	if (!match) return null;
	let parsed: unknown;
	try {
		parsed = JSON.parse(match[1]);
	} catch {
		return null;
	}
	if (!Array.isArray(parsed)) return null;

	const rawArticles = parsed.filter((item): item is SoroRawArticle => typeof item === 'object' && item !== null);
	const validArticles = rawArticles
		.filter(validateArticle)
		.map((article) => ({
			id: asString(article.id),
			title: asString(article.title),
			slug: normalizeSoroArticleSlug(asString(article.slug)),
			excerpt: asString(article.excerpt),
			date: asString(article.date),
			isoDate: asString(article.isoDate),
			imageUrl: getArticleImageUrl(article)
		}));

	return { articles: validArticles, invalidCount: parsed.length - validArticles.length };
}

export async function fetchSoroArticles(fetcher: typeof fetch, fresh = false): Promise<SoroArticleLoadResult> {
	const cacheBuster = fresh ? `&cb=${Date.now()}` : '';
	const request = await fetchSoroResponse(fetcher, `${SORO_EMBED_SRC}${cacheBuster}`, {
		headers: {
			accept: 'application/javascript,*/*',
			'user-agent': 'Mozilla/5.0'
		}
	});

	if (!request.response) {
		return { articles: [], loadError: true, errorReason: request.failure };
	}

	let embedScript: string;
	try {
		embedScript = await request.response.text();
	} catch {
		return { articles: [], loadError: true, errorReason: 'network' };
	}

	const extracted = extractArticles(embedScript);
	if (!extracted) return { articles: [], loadError: true, errorReason: 'invalid_payload' };
	if (extracted.articles.length === 0) {
		return {
			articles: [],
			loadError: true,
			errorReason: extracted.invalidCount > 0 ? 'invalid_payload' : 'empty_payload'
		};
	}

	if (extracted.invalidCount > 0) {
		console.warn('[soro] Skipped invalid article records', { count: extracted.invalidCount });
	}

	return { articles: extracted.articles, loadError: false };
}
