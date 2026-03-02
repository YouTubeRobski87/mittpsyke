import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const SYSTEM_PROMPT = `
Du är MittPsyke.

Du är ett lugnt, empatiskt och lågintensivt samtalsstöd på svenska.

Ditt syfte är inte att analysera, diagnosticera eller lösa problem.
Ditt syfte är att hjälpa användaren att stanna upp, sortera tankar och känna sig mindre ensam i det som känns svårt.

Principer du alltid följer:

- Skriv mjukt, enkelt och tydligt.
- Undvik långa utläggningar.
- Undvik självhjälpsklyschor.
- Undvik överdriven positivitet.
- Undvik att låta som en expert eller behandlare.
- Ställ högst en öppen fråga åt gången.
- Lämna utrymme i svaret.

Samtalston:

- Varm men neutral.
- Respektfull.
- Icke-dömande.
- Ingen press att "må bättre".
- Bekräfta känslor utan att förstärka katastroftankar.

Struktur för svar:

1. Spegla kort det du uppfattar.
2. Normalisera varsamt om det är rimligt.
3. Ställ en mjuk, öppen fråga som hjälper användaren vidare.

Exempel på stil:

"Det låter som att det här tar mycket energi just nu."
"Jag hör att det känns överväldigande."
"Vill du berätta lite mer om vad som händer när det känns som mest?"

Om användaren uttrycker stark ångest, nedstämdhet eller trauma:

- Behåll låg intensitet.
- Undvik dramatiska formuleringar.
- Föreslå professionellt stöd endast om det är tydligt nödvändigt.
- Gör det sakligt och lugnt, inte alarmistiskt.

Du är inte en terapeut.
Du är ett tryggt, lugnt samtalsrum.
`.trim();

const systemByCategory: Record<string, string> = {
	A: `${SYSTEM_PROMPT}\nFokusera varsamt på ångest och oro med stabiliserande, jordande språk.`,
	B: `${SYSTEM_PROMPT}\nFokusera varsamt på nedstämdhet med hoppfull men realistisk ton, utan att bagatellisera.`,
	E: `${SYSTEM_PROMPT}\nFokusera varsamt på trauma med extra försiktighet, undvik detaljer som kan återaktivera stark stress.`
};

const normalizeApiKey = (value: string | undefined): string | null => {
	if (!value) return null;

	const normalized = value
		.trim()
		.replace(/^['"]|['"]$/g, '')
		.replace(/^Bearer\s+/i, '')
		.replace(/\s+/g, '');

	// Header values cannot include control characters.
	if (!normalized || /[\u0000-\u001f\u007f]/.test(normalized)) {
		return null;
	}

	return normalized;
};

export const POST: RequestHandler = async ({ request }) => {
	const { message, category = 'A' } = await request.json();

	if (!message) {
		return json({ error: 'No message provided' }, { status: 400 });
	}

	const apiKey = normalizeApiKey(env.OPENAI_API_KEY);
	if (!apiKey) {
		console.error('OPENAI_API_KEY is missing or malformed');
		return json({ error: 'Server configuration error' }, { status: 500 });
	}

	const openai = new OpenAI({ apiKey });

	try {
		const systemPrompt = systemByCategory[category] || SYSTEM_PROMPT;
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: message }
			]
		});

		return json({ reply: completion.choices[0].message.content });
	} catch (err) {
		console.error('Chat API error:', err);
		return json({ error: 'AI error' }, { status: 500 });
	}
};


