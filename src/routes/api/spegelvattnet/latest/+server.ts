import { json } from '@sveltejs/kit';
import { isReflectionVisibleByAge, type WeeklyReflectionRecord } from '$lib/server/spegelvattnet';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const { data, error } = await locals.supabase
		.from('weekly_reflections')
		.select(
			'id, user_id, week_start, words, quoted_sentence, quoted_sentence_post_id, movement, open_question, status, paused_reason, context_snapshot, created_at, opened_at'
		)
		.eq('user_id', user.id)
		.in('status', ['ready', 'paused'])
		.order('week_start', { ascending: false })
		.limit(1)
		.maybeSingle<WeeklyReflectionRecord>();

	if (error) {
		console.error('Spegelvattnet latest load error:', error);
		return json({ error: 'Kunde inte hämta Spegelvattnet just nu.' }, { status: 500 });
	}

	if (!data) return json({ error: 'Not found.' }, { status: 404 });

	if (!isReflectionVisibleByAge(data.week_start)) {
		await locals.supabase
			.from('weekly_reflections')
			.update({ status: 'expired' })
			.eq('id', data.id)
			.is('opened_at', null);
		return json({ error: 'Not found.' }, { status: 404 });
	}

	return json({ reflection: data });
};
