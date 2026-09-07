import { createStoryLoadToken, hasValidStoryRateLimitSalt } from '$lib/server/anonymous-stories';
import type { PageServerLoad } from './$types';

export type StoryFormLoad =
	| { formAvailable: true; loadedAt: number; loadToken: string }
	| { formAvailable: false; loadedAt: null; loadToken: null };

export const load: PageServerLoad = (): StoryFormLoad => {
	// Samma fail-closed-kontroll som inskickningsendpointen. Saknas konfigurationen
	// skapas ingen token alls och formuläret renderas inte - i stället visar sidan
	// ett generellt meddelande utan tekniska detaljer.
	if (!hasValidStoryRateLimitSalt()) {
		console.error('Anonymous story form unavailable: rate limiting is not configured.');
		return { formAvailable: false, loadedAt: null, loadToken: null };
	}

	const loadedAt = Date.now();

	return {
		formAvailable: true,
		loadedAt,
		loadToken: createStoryLoadToken(loadedAt)
	};
};
