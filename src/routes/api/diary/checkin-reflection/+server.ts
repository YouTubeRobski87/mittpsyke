import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';
import { resolveDeterministicRiskGuard } from '$lib/ai/crisis-guard';
import {
	buildCheckinReflectionRequest,
	CHECKIN_REFLECTION_FALLBACK
} from '$lib/server/ai/checkin-reflection';
import { generateAIText } from '$lib/server/ai/text-generation';

function errorResponse(message: string, status: number) {
	return json({ success: false, error: message }, { status });
}

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

function normalizeText(value: unknown, maxLength = 600): string {
	if (typeof value !== 'string') return '';
	return value.trim().slice(0, maxLength);
}

function normalizeList(value: unknown, maxItems = 10): string[] {
	if (!Array.isArray(value)) return [];

	const seen = new Set<string>();
	const items: string[] = [];

	for (const item of value) {
		if (typeof item !== 'string') continue;
		const normalized = item.trim().slice(0, 80);
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
		items.push(normalized);
		if (items.length >= maxItems) break;
	}

	return items;
}

export const POST: RequestHandler = async ({ request }) => {
	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return errorResponse('Missing or invalid Authorization header.', 401);
	}

	const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseAnonKey) {
		return errorResponse('Server configuration error.', 500);
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});

	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return errorResponse('Unauthorized.', 401);
	}

	let parsedBody: unknown;
	try {
		parsedBody = await request.json();
	} catch {
		return errorResponse('Invalid JSON body.', 400);
	}

	if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
		return errorResponse('Invalid request body.', 400);
	}

	const body = parsedBody as {
		selectedMoods?: unknown;
		selectedFactors?: unknown;
		selectedDuration?: unknown;
		selectedSelfCare?: unknown;
		selectedHelp?: unknown;
		moodFreeText?: unknown;
		factorFreeText?: unknown;
	};

	const selectedMoods = normalizeList(body.selectedMoods);
	const selectedFactors = normalizeList(body.selectedFactors);
	const selectedDuration = normalizeText(body.selectedDuration, 80);
	const selectedSelfCare = normalizeList(body.selectedSelfCare);
	const selectedHelp = normalizeList(body.selectedHelp);
	const moodFreeText = normalizeText(body.moodFreeText);
	const factorFreeText = normalizeText(body.factorFreeText);
	const ownWords = [moodFreeText, factorFreeText].filter(Boolean).join(' | ');
	const moods = selectedMoods;
	const factors = selectedFactors;
	const duration = selectedDuration;
	const selfCare = selectedSelfCare;
	const helpNeeded = selectedHelp;
	const freeText = ownWords;

	if (
		selectedMoods.length === 0 &&
		selectedFactors.length === 0 &&
		!selectedDuration &&
		selectedSelfCare.length === 0 &&
		selectedHelp.length === 0 &&
		!ownWords
	) {
		return errorResponse('Tom incheckning kan inte reflekteras.', 400);
	}

	const userMessage = [
		`Användaren mår: ${moods.length > 0 ? moods.join(', ') : 'Inte angivet'}`,
		`Påverkas av: ${factors.length > 0 ? factors.join(', ') : 'Inte angivet'}`,
		`Hur länge: ${duration || 'Inte angivet'}`,
		`Gjort för sig själv idag: ${selfCare.length > 0 ? selfCare.join(', ') : 'Inte angivet'}`,
		`Vad skulle hjälpa: ${helpNeeded.length > 0 ? helpNeeded.join(', ') : 'Inte angivet'}`,
		`Egna ord: ${freeText || 'Inga egna ord.'}`
	].join('\n');

	const guard = resolveDeterministicRiskGuard(userMessage);
	if (guard) return json({ success: true, reflection: guard.reply, crisis: true });

	try {
		const result = await generateAIText(buildCheckinReflectionRequest(userMessage));
		return json({
			success: true,
			reflection: result.text || CHECKIN_REFLECTION_FALLBACK
		});
	} catch {
		console.error('Check-in reflection AI call failed');
		return json({ success: true, reflection: CHECKIN_REFLECTION_FALLBACK });
	}
};
