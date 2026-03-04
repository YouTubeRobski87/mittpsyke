import { error } from '@sveltejs/kit';
import { getGuidesForPillar, getPillarBySlug } from '$lib/seo-kit/content';

export function load({ params }) {
	const pillar = getPillarBySlug(params.pillar);

	if (!pillar) {
		throw error(404, 'Pillar hittades inte');
	}

	return {
		pillar,
		guides: getGuidesForPillar(pillar.slug)
	};
}
