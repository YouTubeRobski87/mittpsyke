import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import { RateLimiter } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

// Simple in-memory cache per sign+date — max 12 signs × 1 date = 12 entries/day
const cache = new Map<string, string>();

// Ingen inloggning krävs och "sign" valideras inte mot en fast lista - utan
// gräns skulle ett godtyckligt/skriptat "sign" per anrop kringgå cachen ovan
// och ge ett nytt OpenAI-anrop varje gång.
const HOROSCOPE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const HOROSCOPE_RATE_LIMIT_MAX_REQUESTS = 10;
const horoscopeRateLimiter = new RateLimiter(HOROSCOPE_RATE_LIMIT_WINDOW_MS, HOROSCOPE_RATE_LIMIT_MAX_REQUESTS);
const HOROSCOPE_AI_TIMEOUT_MS = 15_000;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	let sign: string;
	try {
		const body = await request.json();
		sign = typeof body.sign === 'string' ? body.sign.trim() : '';
	} catch {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	if (!sign) {
		return json({ error: 'Missing sign' }, { status: 400 });
	}

	const today = new Date().toISOString().slice(0, 10);
	const cacheKey = `${sign}:${today}`;

	if (cache.has(cacheKey)) {
		return json({ text: cache.get(cacheKey) });
	}

	if (horoscopeRateLimiter.consume(`ip:${getClientAddress()}`)) {
		return json(
			{ error: 'För många förfrågningar just nu. Vänta en liten stund och försök igen.' },
			{ status: 429 }
		);
	}

	try {
		const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: HOROSCOPE_AI_TIMEOUT_MS });

		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			max_tokens: 130,
			temperature: 0.85,
			messages: [
				{
					role: 'system',
					content: `Du skriver korta dagliga horoskoptexter för MittPsyke – en lugn, trygg svensk plattform för välmående.

Skriv alltid på svenska.
Tonen är mjuk, poetisk och varm – inte klyschig eller dramatisk.
Texten ska vara 2–3 meningar.
Fokusera på inre stämning, närvaro och välmående.
Undvik klichéer som "stjärnorna säger", "universum" eller "planeter i rörelse".
Inga löften om framtida händelser eller konkreta händelser.
Skriv som en vän som känner läsaren väl – enkelt och personligt.
Avsluta gärna med en liten uppmuntrande tanke.`.trim()
				},
				{
					role: 'user',
					content: `Skriv ett kort horoskop för ${sign} för idag.`
				}
			]
		});

		const text = response.choices[0]?.message?.content?.trim() ?? '';
		if (text) {
			cache.set(cacheKey, text);
		}
		return json({ text });
	} catch (err) {
		console.error('Horoscope API error:', err);
		return json({ error: 'Could not generate horoscope' }, { status: 500 });
	}
};
