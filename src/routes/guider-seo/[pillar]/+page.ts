import { error, redirect } from '@sveltejs/kit';
import { getGuidesForPillar, getPillarBySlug, getPillarLandingBySlug } from '$lib/seo-kit/content';

export function load({ params }) {
	const pillarSlug = params.pillar === 'stress-och-overbelastning' ? 'stress' : params.pillar;

	if (pillarSlug !== params.pillar) {
		throw redirect(308, `/guider-seo/${pillarSlug}`);
	}

	const pillar = getPillarBySlug(pillarSlug);

	if (!pillar) {
		throw error(404, 'Pillar hittades inte');
	}

	return {
		pillar,
		guides: getGuidesForPillar(pillar.slug),
		landing: getPillarLandingBySlug(pillar.slug)
	};
}
