import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	const pillarSlug = params.pillar === 'stress-och-overbelastning' ? 'stress' : params.pillar;
	throw redirect(308, `/guider/${pillarSlug}`);
}
