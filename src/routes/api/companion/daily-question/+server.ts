import { json } from '@sveltejs/kit';
import { recordCompanionDailyResponse } from '$lib/server/companion-daily-question';
import type { RequestHandler } from './$types';

type RequestBody = {
	questionId?: unknown;
	answerId?: unknown;
};

/**
 * Sparar användarens svar på följeslagarens dagliga fråga, eller markerar dagen
 * som överhoppad (answerId: null). Datum och användare bestäms på servern.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !user || user.is_anonymous) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	let body: RequestBody;
	try {
		body = (await request.json()) as RequestBody;
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	if (typeof body?.questionId !== 'string') {
		return json({ error: 'Field "questionId" is required.' }, { status: 400 });
	}
	if (body.answerId !== null && body.answerId !== undefined && typeof body.answerId !== 'string') {
		return json({ error: 'Field "answerId" must be a string or null.' }, { status: 400 });
	}

	const result = await recordCompanionDailyResponse(locals.supabase, user.id, {
		questionId: body.questionId,
		answerId: typeof body.answerId === 'string' ? body.answerId : null
	});

	if (!result.ok) {
		return json(
			{ error: result.reason === 'invalid' ? 'Unknown question or answer.' : 'Could not save answer.' },
			{ status: result.reason === 'invalid' ? 400 : 500 }
		);
	}

	return json({ state: result.state });
};
