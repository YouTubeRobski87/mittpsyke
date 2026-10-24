import { redirect } from '@sveltejs/kit';
import { safeInternalRedirect } from '$lib/safe-redirect';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	// Samma validering som inloggning och registrering, så att även
	// backslash-varianter och kontrolltecken avvisas.
	const next = safeInternalRedirect(url.searchParams.get('next'));

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			throw redirect(303, next);
		}
	}

	throw redirect(303, '/login');
};
