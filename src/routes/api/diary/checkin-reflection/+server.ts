import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const SYSTEM_PROMPT = `Du är ett varmt och empatiskt AI-stöd på MittPsyke.
Användaren har gjort en snabbincheckning och beskrivit hur de mår.
Skriv en kort, varm och icke-dömande reflektion på 3-4 meningar
baserat på deras svar. Börja inte med "Jag" eller "Det verkar".
Använd ett lugnt, mänskligt språk. Skriv på svenska.`;

const FALLBACK_REFLECTION =
	'Det är fint att du stannade upp och gjorde en incheckning. Känslor kan skifta snabbt, och det är okej att de gör det. Du behöver inte lösa allt nu, ett litet steg i taget räcker. Om du vill kan du skriva vidare i dagboken och ge plats åt det som pågår.';

const REQUEST_TIMEOUT_MS = 12000;
const CLAUDE_MODEL = (env.CLAUDE_MODEL || env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest').trim();

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

function extractClaudeText(payload: unknown): string {
	if (!payload || typeof payload !== 'object') return '';
	const content = (payload as { content?: unknown }).content;
	if (!Array.isArray(content)) return '';

	return content
		.map((item) => {
			if (!item || typeof item !== 'object') return '';
			const block = item as { type?: unknown; text?: unknown };
			if (block.type !== 'text' || typeof block.text !== 'string') return '';
			return block.text.trim();
		})
		.filter(Boolean)
		.join('\n')
		.trim();
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

	const apiKey = normalizeApiKey(env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY);
	if (!apiKey) {
		return json({ success: true, reflection: FALLBACK_REFLECTION });
	}

	const userMessage = [
		`Användaren mår: ${selectedMoods.length > 0 ? selectedMoods.join(', ') : 'Inte angivet'}`,
		`Påverkas av: ${selectedFactors.length > 0 ? selectedFactors.join(', ') : 'Inte angivet'}`,
		`Hur länge: ${selectedDuration || 'Inte angivet'}`,
		`Gjort för sig själv idag: ${selectedSelfCare.length > 0 ? selectedSelfCare.join(', ') : 'Inte angivet'}`,
		`Vad skulle hjälpa: ${selectedHelp.length > 0 ? selectedHelp.join(', ') : 'Inte angivet'}`,
		`Egna ord: ${ownWords || 'Inga egna ord.'}`
	].join('\n');

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model: CLAUDE_MODEL,
				system: SYSTEM_PROMPT,
				max_tokens: 260,
				temperature: 0.7,
				messages: [{ role: 'user', content: userMessage }]
			}),
			signal: controller.signal
		});

		if (!response.ok) {
			console.error('Claude check-in reflection failed:', response.status, await response.text());
			return json({ success: true, reflection: FALLBACK_REFLECTION });
		}

		const payload = (await response.json()) as unknown;
		const reflection = extractClaudeText(payload);
		return json({
			success: true,
			reflection: reflection || FALLBACK_REFLECTION
		});
	} catch (error) {
		console.error('Claude check-in reflection error:', error);
		return json({ success: true, reflection: FALLBACK_REFLECTION });
	} finally {
		clearTimeout(timeout);
	}
};
