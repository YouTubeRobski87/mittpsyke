import { chatConsentHintFromRequest } from '$lib/server/chat-consent-hint';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, parent }) => {
	const { authenticatedUser } = await parent();
	return { chatConsentHint: chatConsentHintFromRequest(Boolean(authenticatedUser), cookies) };
};
