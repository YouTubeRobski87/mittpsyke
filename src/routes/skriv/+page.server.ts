import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (user && !user.is_anonymous) {
		throw redirect(302, '/dagbok/checkin#skriv-sjalv');
	}

	return {};
};
