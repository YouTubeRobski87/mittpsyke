import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	// Validera användaren mot Supabase Auth-servern innan vi litar på sessionen.
	// getUser() autentiserar token, getSession() läser bara cookien.
	const {
		data: { user }
	} = await supabase.auth.getUser();

	let session = null;
	if (user) {
		const {
			data: { session: rawSession }
		} = await supabase.auth.getSession();
		session = rawSession;
	}

	return { session, profilePanel: null, unreadNotificationCount: 0 };
};
