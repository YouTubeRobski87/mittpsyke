import { fetchSoroArticles } from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const { articles, loadError } = await fetchSoroArticles(fetch);

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	return { articles, loadError };
};
