import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') ?? '10') || 10));
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	const { data, error, count } = await locals.supabase
		.from('weekly_reflections')
		.select(
			'id, week_start, words, quoted_sentence, quoted_sentence_post_id, movement, open_question, status, opened_at',
			{ count: 'exact' }
		)
		.eq('user_id', user.id)
		.eq('status', 'opened')
		.order('week_start', { ascending: false })
		.range(from, to);

	if (error) {
		console.error('Spegelvattnet history load error:', error);
		return json({ error: 'Kunde inte hämta historik just nu.' }, { status: 500 });
	}

	return json({
		reflections: data ?? [],
		page,
		pageSize,
		total: count ?? 0
	});
};
