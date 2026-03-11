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
Samtalsstil:
- Undvik att alltid borja svar med frasen "Det later som att".
- Variera oppningen sa att svaren kanns naturliga och manskliga.
- Undvik generiska formuleringar som upprepas i varje svar.
- Behall ett lugnt och respektfullt tonlage.
- Hall svaren korta och jordnara.
- Hellre ett kort, varmt svar an ett langt forklarande svar.

Variation och upprepning:
- Undvik att upprepa samma oppningsfraser i flera svar i rad.
- Undvik exakt samma bekraftande formuleringar om och om igen.
- Om du nyligen har speglat pa ett visst satt, uttryck det mer naturligt och varierat nasta gang.
- Upprepa inte samma fraga i olika ord om anvandaren redan har fatt den.
- Variera sarskilt oppningar, bekraftelser, overgangar till fraga och formuleringar om kanslor.
- Undvik att svaren kanns mallade, cirkulara eller alltid foljer exakt samma struktur.
- Halla variationen lugn, varm, enkel och icke-klinisk.
- Variation far inte gora svaret mer avancerat, mer kliniskt eller mer pratigt.
- Om anvandaren skriver kort flera ganger i rad: hall svaret kort och fyll inte ut med omskrivningar.
- Om anvandaren aterkommer till samma kansla: bekrafta varsamt, men med ny formulering.

Nar anvandaren beskriver stress, oro eller trotthet:
- Spegla bade kanslan och kroppens upplevelse.
- Anvand enkla, konkreta formuleringar.
- Svara som en lugn person som sitter bredvid och lyssnar.
- Fokusera pa tempo, andning, trotthet, spanning i kroppen och kanslan av att halla ihop mycket.
- Undvik analys av varfor personen mar sa.
- Undvik psykologiska teorier.
- Ge inte instruktioner eller tekniker om anvandaren inte sjalv ber om det.
- Vid stark stress: sank tempot, skriv kortare meningar och undvik for mycket information i samma svar.
- Prioritera narvaro, enkelhet och lugn ton.
- Exempel pa naturliga oppningar:
  "Det verkar som att du bar mycket just nu."
  "Det later tungt att ha det sa."
  "Nar kroppen gar pa hogvarv sa dar kan det bli valdigt utmattande."
  "Det kanns som att du forsoker halla ihop mycket samtidigt."
  "Att forsoka halla ihop allt sa lange kan verkligen ta mycket energi."
  "Det kan vara valdigt trottande nar kroppen inte riktigt slapper taget."
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

const CHAT_MODEL = 'gpt-5.4';

const systemByCategory: Record<string, string> = {
	A: `${SYSTEM_PROMPT}\nFokusera varsamt på ångest och oro med stabiliserande, jordande språk.`,
	B: `${SYSTEM_PROMPT}\nFokusera varsamt på nedstämdhet med hoppfull men realistisk ton, utan att bagatellisera.`,
	E: `${SYSTEM_PROMPT}\nFokusera varsamt på trauma med extra försiktighet, undvik detaljer som kan återaktivera stark stress.`
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GUEST_ID_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;

type SupportCategory = 'A' | 'B' | 'E';

type ConversationRow = {
	id: string;
	user_id: string;
	category: string | null;
};

type GuestConversationRow = {
	id: string;
	guest_id: string;
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

function normalizeGuestId(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed || !GUEST_ID_REGEX.test(trimmed)) return null;
	return trimmed;
}

function buildConversationTitle(input: string): string {
	const normalized = input.trim().replace(/\s+/g, ' ');
	if (!normalized) return 'Samtal';

	const firstWords = normalized.split(' ').slice(0, 8).join(' ');
	return firstWords.slice(0, 60).trim() || 'Samtal';
}

const normalizeApiKey = (value: string | undefined): string | null => {
	if (!value) return null;

	const normalized = value
		.trim()
		.replace(/^['"]|['"]$/g, '')
		.replace(/^Bearer\s+/i, '')
		.replace(/\s+/g, '');

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
		guestId?: unknown;
	};

	const message = typeof body.message === 'string' ? body.message.trim() : '';
	if (!message) {
		return errorResponse('No message provided', 400);
	}

	const MAX_MESSAGE_LENGTH = 2000;
	if (message.length > MAX_MESSAGE_LENGTH) {
		return errorResponse('Message too long.', 400);
	}

	const token = getAccessToken(request.headers.get('authorization'));
	const guestId = normalizeGuestId(body.guestId);

	if (!token && !guestId) {
		return errorResponse('Missing auth. Provide either bearer token or guestId.', 401);
	}

	const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY.');
		return errorResponse('Server configuration error', 500);
	}

	const apiKey = normalizeApiKey(env.OPENAI_API_KEY);
	if (!apiKey) {
		console.error('OPENAI_API_KEY is missing or malformed');
		return errorResponse('Server configuration error', 500);
	}

	const openai = new OpenAI({ apiKey });

	const authClient = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
	});

	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
	const serviceClient =
		serviceRoleKey
			? createClient(supabaseUrl, serviceRoleKey, {
					auth: { autoRefreshToken: false, persistSession: false }
			  })
			: null;

	try {
		let category = normalizeCategory(body.category);
		let conversationId = normalizeConversationId(body.conversationId);

		// INLOGGAD ANVÄNDARE
		if (token) {
			const {
				data: { user },
				error: userError
			} = await authClient.auth.getUser();

			if (userError || !user) {
				return errorResponse('Unauthorized.', 401);
			}

			if (conversationId) {
				const { data: existingConversation, error: existingConversationError } = await authClient
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
				const title = buildConversationTitle(message);

				let { data: createdConversation, error: createConversationError } = await authClient
					.from('conversations')
					.insert({
						user_id: user.id,
						category,
						title
					})
					.select('id')
					.single();

				const missingTitleColumn =
					createConversationError?.code === 'PGRST204' ||
					createConversationError?.code === '42703' ||
					(createConversationError?.message ?? '').toLowerCase().includes('title');

				if (missingTitleColumn) {
					const retry = await authClient
						.from('conversations')
						.insert({
							user_id: user.id,
							category
						})
						.select('id')
						.single();

					createdConversation = retry.data;
					createConversationError = retry.error;
				}

				if (createConversationError || !createdConversation) {
					console.error('Failed to create conversation:', createConversationError);
					if (createConversationError?.code === '42501') {
						return errorResponse('Not allowed to create conversation.', 403);
					}
					return errorResponse('Could not create conversation.', 500);
				}

				conversationId = createdConversation.id as string;
			}

			const { data: previousMessages, error: previousMessagesError } = await authClient
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

			const { error: userMessageError } = await authClient.from('messages').insert({
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
				model: CHAT_MODEL,
				temperature: 0.75,
				max_tokens: 350,
				frequency_penalty: 0.3,
				presence_penalty: 0.2,
				messages: [
					{ role: 'system', content: systemPrompt },
					...promptHistory,
					{ role: 'user', content: message }
				]
			});

			const reply = completion.choices[0]?.message?.content?.trim() ?? 'Något gick fel.';

			const { error: assistantMessageError } = await authClient.from('messages').insert({
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

			return json({
				reply,
				conversationId,
				mode: 'user'
			});
		}

		// GÄSTANVÄNDARE
		if (!guestId) {
			return errorResponse('Missing guestId.', 400);
		}

		if (!serviceClient) {
			console.error('SUPABASE_SERVICE_ROLE_KEY is missing.');
			return errorResponse('Server configuration error', 500);
		}

		if (conversationId) {
			const { data: existingConversation, error: existingConversationError } = await serviceClient
				.from('guest_conversations')
				.select('id, guest_id, category')
				.eq('id', conversationId)
				.eq('guest_id', guestId)
				.maybeSingle();

			if (existingConversationError) {
				console.error('Failed to verify guest conversation:', existingConversationError);
				return errorResponse('Could not validate guest conversation.', 500);
			}

			if (!existingConversation) {
				return errorResponse('Guest conversation not found.', 403);
			}

			const conversation = existingConversation as GuestConversationRow;
			category = normalizeCategory(conversation.category);
		} else {
			const title = buildConversationTitle(message);

			let { data: createdConversation, error: createConversationError } = await serviceClient
				.from('guest_conversations')
				.insert({
					guest_id: guestId,
					category,
					title
				})
				.select('id')
				.single();

			const missingTitleColumn =
				createConversationError?.code === 'PGRST204' ||
				createConversationError?.code === '42703' ||
				(createConversationError?.message ?? '').toLowerCase().includes('title');

			if (missingTitleColumn) {
				const retry = await serviceClient
					.from('guest_conversations')
					.insert({
						guest_id: guestId,
						category
					})
					.select('id')
					.single();

				createdConversation = retry.data;
				createConversationError = retry.error;
			}

			if (createConversationError || !createdConversation) {
				console.error('Failed to create guest conversation:', createConversationError);
				return errorResponse('Could not create guest conversation.', 500);
			}

			conversationId = createdConversation.id as string;
		}

		const { data: previousMessages, error: previousMessagesError } = await serviceClient
			.from('guest_messages')
			.select('role, content')
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true })
			.limit(20);

		if (previousMessagesError) {
			console.error('Failed to load guest conversation history:', previousMessagesError);
			return errorResponse('Could not load guest conversation history.', 500);
		}

		const { error: guestMessageError } = await serviceClient.from('guest_messages').insert({
			conversation_id: conversationId,
			role: 'user',
			content: message
		});

		if (guestMessageError) {
			console.error('Failed to save guest message:', guestMessageError);
			return errorResponse('Could not save guest message.', 500);
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
			model: CHAT_MODEL,
			temperature: 0.75,
			max_tokens: 350,
			frequency_penalty: 0.3,
			presence_penalty: 0.2,
			messages: [
				{ role: 'system', content: systemPrompt },
				...promptHistory,
				{ role: 'user', content: message }
			]
		});

		const reply = completion.choices[0]?.message?.content?.trim() ?? 'Något gick fel.';

		const { error: assistantMessageError } = await serviceClient.from('guest_messages').insert({
			conversation_id: conversationId,
			role: 'assistant',
			content: reply
		});

		if (assistantMessageError) {
			console.error('Failed to save guest assistant message:', assistantMessageError);
			return errorResponse('Could not save guest assistant message.', 500);
		}

		return json({
			reply,
			conversationId,
			mode: 'guest',
			guestId
		});
	} catch (err) {
		console.error('Chat API error:', err);
		return errorResponse('AI error', 500);
	}
};
