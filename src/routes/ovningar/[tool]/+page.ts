import { error } from '@sveltejs/kit';
import { getPillarBySlug, getToolBySlug, getToolsForPillar } from '$lib/data/seo-architecture';

export function load({ params }) {
	const tool = getToolBySlug(params.tool);

	if (!tool) {
		throw error(404, 'Övningen hittades inte');
	}

	const pillar = getPillarBySlug(tool.pillarSlug);

	if (!pillar) {
		throw error(500, 'Kunde inte hitta tillhörande guide');
	}

	const relatedTools = getToolsForPillar(tool.pillarSlug).filter(
		(candidate) => candidate.slug !== tool.slug
	);

	return {
		tool,
		pillar,
		relatedTools
	};
}
