import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();

	return {
		authenticatedUser: error ? null : user,
		profilePanel: null,
		unreadNotificationCount: 0
	};
};
