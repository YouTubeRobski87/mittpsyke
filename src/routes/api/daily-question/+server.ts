import { json } from '@sveltejs/kit';
import { getOrCreateDailyQuestion, readTodaysDailyQuestion } from '$lib/server/daily-question';
import { hasDailyQuestionAiConsent } from '$lib/server/daily-question-ai-consent';
import { createServiceClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
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

	// Att öppna sidan får inte i sig skicka dagbokskontext till Anthropic.
	// Utan ?generate=true läses bara användarens egen, redan sparade rad - ingen
	// dagboksläsning, inget provideranrop, ingen ny context_snapshot.
	if (url.searchParams.get('generate') !== 'true') {
		const cached = await readTodaysDailyQuestion(locals.supabase, user.id);
		if (!cached) {
			return json({ id: null, question: null, date: null, regenerations: 0, maxRegenerations: 2, safety: false, needsGeneration: true });
		}
		return json({
			id: cached.id || null,
			question: cached.question_text,
			date: cached.date,
			regenerations: cached.regenerations,
			maxRegenerations: 2,
			safety: false,
			needsGeneration: false
		});
	}

	const result = await getOrCreateDailyQuestion(locals.supabase, user);

	return json({
		id: result.question.id || null,
		question: result.question.question_text,
		date: result.question.date,
		regenerations: result.question.regenerations,
		maxRegenerations: 2,
		safety: result.safety,
		needsGeneration: false
	});
};
