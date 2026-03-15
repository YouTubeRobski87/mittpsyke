import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const REFLECTION_PROMPT = `Du är en lugn reflektionskompanjon.

Din uppgift är att kort spegla tillbaka det användaren skrev i sin dagbok.

Regler:
- Max 2 meningar
- Inga råd
- Ingen analys eller diagnos
- Inget terapispråk
- Inga instruktioner
- Bara mjuk spegling
- Ton: lugn, validerande, enkel
- Skriv på svenska

Tala som någon som erkänner det som skrevs, utan att tolka det.

Undvik:
- "Det låter som att" som öppning (variera)
- Upprepande formuleringar
- Kliniska ord
- Överdrivet positiva uttalanden

Exempel på bra öppningar:
- "Mycket verkar snurra runt just nu."
- "Det finns en tyngd i det du beskriver."
- "Något i dagen verkar ha gett lite mer utrymme."
- "Det märks att du försöker ta hand om dig själv."`;

const normalizeApiKey = (value: string | undefined): string | null => {
	if (!value) return null;
	const normalized = value.trim().replace(/^['"]/,'').replace(/['"]$/,'').replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
	if (!normalized || /[\u0000-\u001f\u007f]/.test(normalized)) return null;
	return normalized;
};

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 3 * 60 * 1000; // 3 minutes

export const POST: RequestHandler = async ({ request }) => {
	let parsedBody: unknown;
	try {
		parsedBody = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body.' }, { status: 400 });
	}

	if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const body = parsedBody as { text?: unknown };
	const text = typeof body.text === 'string' ? body.text.trim() : '';

	if (!text) {
		return json({ error: 'No text provided.' }, { status: 400 });
	}

	if (text.length > 5000) {
		return json({ error: 'Text too long.' }, { status: 400 });
	}

	// Don't reflect on very short entries
	if (text.length < 10) {
		return json({ reflection: null });
	}

	// Rate limiting (in-memory per IP)
	const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
	const lastCall = rateLimitMap.get(clientIp) || 0;
	if (Date.now() - lastCall < RATE_LIMIT_MS) {
		return json({ reflection: 'Tack för att du skrev ner dina tankar idag 🌱' });
	}
	rateLimitMap.set(clientIp, Date.now());

	// Cleanup to prevent memory leak
	if (rateLimitMap.size > 1000) {
		const now = Date.now();
		for (const [key, time] of rateLimitMap) {
			if (now - time > RATE_LIMIT_MS) rateLimitMap.delete(key);
		}
	}

	const apiKey = normalizeApiKey(env.OPENAI_API_KEY);
	if (!apiKey) {
		console.error('OPENAI_API_KEY is missing or malformed');
		return json({ reflection: 'Tack för att du skrev ner dina tankar idag 🌱' });
	}

	const openai = new OpenAI({ apiKey });
	const model = (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim();

	try {
		const completion = await openai.chat.completions.create({
			model,
			temperature: 0.7,
			max_completion_tokens: 150,
			frequency_penalty: 0.4,
			presence_penalty: 0.3,
			messages: [
				{ role: 'system', content: REFLECTION_PROMPT },
				{ role: 'user', content: `Dagboksinlägg:\n"""\n${text}\n"""` }
			]
		});

		const reflection = completion.choices[0]?.message?.content?.trim() || null;
		return json({ reflection: reflection || 'Tack för att du skrev ner dina tankar idag 🌱' });
	} catch (err) {
		console.error('Reflection API error:', err);
		return json({ reflection: 'Tack för att du skrev ner dina tankar idag 🌱' });
	}
};
