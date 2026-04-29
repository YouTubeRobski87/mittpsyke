import { error, redirect } from '@sveltejs/kit';
import { getGuideBySlugs, getPillarBySlug } from '$lib/seo-kit/content';
import { getToolBySlug } from '$lib/data/seo-architecture';

const guideRedirects: Record<string, string> = {
	'depression/varfor-orkar-jag-ingenting': '/guider/stress/varfor-orkar-jag-ingenting',
	'overtankande/nar-hjarnan-inte-stannar': '/guider/overtankande/varfor-hjarnan-fastnar-i-loopar'
};

export function load({ params }) {
	const redirectTarget = guideRedirects[`${params.pillar}/${params.guide}`];
	if (redirectTarget) {
		throw redirect(301, redirectTarget);
	}

	const pillar = getPillarBySlug(params.pillar);

	if (!pillar) {
		throw error(404, 'Pillar hittades inte');
	}

	const guide = getGuideBySlugs(params.pillar, params.guide);

	if (!guide) {
		throw error(404, 'Guide hittades inte');
	}

	const nextTool = guide.nextStepTool ? getToolBySlug(guide.nextStepTool) : null;

	return { pillar, guide, nextTool };
}
