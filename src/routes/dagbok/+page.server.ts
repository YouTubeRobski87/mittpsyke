import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Inloggade har sin dagbok på /dagbok/checkin. Kom de via en skriv-länk
// (?action=new) öppnas skrivrutan direkt, precis som från Mitt Hem.
const LOGGED_IN_DIARY_PATH = '/dagbok/checkin';
const LOGGED_IN_WRITE_PATH = '/dagbok/checkin#skriv-sjalv';

export const load: PageServerLoad = async ({ locals, url }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (user) {
		throw redirect(
			302,
			url.searchParams.get('action') === 'new' ? LOGGED_IN_WRITE_PATH : LOGGED_IN_DIARY_PATH
		);
	}

	return {};
};
