import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { availableToneIds, buildTonePrompt } from '$lib/data/tonePrompts';
import type { RequestHandler } from './$types';

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

function deriveTone(energyScore: number, moodEmojis: string[]): string {
	const sadEmojis = ['ðŸ˜”', 'ðŸ˜°', 'ðŸ˜¤'];
	const hasSadMood = moodEmojis.some((e) => sadEmojis.includes(e));
	if (energyScore >= 7 && !hasSadMood) return 'positiv';
	if (energyScore <= 3 || hasSadMood) return 'tung';
	return 'neutral';
}

interface ColorTone {
	id?: string;
	name?: string;
	meaning?: string;
	keywords?: string[];
}
export const POST: RequestHandler = async ({ request }) => {
	// Verifiera Bearer-token
	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return json({ error: 'Ã…tkomst nekad.' }, { status: 401 });
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
		return json({ error: 'Ã…tkomst nekad.' }, { status: 401 });
	}

	const storifyKey = env.STORIFY_API_KEY;
	if (!storifyKey) {
		return json({ error: 'AI-tjÃ¤nsten Ã¤r inte konfigurerad.' }, { status: 500 });
	}

	// Parsa request-kropp â€” stÃ¶der intervjulÃ¤ge och snabblÃ¤ge
	let systemPrompt: string;
	let userMessage: string;
	let tone: string;

	try {
		const body = await request.json();
		const colorTone =
			body.colorTone && typeof body.colorTone === 'object'
				? (body.colorTone as ColorTone)
				: null;

		if (body.chatTranscript) {
			// IntervjulÃ¤ge: anvÃ¤nd vald ton och transkript
			const requestedTone = typeof body.selectedTone === 'string' ? body.selectedTone : '';
			const selectedTone = availableToneIds.includes(requestedTone as (typeof availableToneIds)[number])
				? requestedTone
				: 'therapist';
			systemPrompt = buildTonePrompt(selectedTone);
			if (colorTone?.id) {
				const keywords =
					Array.isArray(colorTone.keywords) && colorTone.keywords.length > 0
						? `\n- Nyckelord: ${colorTone.keywords.join(', ')}`
						: '';
				systemPrompt += `\n\nEMOTIONELL TON:
- Vald farg: ${colorTone.name ?? colorTone.id}
- Betydelse: ${colorTone.meaning ?? ''}${keywords}
- Lat detta bli ett subtilt kanslolager i spraket, kanslan och sammanfattningen.
- Behall rostens huvudkaraktar tydlig. Upprepa inte fargen onaturligt och gor inte texten flummig.
- Resultatet ska fortfarande kannas manskligt, tryggt och seriost.`;
			}
			tone = selectedTone;
			userMessage = `HÃ¤r Ã¤r transkriptet frÃ¥n en intervju om min dag:\n\n${body.chatTranscript}\n\nSkriv ett dagboksinlÃ¤gg baserat pÃ¥ det vi pratade om.`;
		} else {
			// SnabblÃ¤ge: fri text + stÃ¤mning + energi
			const userInput: string = typeof body.userInput === 'string' ? body.userInput.trim() : '';
			const moodEmojis: string[] = Array.isArray(body.moodEmojis) ? body.moodEmojis : [];
			const energyScore: number = typeof body.energyScore === 'number' ? body.energyScore : 5;

			if (!userInput) {
				return json({ error: 'FÃ¤ltet "userInput" Ã¤r obligatoriskt.' }, { status: 400 });
			}

			systemPrompt =
				'Du Ã¤r en empatisk dagboksassistent. Omvandla anvÃ¤ndarens korta beskrivning av sin dag till ett personligt, reflekterande dagboksinlÃ¤gg pÃ¥ svenska. Skriv i fÃ¶rsta person med en varm och Ã¤rlig ton. InlÃ¤gget ska vara 3â€“5 meningar. Inga rubriker eller metadata â€“ bara den rena dagbokstexten.';

			const moodStr = moodEmojis.length > 0 ? `StÃ¤mning: ${moodEmojis.join(' ')}` : '';
			const energyStr = `EnerginivÃ¥: ${energyScore}/10`;
			userMessage = [userInput, moodStr, energyStr].filter(Boolean).join('\n');
			tone = deriveTone(energyScore, moodEmojis);
		}
	} catch {
		return json({ error: 'Ogiltig fÃ¶rfrÃ¥gningskropp.' }, { status: 400 });
	}

	// Anropa Anthropic API
	const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': storifyKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 1024,
			system: systemPrompt,
			messages: [{ role: 'user', content: userMessage }]
		})
	});

	if (!anthropicResponse.ok) {
		console.error('Anthropic generate-fel:', await anthropicResponse.text());
		return json({ error: 'AI-tjÃ¤nsten Ã¤r inte tillgÃ¤nglig just nu.' }, { status: 502 });
	}

	const result = (await anthropicResponse.json()) as {
		content?: { type: string; text: string }[];
	};

	const entry = result.content?.find((c) => c.type === 'text')?.text ?? '';

	return json({ entry, tone });
};
