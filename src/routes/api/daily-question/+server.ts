import { json } from '@sveltejs/kit';
import { getOrCreateDailyQuestion } from '$lib/server/daily-question';
import { hasDiaryAiConsent } from '$lib/server/diary-ai-consent';
import { createServiceClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const {
		data: { user },
		error
	} = await locals.supabase.auth.getUser();

	if (error || !user) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const serviceClient = createServiceClient();
	if (!serviceClient) {
		return json({ error: 'Server configuration error.' }, { status: 500 });
	}

	if (!(await hasDiaryAiConsent(serviceClient, user.id))) {
		return json(
			{
				error: 'Consent required for sensitive diary AI features.',
				code: 'DIARY_AI_CONSENT_REQUIRED'
			},
			{ status: 403 }
		);
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
