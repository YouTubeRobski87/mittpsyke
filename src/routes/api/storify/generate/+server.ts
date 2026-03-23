import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

function deriveTone(energyScore: number, moodEmojis: string[]): string {
	const sadEmojis = ['😔', '😰', '😤'];
	const hasSadMood = moodEmojis.some((e) => sadEmojis.includes(e));
	if (energyScore >= 7 && !hasSadMood) return 'positiv';
	if (energyScore <= 3 || hasSadMood) return 'tung';
	return 'neutral';
}

export const POST: RequestHandler = async ({ request }) => {
	// Verifiera Bearer-token
	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return json({ error: 'Åtkomst nekad.' }, { status: 401 });
	}

	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		return json({ error: 'Serverkonfigurationsfel.' }, { status: 500 });
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Åtkomst nekad.' }, { status: 401 });
	}

	// Parsa request-kropp
	let userInput: string;
	let moodEmojis: string[];
	let energyScore: number;

	try {
		const body = await request.json();
		userInput = typeof body.userInput === 'string' ? body.userInput.trim() : '';
		moodEmojis = Array.isArray(body.moodEmojis) ? body.moodEmojis : [];
		energyScore = typeof body.energyScore === 'number' ? body.energyScore : 5;
	} catch {
		return json({ error: 'Ogiltig förfrågningskropp.' }, { status: 400 });
	}

	if (!userInput) {
		return json({ error: 'Fältet "userInput" är obligatoriskt.' }, { status: 400 });
	}

	const anthropicKey = env.ANTHROPIC_API_KEY;
	if (!anthropicKey) {
		return json({ error: 'AI-tjänsten är inte konfigurerad.' }, { status: 500 });
	}

	// Bygg prompten
	const moodStr = moodEmojis.length > 0 ? `Stämning: ${moodEmojis.join(' ')}` : '';
	const energyStr = `Energinivå: ${energyScore}/10`;

	const userMessage = [userInput, moodStr, energyStr].filter(Boolean).join('\n');

	// Anropa Anthropic API
	const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': anthropicKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 512,
			system:
				'Du är en empatisk dagboksassistent. Omvandla användarens korta beskrivning av sin dag till ett personligt, reflekterande dagboksinlägg på svenska. Skriv i första person med en varm och ärlig ton. Inlägget ska vara 3–5 meningar. Inga rubriker eller metadata – bara den rena dagbokstexten.',
			messages: [{ role: 'user', content: userMessage }]
		})
	});

	if (!anthropicResponse.ok) {
		console.error('Anthropic API-fel:', await anthropicResponse.text());
		return json({ error: 'AI-tjänsten är inte tillgänglig just nu.' }, { status: 502 });
	}

	const result = (await anthropicResponse.json()) as {
		content?: { type: string; text: string }[];
	};

	const entry = result.content?.find((c) => c.type === 'text')?.text ?? '';
	const tone = deriveTone(energyScore, moodEmojis);

	return json({ entry, tone });
};
