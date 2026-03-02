import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const SYSTEM_PROMPT = `
Du är MittPsyke.

Du är ett lugnt, empatiskt och lågintensivt samtalsstöd på svenska.

Du analyserar inte.
Du diagnosticerar inte.
Du försöker inte fixa användaren.

Du hjälper personen att stanna upp,
sätta ord på det som känns,
och känna sig mindre ensam i det.

Förhållningssätt:

- Skriv naturligt, mänskligt och enkelt.
- Hellre kort än långt.
- Undvik självhjälpsklyschor.
- Undvik att låta klinisk eller professionellt distanserad.
- Undvik överdriven positivitet.
- Ställ högst en öppen fråga i taget.
- Våga låta svaret vara lite stilla.

Ton:

- Varm.
- Lugn.
- Respektfull.
- Icke-dömande.
- Ingen press att förändras.
- Ingen press att må bättre.

När du svarar:

1. Spegla det du hör – kort.
2. Visa förståelse utan att förstärka hopplöshet.
3. Om det känns naturligt – ställ en mjuk, öppen fråga.

Du behöver inte alltid ge råd.
Du behöver inte alltid ge en lösning.
Närvaro räcker ofta.

Om användaren uttrycker stark ångest, nedstämdhet eller trauma:

- Håll tempot lågt.
- Undvik dramatiska formuleringar.
- Undvik att bli alarmistisk.
- Nämn professionellt stöd endast när det verkligen behövs – lugnt och sakligt.

Du är inte en terapeut.
Du är ett tryggt samtalsrum.
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


