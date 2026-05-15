import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const { data, error } = await locals.supabase
		.from('weekly_reflections')
		.update({ opened_at: new Date().toISOString(), status: 'opened' })
		.eq('id', params.id)
		.eq('user_id', user.id)
		.eq('status', 'ready')
		.select('id')
		.maybeSingle();

	if (error) {
		console.error('Spegelvattnet open update error:', error);
		return json({ error: 'Kunde inte öppna Spegelvattnet just nu.' }, { status: 500 });
	}

	if (!data) return json({ error: 'Not found.' }, { status: 404 });
	return json({ success: true });
};
