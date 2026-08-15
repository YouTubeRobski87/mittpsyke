import { json } from '@sveltejs/kit';
import { generateAIText } from '$lib/server/ai/text-generation';
import {
	buildDiaryReflectionRequest,
	DIARY_REFLECTION_FALLBACK
} from '$lib/server/ai/diary-reflection';
import { resolveDeterministicRiskGuard } from '$lib/ai/crisis-guard';
import { createServiceClient } from '$lib/server/supabase-admin';
import { hasDiaryAiConsent } from '$lib/server/diary-ai-consent';
import type { RequestHandler } from './$types';

// Rate limiting: per authenticated user.
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 3 * 60 * 1000; // 3 minutes

// Minimum text length for AI reflection (cost gating ~40% savings)
const MIN_TEXT_LENGTH = 50;


export const POST: RequestHandler = async ({ request, locals }) => {
	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();
	if (authError || !user) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const serviceClient = createServiceClient();
	if (!serviceClient) {
		return json({ error: 'Server configuration error.' }, { status: 500 });
	}

	if (!(await hasDiaryAiConsent(serviceClient, user.id))) {
		return json({ error: 'Consent required for sensitive diary AI features.' }, { status: 403 });
	}

	let parsedBody: unknown;
	try {
		parsedBody = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body.' }, { status: 400 });
	}

	if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const body = parsedBody as { text?: unknown; entryId?: unknown };
	const text = typeof body.text === 'string' ? body.text.trim() : '';

	if (!text) {
		return json({ error: 'No text provided.' }, { status: 400 });
	}

	if (text.length > 5000) {
		return json({ error: 'Text too long.' }, { status: 400 });
	}

	const guard = resolveDeterministicRiskGuard(text);
	if (guard) return json({ reflection: guard.reply, crisis: true });

	// AI gating: min 50 chars for meaningful reflection (saves ~40% cost)
	if (text.length < MIN_TEXT_LENGTH) {
		return json({ reflection: text.length < 10 ? null : DIARY_REFLECTION_FALLBACK });
	}

	const rateLimitKey = `user:${user.id}`;

	const lastCall = rateLimitMap.get(rateLimitKey) || 0;
	if (Date.now() - lastCall < RATE_LIMIT_MS) {
		return json({ reflection: DIARY_REFLECTION_FALLBACK });
	}
	rateLimitMap.set(rateLimitKey, Date.now());

	// Cleanup to prevent memory leak
	if (rateLimitMap.size > 1000) {
		const now = Date.now();
		for (const [key, time] of rateLimitMap) {
			if (now - time > RATE_LIMIT_MS) rateLimitMap.delete(key);
		}
	}

	try {
		const result = await generateAIText(buildDiaryReflectionRequest(text));
		return json({ reflection: result.text || DIARY_REFLECTION_FALLBACK });
	} catch (err) {
		console.error('Reflection API error:', err);
		return json({ reflection: DIARY_REFLECTION_FALLBACK });
	}
};
