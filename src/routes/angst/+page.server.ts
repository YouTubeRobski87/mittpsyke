import type { PageServerLoad } from './$types';
import { loadPublicLandingPage } from '$lib/server/landing-pages';

export const load: PageServerLoad = async () => {
	return loadPublicLandingPage('angst');
};
