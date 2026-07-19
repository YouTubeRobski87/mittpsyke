import { redirect } from '@sveltejs/kit';
import { guides } from '$lib/seo-kit/content';
import { getPublishedArticles } from '$lib/server/article-content';
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
		title: 'När tankarna snurrar – skriv av dig anonymt direkt',
		description:
			'Få hjälp att sortera, förstå och sätta ord på det som känns. MittPsyke är ett lugnt första steg i text – inte vård eller akuthjälp. Inget konto krävs för att börja.',
		contentStats: {
			guideCount: guides.length,
			articleCount: getPublishedArticles().length
		}
	};
};
