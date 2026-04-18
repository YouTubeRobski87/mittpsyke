import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	throw redirect(308, `/guider/${params.pillar}/${params.guide}`);
}
