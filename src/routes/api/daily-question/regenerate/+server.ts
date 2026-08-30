import { json } from '@sveltejs/kit';
import { regenerateDailyQuestion } from '$lib/server/daily-question';
import { hasDailyQuestionAiConsent } from '$lib/server/daily-question-ai-consent';
import { createServiceClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
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

	if (!(await hasDailyQuestionAiConsent(serviceClient, user.id))) {
		return json(
			{
				error: 'Consent required for sensitive diary AI features.',
				code: 'DIARY_AI_CONSENT_REQUIRED'
			},
			{ status: 403 }
		);
	}

	const result = await regenerateDailyQuestion(locals.supabase, user);

	if ('limitReached' in result) {
		return json(
			{
				error: 'Du kan byta fråga två gånger per dag.',
				id: result.question.id || null,
				question: result.question.question_text,
				date: result.question.date,
				regenerations: result.question.regenerations,
				maxRegenerations: 2
			},
			{ status: 429 }
		);
	}

	return json({
		id: result.question.id || null,
		question: result.question.question_text,
		date: result.question.date,
		regenerations: result.question.regenerations,
		maxRegenerations: 2,
		safety: result.safety
	});
};
