import { createStoryLoadToken } from '$lib/server/anonymous-stories';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const loadedAt = Date.now();

	return {
		loadedAt,
		loadToken: createStoryLoadToken(loadedAt)
	};
};
