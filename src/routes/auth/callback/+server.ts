import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function normalizeNext(next: string | null) {
	if (!next || !next.startsWith('/') || next.startsWith('//')) {
		return '/dashboard';
	}

	return next;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = normalizeNext(url.searchParams.get('next'));

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			throw redirect(303, next);
		}
	}

	throw redirect(303, '/login');
};
