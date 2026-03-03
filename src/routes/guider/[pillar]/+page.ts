import { error } from '@sveltejs/kit';
import { getPillarBySlug, getToolsForPillar } from '$lib/data/seo-architecture';

export function load({ params }) {
	const pillar = getPillarBySlug(params.pillar);

	if (!pillar) {
		throw error(404, 'Guiden hittades inte');
	}

	return {
		pillar,
		tools: getToolsForPillar(pillar.slug)
	};
}
