import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'E-post och lösenord krävs.' });
		}

		const { error: signUpError } = await locals.supabase.auth.signUp({ email, password });

		if (signUpError) {
			return fail(400, { error: signUpError.message });
		}

		// Automatically sign in after successful registration
		const { error: signInError } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (signInError) {
			// Account created but couldn't auto-login, send to login page
			throw redirect(303, '/login');
		}

		throw redirect(303, '/dagbok');
	}
};
