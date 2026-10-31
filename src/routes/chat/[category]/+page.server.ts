import { redirect } from '@sveltejs/kit';
import { CHAT_CATEGORY_TO_SLUG } from '$lib/data/chat-slugs';
import { chatConsentHintFromRequest } from '$lib/server/chat-consent-hint';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, cookies, parent }) => {
	const legacySlug = CHAT_CATEGORY_TO_SLUG[params.category];
	if (legacySlug) {
		throw redirect(301, `/chat/${legacySlug}${url.search}`);
	}

	const { authenticatedUser } = await parent();
	return { chatConsentHint: chatConsentHintFromRequest(Boolean(authenticatedUser), cookies) };
};
