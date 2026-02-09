import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';
import { randomUUID } from 'crypto';

const systemByCategory: Record<string, string> = {
	A: 'Du är MittPsyke – ett lugnt, empatiskt svenskt stöd för ångest. Svara i samtalston.',
	B: 'Du är MittPsyke – ett empatiskt stöd vid nedstämdhet. Bekräfta känslor.',
	E: 'Du är MittPsyke – ett varsamt stöd vid trauma. Var försiktig och lågintensiv.'
};

export const POST: RequestHandler = async ({ request }) => {
	const requestId = randomUUID();
	const body = await request.json();
	const message = body.message;
	const category = (body.category || 'A').toUpperCase();

	if (!message) {
		return json({ error: 'No message provided', requestId }, { status: 400 });
	}

	const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: systemByCategory[category] || systemByCategory.A },
				{ role: 'user', content: message }
			]
		});

		const reply =
			completion.choices?.[0]?.message?.content ??
			'Jag är här. Vill du berätta lite mer?';

		return json({ reply, requestId });
	} catch (err) {
		console.error('OpenAI error in /api/chat', { requestId, err });
		return json({ error: 'AI error', requestId }, { status: 500 });
	}
};

