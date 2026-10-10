import { json } from '@sveltejs/kit';
import {
	isComprehensionAnswer,
	recordFramstegComprehension
} from '$lib/server/framsteg-comprehension';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Ogiltigt svar.' }, { status: 400 });
	}

	if (!body || typeof body !== 'object') {
		return json({ error: 'Ogiltigt svar.' }, { status: 400 });
	}

	const payload = body as Record<string, unknown>;
	if (!isComprehensionAnswer(payload.clarity) || !isComprehensionAnswer(payload.worldChange)) {
		return json({ error: 'Ogiltigt svar.' }, { status: 400 });
	}

	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !user || user.is_anonymous) {
		return json({ error: 'Du behöver vara inloggad för att lämna svaret.' }, { status: 401 });
	}

	const status = await recordFramstegComprehension({
		userId: user.id,
		clarity: payload.clarity,
		worldChange: payload.worldChange
	});

	if (status === 'written' || status === 'duplicate') {
		return json({ ok: true });
	}

	return json({ error: 'Svaret kunde inte sparas just nu.' }, { status: 503 });
};
