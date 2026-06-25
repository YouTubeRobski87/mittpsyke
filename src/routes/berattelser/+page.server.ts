import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Omdirigerar /berattelser → /anonyma-berattelser
export const load: PageServerLoad = () => {
	redirect(301, '/anonyma-berattelser');
};
