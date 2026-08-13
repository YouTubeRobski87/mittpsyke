import { fail, redirect } from '@sveltejs/kit';
import { safeInternalRedirect } from '$lib/safe-redirect';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'E-post och lösenord krävs.' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(401, { error: 'Fel e-post eller lösenord.' });
		}

		// Skyddade sidor skickar hit med ?redirect=<sökväg>. Parametern
		// ignorerades tidigare, så den som skickades hit från /admin hamnade
		// ändå på /dashboard. safeInternalRedirect avvisar externa mål, så
		// parametern inte kan användas som open redirect.
		throw redirect(303, safeInternalRedirect(url.searchParams.get('redirect')));
	}
};
