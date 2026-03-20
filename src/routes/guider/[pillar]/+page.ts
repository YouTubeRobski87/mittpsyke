import { error } from '@sveltejs/kit';
import { getPillarBySlug, getToolsForPillar } from '$lib/data/seo-architecture';
import { guides as seoGuides } from '$lib/seo-kit/content';

export function load({ params }) {
	const pillar = getPillarBySlug(params.pillar);

	if (!pillar) {
		throw error(404, 'Guiden hittades inte');
	}

	const guideHrefByTitle = new Map(
		seoGuides.map((guide) => [guide.title, `/guider-seo/${guide.pillarSlug}/${guide.slug}`])
	);

	const clusterTopics = pillar.clusterTopics.map((topic) => ({
		label: topic,
		href: guideHrefByTitle.get(topic) ?? null
	}));

	return {
		pillar,
		tools: getToolsForPillar(pillar.slug),
		clusterTopics
	};
}
