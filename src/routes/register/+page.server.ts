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

		const { error } = await locals.supabase.auth.signUp({ email, password });

		if (error) {
			return fail(400, { error: error.message });
		}

		throw redirect(303, '/dagbok');
	}
};
