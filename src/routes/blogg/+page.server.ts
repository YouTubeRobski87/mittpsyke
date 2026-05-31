import { redirect } from '@sveltejs/kit';
import { normalizeSoroArticleSlug } from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Bevarar den gamla ?post=-länken: redirecta direkt till /blogg/[slug] istället.
	const legacyPost = url.searchParams.get('post');
	if (legacyPost) {
		const slug = normalizeSoroArticleSlug(legacyPost);
		if (slug) {
			throw redirect(308, `/blogg/${encodeURIComponent(slug)}`);
		}
		throw redirect(308, '/blogg');
	}

	return {
		title: 'Artiklar',
		description:
			'Artiklar om dagboksskrivande, mental hälsa och självreflektion. Lär dig mer om hur skrivande kan förbättra ditt mående.'
	};
};
