import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const SORO_TOKEN = '7741c36b-abe9-4f95-8557-3430345576e4';
const SORO_EMBED_SRC = `https://app.trysoro.com/api/embed/${SORO_TOKEN}?theme=dark`;

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

type SoroArticleListItem = {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	date: string;
	isoDate: string;
	imageUrl: string | null;
};

type SoroRawArticle = Record<string, unknown>;

// Normaliserar en slug-sträng oavsett om det är full URL, query-värde eller ren slug.
function normalizeSlug(value: string) {
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
function extractArticles(embedScript: string): SoroArticleListItem[] {
	const match = embedScript.match(/var SORO_ARTICLES = (\[[\s\S]*?\]);/);
	if (!match) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(match[1]);
	} catch {
		return [];
	}
	if (!Array.isArray(parsed)) return [];

	return parsed
		.filter((item): item is SoroRawArticle => typeof item === 'object' && item !== null)
		.map((article) => ({
			id: asString(article.id),
			title: asString(article.title),
			slug: normalizeSlug(asString(article.slug)),
			excerpt: asString(article.excerpt),
			date: asString(article.date),
			isoDate: asString(article.isoDate),
			imageUrl: extractImageUrl(article)
		}));
}

export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
	// Bevarar den gamla ?post=-länken: redirecta direkt till /blogg/[slug] istället.
	const legacyPost = url.searchParams.get('post');
	if (legacyPost) {
		const slug = normalizeSlug(legacyPost);
		if (slug) {
			throw redirect(308, `/blogg/${encodeURIComponent(slug)}`);
		}
		throw redirect(308, '/blogg');
	}

	let articles: SoroArticleListItem[] = [];
	let loadError = false;

	try {
		const embedResponse = await fetch(`${SORO_EMBED_SRC}&cb=${Date.now()}`, {
			headers: {
				accept: 'application/javascript,*/*',
				'user-agent': 'Mozilla/5.0'
			}
		});

		if (embedResponse.ok) {
			const embedScript = await embedResponse.text();
			articles = extractArticles(embedScript);
		} else {
			loadError = true;
		}
	} catch {
		loadError = true;
	}

	// Cacha listan en kort stund så vi inte hamrar Soro vid varje request.
	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	return {
		title: 'Blogg',
		description:
			'Artiklar om journalföring, mental hälsa och självreflektion. Lär dig mer om hur skrivande kan förbättra ditt mående.',
		articles,
		loadError
	};
};
