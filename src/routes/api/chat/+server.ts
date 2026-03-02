import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';
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

Avslutsregel:
- Du behöver inte alltid ställa en fråga.
- Om samtalet känns färdigt i stunden, avsluta mjukt.
- Lämna utrymme utan att pressa vidare.
- Exempel:
  "Jag är här om du vill fortsätta."
  "Vi kan stanna där en stund."
  "Du behöver inte säga mer just nu."

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SupportCategory = 'A' | 'B' | 'E';
type ConversationRow = {
	id: string;
	user_id: string;
	category: string | null;
};
type StoredMessageRow = {
	role: string | null;
	content: string | null;
};

function errorResponse(message: string, status: number) {
	return json({ error: message }, { status });
}

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;

	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) {
		return null;
	}

	return token.trim();
}

function normalizeCategory(value: unknown): SupportCategory {
	const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
	if (normalized === 'B') return 'B';
	if (normalized === 'E') return 'E';
	return 'A';
}

function normalizeConversationId(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed || !UUID_REGEX.test(trimmed)) return null;
	return trimmed;
}

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
		message?: unknown;
		category?: unknown;
		conversationId?: unknown;
	};
	const message = typeof body.message === 'string' ? body.message.trim() : '';
	if (!message) {
		return errorResponse('No message provided', 400);
	}

	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return errorResponse('Missing or invalid Authorization header.', 401);
	}

	const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY.');
		return errorResponse('Server configuration error', 500);
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

	const apiKey = normalizeApiKey(env.OPENAI_API_KEY);
	if (!apiKey) {
		console.error('OPENAI_API_KEY is missing or malformed');
		return errorResponse('Server configuration error', 500);
	}

	const openai = new OpenAI({ apiKey });

	try {
		let category = normalizeCategory(body.category);
		let conversationId = normalizeConversationId(body.conversationId);

		if (conversationId) {
			const { data: existingConversation, error: existingConversationError } = await supabase
				.from('conversations')
				.select('id, user_id, category')
				.eq('id', conversationId)
				.eq('user_id', user.id)
				.maybeSingle();

			if (existingConversationError) {
				console.error('Failed to verify conversation:', existingConversationError);
				if (existingConversationError.code === '42501') {
					return errorResponse('Not allowed to access this conversation.', 403);
				}
				return errorResponse('Could not validate conversation.', 500);
			}

			if (!existingConversation) {
				return errorResponse('Conversation not found for this user.', 403);
			}

			const conversation = existingConversation as ConversationRow;
			category = normalizeCategory(conversation.category);
		} else {
			const { data: createdConversation, error: createConversationError } = await supabase
				.from('conversations')
				.insert({
					user_id: user.id,
					category
				})
				.select('id')
				.single();

			if (createConversationError || !createdConversation) {
				console.error('Failed to create conversation:', createConversationError);
				if (createConversationError?.code === '42501') {
					return errorResponse('Not allowed to create conversation.', 403);
				}
				return errorResponse('Could not create conversation.', 500);
			}

			conversationId = createdConversation.id as string;
		}

		const { data: previousMessages, error: previousMessagesError } = await supabase
			.from('messages')
			.select('role, content')
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true })
			.limit(20);

		if (previousMessagesError) {
			console.error('Failed to load conversation history:', previousMessagesError);
			if (previousMessagesError.code === '42501') {
				return errorResponse('Not allowed to read conversation history.', 403);
			}
			return errorResponse('Could not load conversation history.', 500);
		}

		const { error: userMessageError } = await supabase.from('messages').insert({
			conversation_id: conversationId,
			role: 'user',
			content: message
		});

		if (userMessageError) {
			console.error('Failed to save user message:', userMessageError);
			if (userMessageError.code === '42501') {
				return errorResponse('Not allowed to save message.', 403);
			}
			return errorResponse('Could not save message.', 500);
		}

		const promptHistory = (previousMessages ?? [])
			.filter(
				(row): row is StoredMessageRow =>
					(row.role === 'user' || row.role === 'assistant') &&
					typeof row.content === 'string' &&
					row.content.trim().length > 0
			)
			.map((row) => ({
				role: row.role as 'user' | 'assistant',
				content: row.content as string
			}));

		const systemPrompt = systemByCategory[category] || SYSTEM_PROMPT;
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			temperature: 0.75,
			top_p: 1,
			frequency_penalty: 0.3,
			presence_penalty: 0.2,
			messages: [
				{ role: 'system', content: systemPrompt },
				...promptHistory,
				{ role: 'user', content: message }
			]
		});

		const reply = completion.choices[0]?.message?.content?.trim() ?? 'Något gick fel.';
		const { error: assistantMessageError } = await supabase.from('messages').insert({
			conversation_id: conversationId,
			role: 'assistant',
			content: reply
		});

		if (assistantMessageError) {
			console.error('Failed to save assistant message:', assistantMessageError);
			if (assistantMessageError.code === '42501') {
				return errorResponse('Not allowed to save message.', 403);
			}
			return errorResponse('Could not save message.', 500);
		}

		return json({ reply, conversationId });
	} catch (err) {
		console.error('Chat API error:', err);
		return errorResponse('AI error', 500);
	}
};
