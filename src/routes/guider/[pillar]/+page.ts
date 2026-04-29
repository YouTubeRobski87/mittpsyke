import { error, redirect } from '@sveltejs/kit';
import { getGuidesForPillar, getPillarBySlug, getPillarLandingBySlug } from '$lib/seo-kit/content';

const pillarRedirects: Record<string, string> = {
	'social-angest': '/guider/angest/social-angest'
};

export function load({ params }) {
	const redirectTarget = pillarRedirects[params.pillar];
	if (redirectTarget) {
		throw redirect(301, redirectTarget);
	}

	const pillarSlug = params.pillar === 'stress-och-overbelastning' ? 'stress' : params.pillar;

	if (pillarSlug !== params.pillar) {
		throw redirect(308, `/guider/${pillarSlug}`);
	}

	const pillar = getPillarBySlug(pillarSlug);

	if (!pillar) {
		throw error(404, 'Guiden hittades inte');
	}

	return {
		pillar,
		guides: getGuidesForPillar(pillar.slug),
		landing: getPillarLandingBySlug(pillar.slug)
	};
}
