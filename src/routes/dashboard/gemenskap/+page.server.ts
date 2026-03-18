import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/login');
	}

	return {
		title: 'Gemenskap',
		description: 'En lugn och anonym plats för igenkänning, stöd och varsam bekräftelse.'
	};
};
