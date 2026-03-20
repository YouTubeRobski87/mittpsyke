import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const SYSTEM_PROMPT = `Du är ett varmt och empatiskt AI-stöd på MittPsyke.
Användaren har gjort en snabbincheckning och beskrivit hur de mår.
Skriv en kort, varm och icke-dömande reflektion på 3-4 meningar
baserat på deras svar. Börja inte med "Jag" eller "Det verkar".
Använd ett lugnt, mänskligt språk. Skriv på svenska.
Svara ALLTID unikt och personligt baserat på exakt vad användaren svarat. Nämn specifika ord från deras svar. Skriv aldrig samma svar två gånger.`;

const FALLBACK_REFLECTION =
	'Det är fint att du stannade upp och gjorde en incheckning. Känslor kan skifta snabbt, och det är okej att de gör det. Du behöver inte lösa allt nu, ett litet steg i taget räcker. Om du vill kan du skriva vidare i dagboken och ge plats åt det som pågår.';

const REQUEST_TIMEOUT_MS = 12000;
const OPENAI_MODEL = (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim();

function errorResponse(message: string, status: number) {
	return json({ success: false, error: message }, { status });
}

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

function normalizeApiKey(value: string | undefined): string | null {
	if (!value) return null;

	const normalized = value
		.trim()
		.replace(/^['"]|['"]$/g, '')
		.replace(/^Bearer\s+/i, '')
		.replace(/\s+/g, '');

	if (!normalized || /[\u0000-\u001f\u007f]/.test(normalized)) {
		return null;
	}

	return normalized;
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

function extractOpenAIText(payload: unknown): string {
	if (!payload || typeof payload !== 'object') return '';

	const choices = (payload as { choices?: unknown }).choices;
	if (!Array.isArray(choices) || choices.length === 0) return '';

	const firstChoice = choices[0];
	if (!firstChoice || typeof firstChoice !== 'object') return '';

	const message = (firstChoice as { message?: unknown }).message;
	if (!message || typeof message !== 'object') return '';

	const content = (message as { content?: unknown }).content;
	return typeof content === 'string' ? content.trim() : '';
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

	console.log('Check-in data:', { moods, factors, duration, selfCare, helpNeeded, freeText });

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

	const apiKey = normalizeApiKey(env.OPENAI_API_KEY);
	if (!apiKey) {
		return json({ success: true, reflection: FALLBACK_REFLECTION });
	}

	const userMessage = [
		`Användaren mår: ${moods.length > 0 ? moods.join(', ') : 'Inte angivet'}`,
		`Påverkas av: ${factors.length > 0 ? factors.join(', ') : 'Inte angivet'}`,
		`Hur länge: ${duration || 'Inte angivet'}`,
		`Gjort för sig själv idag: ${selfCare.length > 0 ? selfCare.join(', ') : 'Inte angivet'}`,
		`Vad skulle hjälpa: ${helpNeeded.length > 0 ? helpNeeded.join(', ') : 'Inte angivet'}`,
		`Egna ord: ${freeText || 'Inga egna ord.'}`
	].join('\n');

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model: OPENAI_MODEL,
				temperature: 0.7,
				max_completion_tokens: 260,
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					{ role: 'user', content: userMessage }
				]
			}),
			signal: controller.signal
		});

		if (!response.ok) {
			console.error('OpenAI check-in reflection failed:', response.status, await response.text());
			return json({ success: true, reflection: FALLBACK_REFLECTION });
		}

		const payload = (await response.json()) as unknown;
		const reflection = extractOpenAIText(payload);
		return json({
			success: true,
			reflection: reflection || FALLBACK_REFLECTION
		});
	} catch (error) {
		console.error('OpenAI check-in reflection error:', error);
		return json({ success: true, reflection: FALLBACK_REFLECTION });
	} finally {
		clearTimeout(timeout);
	}
};
