import { error } from '@sveltejs/kit';
import { getPillarBySlug, getToolBySlug } from '$lib/data/seo-architecture';

export function load({ params }) {
	const tool = getToolBySlug(params.tool);

	if (!tool) {
		throw error(404, 'Ovningen hittades inte');
	}

	const pillar = getPillarBySlug(tool.pillarSlug);

	if (!pillar) {
		throw error(500, 'Kunde inte hitta tillhorande guide');
	}

	return {
		tool,
		pillar
	};
}
