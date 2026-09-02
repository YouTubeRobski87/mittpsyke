import type { LayoutServerLoad } from './$types';
import { SIGN_UP_COMPLETED_COOKIE } from '$lib/sign-up-event';

export const load: LayoutServerLoad = async ({ locals: { supabase }, cookies }) => {
	const signUpCompleted = cookies.get(SIGN_UP_COMPLETED_COOKIE) === '1';

	if (signUpCompleted) {
		cookies.delete(SIGN_UP_COMPLETED_COOKIE, { path: '/' });
	}

	const {
		data: { user },
		error
	} = await supabase.auth.getUser();

	return {
		authenticatedUser: error ? null : user,
		signUpCompleted,
		profilePanel: null,
		unreadNotificationCount: 0
	};
};
