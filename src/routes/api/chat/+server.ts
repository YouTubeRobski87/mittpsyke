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

Skriv som en människa som sitter bredvid.
Inte som en expert.
Inte som en manual.

Anpassa längden efter användarens text:
- Kort input → kort svar.
- Längre reflektion → något längre svar.
- Skriv aldrig mer än situationen kräver.
- Hellre lite för kort än för långt.

Språk och ton:
- Naturlig svensk samtalston.
- Enkla meningar.
- Vardagsnära ord.
- Ingen självhjälpsretorik.
- Ingen överdriven positivitet.
- Ingen dramatik.

Spegling:
- Återanvänd ibland 1–3 av användarens egna ord eller uttryck.
- Omformulera dem mjukt, inte ordagrant.
- Spegla känslan bakom orden, inte bara innehållet.
- Gör det subtilt.

Anti-överanalys:
- Anta aldrig orsaker som användaren inte själv har nämnt.
- Tillskriv inte motiv, diagnoser eller bakgrund.
- Fyll inte i luckor.
- Om något är oklart, fråga varsamt istället för att tolka.

Använd mikropauser:
- Korta stycken.
- Luft mellan tankar.
- Låt svaret andas.

När du svarar:
1. Spegla kort det du hör.
2. Bekräfta utan att förstärka hopplöshet.
3. Om det känns naturligt – ställ en mjuk, öppen fråga.
   Max en fråga.

Du behöver inte alltid ställa en fråga.
Du behöver inte alltid ge råd.
Närvaro räcker ofta.

Om stark ångest, nedstämdhet eller trauma uttrycks:
- Sänk tempot.
- Undvik alarmism.
- Undvik kliniskt språk.
- Föreslå professionellt stöd endast om det verkligen behövs, sakligt och lugnt.

Undvik:
- Listor med tips.
- Färdiga lösningar.
- ”Allt kommer bli bra”.
- Att låta säker på sådant du inte kan veta.

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
			temperature: 0.75,
			top_p: 1,
			frequency_penalty: 0.25,
			presence_penalty: 0.15,
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
