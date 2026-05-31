import { redirect } from '@sveltejs/kit';
import { normalizeSoroArticleSlug, fetchSoroArticles } from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

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

	const { articles, loadError } = await fetchSoroArticles(fetch);

	if (!loadError) {
		setHeaders({ 'cache-control': CACHE_CONTROL });
	}

	return {
		title: 'Artiklar',
		description:
			'Artiklar om dagboksskrivande, mental hälsa och självreflektion. Lär dig mer om hur skrivande kan förbättra ditt mående.',
		articles,
		loadError
	};
};
