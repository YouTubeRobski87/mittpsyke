import { redirect } from '@sveltejs/kit';
import { CHAT_CATEGORY_TO_SLUG } from '$lib/data/chat-slugs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const legacySlug = CHAT_CATEGORY_TO_SLUG[params.category];
	if (legacySlug) {
		throw redirect(301, `/chat/${legacySlug}${url.search}`);
	}
};
