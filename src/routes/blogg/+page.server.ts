import { redirect } from '@sveltejs/kit';
import {
	fetchSoroArticles,
	normalizeSoroArticleSlug
} from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

const ARTICLES_PER_PAGE = 10;
const FALLBACK_ARTICLES = [
	{
		id: 'fallback-ai-hjalper-dig-bearbeta-kanslor',
		title: 'AI hjälper dig bearbeta känslor',
		slug: 'ai-hjalper-dig-bearbeta-kanslor',
		excerpt: 'Om hur AI-stöd kan hjälpa dig sätta ord på det som känns svårt i lugn takt.',
		date: '29 mars 2026',
		isoDate: '2026-03-29',
		imageUrl: null
	},
	{
		id: 'fallback-kbt-dagbok-vs-fri-journalforing',
		title: 'KBT-dagbok eller fri journalföring?',
		slug: 'kbt-dagbok-vs-fri-journalforing',
		excerpt: 'Skillnaden mellan strukturerade tankestöd och friare skrivande när du vill förstå dig själv bättre.',
		date: '29 mars 2026',
		isoDate: '2026-03-29',
		imageUrl: null
	},
	{
		id: 'fallback-vad-ar-journalterapi',
		title: 'Vad är journalterapi?',
		slug: 'vad-ar-journalterapi',
		excerpt: 'En enkel introduktion till hur skrivande kan bli ett stöd för reflektion och återhämtning.',
		date: '29 mars 2026',
		isoDate: '2026-03-29',
		imageUrl: null
	}
];

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

	const { articles: fetchedArticles, loadError } = await fetchSoroArticles(fetch);
	const articles = fetchedArticles.length ? fetchedArticles : FALLBACK_ARTICLES;

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
