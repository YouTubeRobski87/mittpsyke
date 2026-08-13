import { redirect } from '@sveltejs/kit';
import { normalizeSoroArticleSlug } from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const legacyPost = url.searchParams.get('post');
	if (legacyPost) {
		const slug = normalizeSoroArticleSlug(legacyPost);
		if (slug) {
			throw redirect(308, `/blogg/${encodeURIComponent(slug)}`);
		}
		throw redirect(308, '/blogg');
	}

	return {
		title: 'En lugn plats att återvända till',
		description:
			'MittPsyke är en personlig plats för självreflektion. Skriv, checka in och följ hur du har det över tid – i din takt, med eller utan konto. Inte vård, behandling eller akuthjälp.'
	};
};
