import { redirect } from '@sveltejs/kit';
import { normalizeSoroArticleSlug, fetchSoroArticles } from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
const ARTICLES_PER_PAGE = 12;

function parsePage(value: string | null) {
	if (!value) return 1;
	const page = Number(value);
	if (!Number.isInteger(page) || page < 1) return null;
	return page;
}

function buildPagePath(url: URL, page: number) {
	const params = new URLSearchParams(url.searchParams);
	params.delete('post');
	if (page <= 1) {
		params.delete('page');
	} else {
		params.set('page', String(page));
	}

	const query = params.toString();
	return `${url.pathname}${query ? `?${query}` : ''}`;
}

function buildPageItems(url: URL, currentPage: number, totalPages: number) {
	const visiblePages = new Set<number>();
	visiblePages.add(1);
	visiblePages.add(totalPages);

	for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
		if (page >= 1 && page <= totalPages) visiblePages.add(page);
	}

	if (currentPage <= 3) {
		for (let page = 1; page <= Math.min(4, totalPages); page += 1) {
			visiblePages.add(page);
		}
	}

	if (currentPage >= totalPages - 2) {
		for (let page = Math.max(1, totalPages - 3); page <= totalPages; page += 1) {
			visiblePages.add(page);
		}
	}

	const pages = [...visiblePages].sort((a, b) => a - b);
	const items: Array<
		| { type: 'page'; page: number; href: string; isCurrent: boolean }
		| { type: 'ellipsis'; key: string }
	> = [];

	pages.forEach((page, index) => {
		const previousPage = pages[index - 1];
		if (previousPage && page - previousPage > 1) {
			items.push({ type: 'ellipsis', key: `ellipsis-${previousPage}-${page}` });
		}
		items.push({
			type: 'page',
			page,
			href: buildPagePath(url, page),
			isCurrent: page === currentPage
		});
	});

	return items;
}

export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
	// Bevarar den gamla ?post=-länken: redirecta direkt till /blogg/[slug] istället.
	const legacyPost = url.searchParams.get('post');
	if (legacyPost) {
		const slug = normalizeSoroArticleSlug(legacyPost);
		if (slug) {
			throw redirect(308, `/blogg/${encodeURIComponent(slug)}`);
		}
		throw redirect(308, '/blogg');
	}

	const requestedPage = parsePage(url.searchParams.get('page'));
	if (requestedPage === null) {
		throw redirect(302, buildPagePath(url, 1));
	}

	const { articles, loadError } = await fetchSoroArticles(fetch);
	const totalArticles = articles.length;
	const totalPages = Math.max(1, Math.ceil(totalArticles / ARTICLES_PER_PAGE));
	const currentPage = Math.min(requestedPage, totalPages);

	if (requestedPage !== currentPage || (requestedPage === 1 && url.searchParams.has('page'))) {
		throw redirect(302, buildPagePath(url, currentPage));
	}

	const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
	const paginatedArticles = articles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

	if (!loadError) {
		setHeaders({ 'cache-control': CACHE_CONTROL });
	}

	return {
		title: 'Artiklar',
		description:
			'Artiklar om dagboksskrivande, mental hälsa och självreflektion. Lär dig mer om hur skrivande kan förbättra ditt mående.',
		articles: paginatedArticles,
		pagination: {
			currentPage,
			totalPages,
			totalArticles,
			hasPreviousPage: currentPage > 1,
			hasNextPage: currentPage < totalPages,
			previousPageHref: currentPage > 1 ? buildPagePath(url, currentPage - 1) : null,
			nextPageHref: currentPage < totalPages ? buildPagePath(url, currentPage + 1) : null,
			pageItems: buildPageItems(url, currentPage, totalPages)
		},
		loadError
	};
};
