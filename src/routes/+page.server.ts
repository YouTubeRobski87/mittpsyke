import { redirect } from '@sveltejs/kit';
import { guides } from '$lib/seo-kit/content';
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
		title: 'Skriv anonymt i din takt – samtalsstöd och reflektion | MittPsyke',
		description:
			'En lugn start när du vill skriva av dig, sortera tankar eller förstå vilket stöd du behöver. MittPsyke är samtalsstöd och reflektion, inte vård eller akuthjälp.',
		contentStats: {
			guideCount: guides.length
		}
	};
};
