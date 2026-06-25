import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (user) {
		throw redirect(302, '/dagbok/checkin');
	}

	return {};
};
