import { error } from '@sveltejs/kit';
import { getGuideBySlugs, getPillarBySlug } from '$lib/seo-kit/content';

export function load({ params }) {
	const pillar = getPillarBySlug(params.pillar);

	if (!pillar) {
		throw error(404, 'Pillar hittades inte');
	}

	const guide = getGuideBySlugs(params.pillar, params.guide);

	if (!guide) {
		throw error(404, 'Guide hittades inte');
	}

	return { pillar, guide };
}
