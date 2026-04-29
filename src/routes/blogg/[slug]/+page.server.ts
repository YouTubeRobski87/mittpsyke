import { error } from '@sveltejs/kit';
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

export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	const cacheBuster = Date.now();
	const requestedSlug = normalizeSlug(params.slug).toLowerCase();
	const embedResponse = await fetch(`${SORO_EMBED_SRC}&cb=${cacheBuster}`, {
		headers: {
			accept: 'application/javascript,*/*',
			'user-agent': 'Mozilla/5.0'
		}
	});

	if (!embedResponse.ok) {
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}

	const embedScript = await embedResponse.text();
	const articles = extractArticles(embedScript);
	const article = articles.find((item) => normalizeSlug(item.slug).toLowerCase() === requestedSlug);

	if (!article) {
		throw error(404, 'Artikeln kunde inte hittas.');
	}

	const contentResponse = await fetch(
		`https://app.trysoro.com/api/embed/${SORO_TOKEN}/article/${article.id}?cb=${cacheBuster}`,
		{
			cache: 'no-store',
			headers: {
				accept: 'application/json,*/*',
				'cache-control': 'no-cache',
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
		'cache-control': 'no-store'
	});

	return {
		description: article.excerpt,
		article: {
			...article,
			slug: normalizeSlug(article.slug),
			content: contentPayload.content
		}
	};
};
