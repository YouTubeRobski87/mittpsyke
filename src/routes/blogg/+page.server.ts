import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const SORO_TOKEN = '7741c36b-abe9-4f95-8557-3430345576e4';
const SORO_EMBED_SRC = `https://app.trysoro.com/api/embed/${SORO_TOKEN}?theme=dark`;

type SoroArticleListItem = {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	date: string;
	isoDate: string;
	image: string | null;
};

// Normaliserar en slug-sträng oavsett om det är full URL, query-värde eller ren slug.
function normalizeSlug(value: string) {
	try {
		const decoded = decodeURIComponent(value);
		const url = decoded.startsWith('http') ? new URL(decoded) : null;
		const path = (url?.pathname ?? decoded).replace(/^\/+|\/+$/g, '');
		return path.startsWith('blogg/') ? path.slice('blogg/'.length) : path;
	} catch {
		const path = value.replace(/^\/+|\/+$/g, '');
		return path.startsWith('blogg/') ? path.slice('blogg/'.length) : path;
	}
}

// Plockar ut artikellistan från Soro:s embed-script.
function extractArticles(embedScript: string): SoroArticleListItem[] {
	const match = embedScript.match(/var SORO_ARTICLES = (\[[\s\S]*?\]);/);
	if (!match) return [];
	try {
		return JSON.parse(match[1]) as SoroArticleListItem[];
	} catch {
		return [];
	}
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
			articles = extractArticles(embedScript).map((article) => ({
				...article,
				slug: normalizeSlug(article.slug)
			}));
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
