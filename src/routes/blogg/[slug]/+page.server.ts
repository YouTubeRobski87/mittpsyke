import { error } from '@sveltejs/kit';
import { SORO_EMBED_SRC, SORO_TOKEN } from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
const LOCAL_FEATURED_IMAGE_BY_SLUG = new Map([['ai-dagbok', '/storify-og-image.png']]);
const LOCAL_TITLE_BY_SLUG = new Map([['chatta-anonymt-utan-konto', 'Chatta anonymt utan konto – börja direkt']]);

type SoroArticleListItem = {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	date: string;
	isoDate: string;
	image: string | null;
};

type SoroArticleContentResponse = {
	content?: string;
};

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

function extractArticles(embedScript: string) {
	const match = embedScript.match(/var SORO_ARTICLES = (\[[\s\S]*?\]);/);
	if (!match) return [];
	return JSON.parse(match[1]) as SoroArticleListItem[];
}

async function fetchArticleList(fetcher: typeof fetch, fresh = false) {
	const embedResponse = await fetcher(fresh ? `${SORO_EMBED_SRC}&cb=${Date.now()}` : SORO_EMBED_SRC, {
		headers: {
			accept: 'application/javascript,*/*',
			'user-agent': 'Mozilla/5.0'
		}
	});

	if (!embedResponse.ok) {
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}

	return extractArticles(await embedResponse.text());
}

export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	const requestedSlug = normalizeSlug(params.slug).toLowerCase();
	let articles = await fetchArticleList(fetch);
	let article = articles.find((item) => normalizeSlug(item.slug).toLowerCase() === requestedSlug);

	if (!article) {
		articles = await fetchArticleList(fetch, true);
		article = articles.find((item) => normalizeSlug(item.slug).toLowerCase() === requestedSlug);
	}

	if (!article) {
		throw error(404, 'Artikeln kunde inte hittas.');
	}

	const contentResponse = await fetch(
		`https://app.trysoro.com/api/embed/${SORO_TOKEN}/article/${article.id}`,
		{
			headers: {
				accept: 'application/json,*/*',
				'user-agent': 'Mozilla/5.0'
			}
		}
	);

	if (!contentResponse.ok) {
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}

	const contentPayload = (await contentResponse.json()) as SoroArticleContentResponse;

	if (!contentPayload.content) {
		throw error(404, 'Artikeln saknar innehåll.');
	}

	setHeaders({
		'cache-control': CACHE_CONTROL
	});

	const normalizedSlug = normalizeSlug(article.slug);
	const title = LOCAL_TITLE_BY_SLUG.get(normalizedSlug) ?? article.title;

	return {
		title,
		description: article.excerpt,
		article: {
			...article,
			slug: normalizedSlug,
			title,
			image: LOCAL_FEATURED_IMAGE_BY_SLUG.get(normalizedSlug) ?? article.image,
			content: contentPayload.content
		}
	};
};
