import { json } from '@sveltejs/kit';
import { getOrCreateDailyQuestion } from '$lib/server/daily-question';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const {
		data: { user },
		error
	} = await locals.supabase.auth.getUser();

	if (error || !user) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const result = await getOrCreateDailyQuestion(locals.supabase, user);

	return json({
		id: result.question.id || null,
		question: result.question.question_text,
		date: result.question.date,
		regenerations: result.question.regenerations,
		maxRegenerations: 2,
		safety: result.safety
	});
};
