import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();

	if (session?.user) {
		throw redirect(302, '/dagbok/checkin');
	}

	return {};
};
