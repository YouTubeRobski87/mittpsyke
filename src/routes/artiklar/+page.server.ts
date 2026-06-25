import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Omdirigerar /artiklar → /blogg
export const load: PageServerLoad = () => {
	redirect(301, '/blogg');
};
