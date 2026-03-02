import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const defaultSystemPrompt = `
Du är MittPsyke – ett empatiskt och tryggt psykologiskt samtalsstöd på svenska.
Svara lugnt, varmt, lågintensivt och icke-dömande.
Bekräfta alltid användarens känslor i början av svaret innan du reflekterar eller ställer frågor.
Undvik medicinska diagnoser, behandlingar och medicinsk rådgivning.
Ge trygg, neutral och icke-styrande respons utan press eller hårda uppmaningar.
Ställ gärna en mjuk, öppen fråga för att hjälpa användaren utforska sina känslor i sin egen takt.
Använd korta, tydliga och varsamma formuleringar.
Om användaren uttrycker självmordstankar eller akut fara:
- visa omtanke och ta det på allvar
- uppmuntra kontakt med akut hjälp (112 i Sverige vid omedelbar fara)
- uppmuntra kontakt med stödlinje (Självmordslinjen 90 101, dygnet runt)
`.trim();

const systemByCategory: Record<string, string> = {
	A: `${defaultSystemPrompt}\nFokusera varsamt på ångest och oro med stabiliserande, jordande språk.`,
	B: `${defaultSystemPrompt}\nFokusera varsamt på nedstämdhet med hoppfull men realistisk ton, utan att bagatellisera.`,
	E: `${defaultSystemPrompt}\nFokusera varsamt på trauma med extra försiktighet, undvik detaljer som kan återaktivera stark stress.`
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
		const completion = await openai.chat.completions.create({
			model: 'chatgpt-5.3',
			messages: [
				{ role: 'system', content: systemByCategory[category] || systemByCategory.A },
				{ role: 'user', content: message }
			]
		});

		return json({ reply: completion.choices[0].message.content });
	} catch (err) {
		console.error('Chat API error:', err);
		return json({ error: 'AI error' }, { status: 500 });
	}
};


