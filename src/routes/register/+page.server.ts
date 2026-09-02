import { redirect, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { createdAccountFromSignUp, SIGN_UP_COMPLETED_COOKIE } from '$lib/sign-up-event';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'E-post och lösenord krävs.' });
		}

		const { data: signUpData, error: signUpError } = await locals.supabase.auth.signUp({
			email,
			password
		});

		if (signUpError) {
			return fail(400, { error: signUpError.message });
		}

		// Sätts bara när Supabase bekräftar en verklig ny identity. Markören
		// konsumeras en gång av layouten, som låter den befintliga GA4-helpern
		// skicka standardeventet utan några personuppgifter.
		if (createdAccountFromSignUp(signUpData.user)) {
			cookies.set(SIGN_UP_COMPLETED_COOKIE, '1', {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: !dev,
				maxAge: 60
			});
		}

		// Automatically sign in after successful registration
		const { error: signInError } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (signInError) {
			// Account created but couldn't auto-login, send to login page
			throw redirect(303, '/login');
		}

		throw redirect(303, '/dashboard');
	}
};
