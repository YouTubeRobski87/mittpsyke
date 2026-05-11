import { redirect } from '@sveltejs/kit';
import {
	fetchSoroArticles,
	normalizeSoroArticleSlug
} from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

const ARTICLES_PER_PAGE = 10;

function getRequestedPage(url: URL): number {
	const rawPage = url.searchParams.get('page');
	if (!rawPage) return 1;
	const page = Number(rawPage);
	return Number.isInteger(page) && page > 0 ? page : 1;
}

export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
	// Bevarar den gamla ?post=-länken: redirecta direkt till /blogg/[slug] istället.
	const legacyPost = url.searchParams.get('post');
	if (legacyPost) {
		const slug = normalizeSoroArticleSlug(legacyPost);
		if (slug) {
			throw redirect(308, `/blogg/${encodeURIComponent(slug)}`);
		}
		throw redirect(308, '/blogg');
	}

	const { articles, loadError } = await fetchSoroArticles(fetch);

	// Cacha listan en kort stund så vi inte hamrar Soro vid varje request.
	const totalArticles = articles.length;
	const totalPages = Math.max(1, Math.ceil(totalArticles / ARTICLES_PER_PAGE));
	const currentPage = Math.min(getRequestedPage(url), totalPages);
	const pageStart = (currentPage - 1) * ARTICLES_PER_PAGE;
	const paginatedArticles = articles.slice(pageStart, pageStart + ARTICLES_PER_PAGE);

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	return {
		title: 'Artiklar',
		description:
			'Artiklar om dagboksskrivande, mental hälsa och självreflektion. Lär dig mer om hur skrivande kan förbättra ditt mående.',
		articles: paginatedArticles,
		pagination: {
			currentPage,
			totalPages,
			totalArticles,
			hasPrevious: currentPage > 1,
			hasNext: currentPage < totalPages
		},
		loadError
	};
};
