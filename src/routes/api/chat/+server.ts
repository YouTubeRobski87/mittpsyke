import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { CHAT_CONTEXT_LIMIT, getChatContextMessages } from '$lib/state/chat-memory';
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
- Varm men saklig svenska.
- Undvik överpersonlig ton.
- Inga emojis.
- Ingen kompis-slang.
- Undvik överdriven AI-empati.
Samtalsstil:

- Undvik att alltid börja svar med frasen "Det låter som att".
- Variera öppningen så att svaren känns mer naturliga.
- Om användaren skriver en metakommentar, skepticism eller testar svaret (t.ex. om det känns generiskt/fallback):
  - Svara rakt och konkret först.
  - Håll svaret extra kort.
  - Bekräfta kommentaren kort utan att gå in i djup tolkning.
  - Undvik relationell tolkning om "vad som händer mellan användaren och svaret".
  - Undvik litterära eller överformulerade formuleringar.
  - Erbjud att fortsätta mer direkt om användaren vill.
  - Tolka inte underliggande emotionell betydelse i första ledet.

När användaren beskriver stress, oro eller trötthet:
- Spegla både känslan och kroppens upplevelse.
- Använd enkla och konkreta formuleringar.

Exempel på naturliga öppningar:

"Det verkar som att du bär mycket just nu."
"När kroppen går på högvarv så där kan det bli väldigt utmattande."
"Det låter tungt att ha allt det där på en gång."
"Att försöka hålla ihop allt kan verkligen ta mycket energi."

Variation och upprepning:

- Undvik att upprepa samma öppningsfraser i flera svar i rad.
- Undvik att använda exakt samma bekräftande formuleringar om och om igen.
- Låt svaren kännas mindre mallade.

Hellre ett kort, varmt svar än ett långt förklarande svar.
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

Samtalsutveckling (retention):
- Efter 2–3 svar kan du ställa en enkel riktning framåt, neutralt och utan press.
- Exempel: "Vill du reda ut det mer, eller bara skriva av dig en stund?"
- Max en fråga per svar.
- Inga flera frågor i samma svar.

Struktur vid röriga beskrivningar:
- Om användaren beskriver många saker samtidigt: dela varsamt upp i max 3 korta delar.
- Håll formuleringarna korta och konkreta.
- Ingen diagnos, ingen djupanalys.
- Fråga sedan kort om användaren vill ta en del i taget.

Mikro-retention:
- Efter några svar kan du ibland lägga in en lugn fortsättningsrad utan uppmaning.
- Exempel:
  "Vi kan fortsätta i det här i din takt."
  "Vi kan ta en del i taget om du vill."

Koppling till dagbok (valbar):
- Endast ibland och bara när något konkret har formulerats.
- Fråga i så fall kort: "Vill du spara det här som en anteckning?"
- Upprepa inte i varje svar.

Avslutsregel:
- Du behöver inte alltid ställa en fråga.
- Om samtalet känns färdigt i stunden, avsluta mjukt.
- Lämna utrymme utan att pressa vidare.
- Exempel:
  "Jag är här om du vill fortsätta."
  "Vi kan stanna där en stund."
  "Du behöver inte säga mer just nu."

FASMODELL (följ alltid ordningen):

FAS 1 (svar 1–2):
- Spegla och validera.
- Håll låg intensitet.
- Max en mjuk fråga.
- Inga råd.
- Inga tipslistor.
- Inga handlingsplaner.
- Inga orsaksantaganden.
- Inga diagnosliknande tolkningar.
- Inga flera frågor i samma svar.
- Första svaret ska vara 1–2 korta stycken och max 90 ord.

FAS 2 (fortsatt utforskning):
- Hjälp användaren sortera upplevelsen.
- En enkel dimension i taget.
- Exempel: vad känns mest just nu, när blir det som tyngst, vad märks först.
- Fortsätt med låg intensitet.

FAS 3 (små nästa steg):
- Erbjud små nästa steg först när användaren signalerar beredskap eller efter minst två rundor utforskning.
- Ge högst ett konkret förslag i taget.
- Använd tillåtande språk, till exempel: "om du vill kan vi...".

Om stark ångest, nedstämdhet eller trauma uttrycks:
- Sänk tempot.
- Undvik alarmism.
- Undvik kliniskt språk.
- Om användaren verkar vara i akut kris – påminn lugnt om att ringa 112 eller Mind Självmordslinjen (90101).

Undvik:
- Listor med tips.
- Färdiga lösningar.
- "Allt kommer bli bra".
- Att låta säker på sådant du inte kan veta.
- Checklistor eller flera steg i samma svar.
- Övercoachande ton.
- Upprepning av samma fråga.
- Tidig analys innan användaren hunnit berätta.

Du är inte en terapeut.
Du är ett tryggt samtalsrum.
`.trim();

// ---------------------------------------------------------------------------
// Krisorddetektering – körs alltid FÖRE AI-anrop
// ---------------------------------------------------------------------------
const CRISIS_PATTERNS = [
	/självmord/i,
	/ta livet av (mig|sig|oss|dig)/i,
	/avsluta (mitt|sitt|livet|allt)/i,
	/inte orkar leva/i,
	/orkar inte leva/i,
	/vill inte leva/i,
	/vill (bara |helst )?(dö|vara död)/i,
	/hoppas att jag dör/i,
	/bättre om jag (var|vore) död/i,
	/ingen anledning att leva/i,
	/suicid/i,
	/självskad/i,
	/skada mig (själv)?/i,
	/hoppa (från|av|ner)/i,
	/inte vilja finnas/i,
	/försvinna för alltid/i,
	/ge upp (allt|livet|hoppet)/i,
	/inget hopp/i,
	/ingen mening (med|att leva)/i,
	/alla vore bättre utan mig/i,
	/ingen (saknar|behöver|bryr sig om) mig/i,
	/ta (tabletter|piller|överdos)/i,
	/lagt en plan/i,
	/skriva (ett )?avskedsbrev/i,
	/inte vakna (imorgon|igen|upp)/i,
	/somna (in )?för alltid/i,
	/göra slut på (allt|det här|mitt liv)/i,
	/kan inte fortsätta/i,
	/sista (utvägen|chansen)/i
];

function detectCrisis(text: string): boolean {
	return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

const CRISIS_RESPONSE = `Det du skriver rör mig, och jag vill att du vet att du inte är ensam just nu.

Det här är inte rätt plats för akut hjälp – men det finns människor som kan vara där för dig:

**Ring 112** om du befinner dig i omedelbar fara.

**Mind Självmordslinjen** – ring 90101, öppen dygnet runt.

**1177** – för råd och vägledning om psykisk hälsa och vård.

**Stödlinjer.se** – lista över fler stödlinjer och chattar.

Jag finns kvar här om du vill prata vidare, men vid akut kris är en riktig människa viktigast just nu.`;
// ---------------------------------------------------------------------------

const CHAT_MODEL = (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim();

function logOpenAIError(context: { guest: boolean; category: SupportCategory; conversationId: string }, err: unknown) {
	const openaiError = err as {
		message?: string;
		status?: number;
		code?: string;
		type?: string;
		error?: unknown;
	};

	console.error('OpenAI completion failed', {
		model: CHAT_MODEL,
		guest: context.guest,
		category: context.category,
		conversationId: context.conversationId,
		status: openaiError?.status ?? null,
		code: openaiError?.code ?? null,
		type: openaiError?.type ?? null,
		message: openaiError?.message ?? String(err),
		error: openaiError?.error ?? null
	});
}

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

type PromptHistoryMessage = {
	role: 'user' | 'assistant';
	content: string;
};

const GUEST_CONVERSATIONS_TABLE = 'guest_conversations';
const GUEST_MESSAGES_TABLE = 'guest_messages';
const MAX_CHAT_MESSAGE_LENGTH = 2000;
const CHAT_MESSAGE_TOO_LONG_ERROR = 'Din text blev lite för lång att skicka på en gång. Dela gärna upp den i två delar.';

function buildDynamicSystemPrompt(category: SupportCategory, history: PromptHistoryMessage[]) {
	const basePrompt = systemByCategory[category] || SYSTEM_PROMPT;
	const userTurns = history.filter((item) => item.role === 'user').length;
	const nextAssistantTurn = userTurns + 1;
	const isFirstPhase = nextAssistantTurn <= 2;
	const isSecondPhase = nextAssistantTurn >= 3 && nextAssistantTurn <= 4;
	const shouldOfferDirection = nextAssistantTurn >= 3 && nextAssistantTurn <= 4;
	const shouldUseMicroRetention = nextAssistantTurn >= 4;
	const shouldOfferNote = nextAssistantTurn >= 5;
	const phaseInstruction = isFirstPhase
		? `Aktuell fas: FAS 1.
Det här svaret är i början av samtalet. Svara kort, lugnt och icke-kliniskt.
Det här svaret får inte innehålla råd, problemlösning, listor, handlingsplaner eller orsaksanalys.
Ställ högst en mjuk fråga.`
		: isSecondPhase
			? `Aktuell fas: FAS 2.
Fortsätt utforska och hjälp användaren sortera upplevelsen i små delar, en dimension i taget.
Om användaren beskriver mycket på en gång, dela upp i max 3 korta delar och fråga om ni ska ta en del först.
Undvik att gå till handlingsplan ännu om användaren inte tydligt ber om det.`
			: `Aktuell fas: FAS 3.
Du kan erbjuda ett litet nästa steg om användaren verkar redo.
Ge i så fall högst ett konkret förslag och formulera det tillåtande ("om du vill kan vi...").`;

	const retentionInstructions: string[] = [];
	if (shouldOfferDirection) {
		retentionInstructions.push(
			'Efter 2–3 svar: ställ vid behov EN enkel riktning framåt, neutralt och tillåtande, till exempel "Vill du reda ut det mer, eller bara skriva av dig en stund?".'
		);
	}
	if (shouldUseMicroRetention) {
		retentionInstructions.push(
			'Lägg vid behov in en kort, mjuk fortsättningsrad utan call-to-action-känsla, till exempel "Vi kan fortsätta i det här i din takt."'
		);
	}
	if (shouldOfferNote) {
		retentionInstructions.push(
			'Endast ibland och när något konkret formulerats: erbjud kort "Vill du spara det här som en anteckning?"'
		);
	}
	const retentionInstructionBlock =
		retentionInstructions.length > 0 ? `\n${retentionInstructions.join('\n')}` : '';

	if (history.length === 0) {
		return `${basePrompt}

Det här är första gången du pratar med den här användaren. Välkomna dem varmt.
${phaseInstruction}${retentionInstructionBlock}`.trim();
	}

	return `${basePrompt}

Konversationen pågår redan – användaren har skickat meddelanden tidigare i denna session.
Svara direkt på det senaste meddelandet utan att hälsa, presentera dig eller sammanfatta vad ni pratat om.
Använd ALDRIG fraser som "Hej igen", "Jag minns att vi pratade om...", "Vill du att vi börjar om?" eller liknande återöppningsfraser mitt i en pågående konversation.
${phaseInstruction}${retentionInstructionBlock}`.trim();
}

function errorResponse(message: string, status: number, details: Record<string, unknown> = {}) {
	return json({ error: message, ...details }, { status });
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
	if (!hasSensitiveConsentHeader(request)) {
		return errorResponse('Consent required for sensitive AI features.', 403);
	}

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
		contextMessages?: unknown;
	};

	const message = typeof body.message === 'string' ? body.message.trim() : '';
	if (!message) {
		return errorResponse('No message provided', 400);
	}

	const contextMessages = getChatContextMessages(body.contextMessages, CHAT_CONTEXT_LIMIT);

	if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
		return errorResponse(CHAT_MESSAGE_TOO_LONG_ERROR, 413, {
			code: 'MESSAGE_TOO_LONG',
			maxLength: MAX_CHAT_MESSAGE_LENGTH
		});
	}

	const token = getAccessToken(request.headers.get('authorization'));
	const guestId = normalizeGuestId(body.guestId);
	const isGuestRequest = !token;

	// ---------------------------------------------------------------------------
	// Krischeck – avbryt AI-anrop och returnera säkerhetssvar om riskord hittas
	// ---------------------------------------------------------------------------
	if (detectCrisis(message)) {
		console.warn('[chat] crisis keywords detected', {
			guest: isGuestRequest,
			messageLength: message.length
		});
		return json({
			reply: CRISIS_RESPONSE,
			crisis: true,
			conversationId: null,
			mode: isGuestRequest ? 'guest' : 'user'
		});
	}
	// ---------------------------------------------------------------------------

	if (isGuestRequest) {
		console.info('[chat][guest] request identified as guest', {
			hasToken: Boolean(token),
			bodyFields: {
				message: typeof body.message === 'string' ? `string(${body.message.trim().length})` : typeof body.message,
				category: typeof body.category === 'string' ? body.category : typeof body.category,
				conversationId: typeof body.conversationId === 'string' ? body.conversationId : typeof body.conversationId,
				guestId: typeof body.guestId === 'string' ? `string(${body.guestId.trim().length})` : typeof body.guestId
			},
			normalized: {
				guestIdPresent: Boolean(guestId),
				conversationIdPresent: Boolean(normalizeConversationId(body.conversationId))
			}
		});
	}

	if (!token && !guestId) {
		console.warn('[chat][guest] missing required auth field', {
			required: 'guestId',
			rawGuestIdType: typeof body.guestId
		});
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
				}))
				.slice(-CHAT_CONTEXT_LIMIT);

			const modelContext =
				contextMessages.length > 0
					? contextMessages.map((row) => ({
							role: row.role,
							content: row.content
						}))
					: promptHistory;

			const systemPrompt = buildDynamicSystemPrompt(category, modelContext);
			let completion;
			try {
				completion = await openai.chat.completions.create({
					model: CHAT_MODEL,
					temperature: 0.75,
					max_completion_tokens: 500,
					frequency_penalty: 0.3,
					presence_penalty: 0.2,
					messages: [
						{ role: 'system', content: systemPrompt },
						...modelContext,
						{ role: 'user', content: message }
					]
				});
			} catch (openaiError) {
				logOpenAIError({ guest: false, category, conversationId }, openaiError);
				throw openaiError;
			}

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
			console.warn('[chat][guest] missing required field', {
				required: 'guestId',
				rawGuestIdType: typeof body.guestId
			});
			return errorResponse('Missing guestId.', 400);
		}

		const guestDbClient = serviceClient ?? authClient;
		console.info('[chat][guest] supabase client initialized', {
			hasServiceRoleKey: Boolean(serviceRoleKey),
			mode: serviceClient ? 'service_role' : 'anon_fallback'
		});

		if (conversationId) {
			const { data: existingConversation, error: existingConversationError } = await guestDbClient
				.from(GUEST_CONVERSATIONS_TABLE)
				.select('id, guest_id, category')
				.eq('id', conversationId)
				.eq('guest_id', guestId)
				.maybeSingle();

			if (existingConversationError) {
				console.error('[chat][guest] DB operation failed: verify guest conversation', existingConversationError);
				return errorResponse('Could not validate guest conversation.', 500);
			}

			if (!existingConversation) {
				console.warn('[chat][guest] conversationId not found for guest, creating a new one', {
					conversationId,
					guestId
				});
				conversationId = null;
			} else {
				const conversation = existingConversation as GuestConversationRow;
				category = normalizeCategory(conversation.category);
			}
		}

		if (!conversationId) {
			const title = buildConversationTitle(message);

			let { data: createdConversation, error: createConversationError } = await guestDbClient
				.from(GUEST_CONVERSATIONS_TABLE)
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
				const retry = await guestDbClient
					.from(GUEST_CONVERSATIONS_TABLE)
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
				console.error('[chat][guest] DB operation failed: create guest conversation', createConversationError);
				return errorResponse('Could not create guest conversation.', 500);
			}

			conversationId = createdConversation.id as string;
		}

		const { data: previousMessages, error: previousMessagesError } = await guestDbClient
			.from(GUEST_MESSAGES_TABLE)
			.select('role, content')
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true })
			.limit(20);

		if (previousMessagesError) {
			console.error('[chat][guest] DB operation failed: load guest conversation history', previousMessagesError);
			return errorResponse('Could not load guest conversation history.', 500);
		}

		const { error: guestMessageError } = await guestDbClient.from(GUEST_MESSAGES_TABLE).insert({
			conversation_id: conversationId,
			role: 'user',
			content: message
		});

		if (guestMessageError) {
			console.error('[chat][guest] DB operation failed: save guest user message', guestMessageError);
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
			}))
			.slice(-CHAT_CONTEXT_LIMIT);

		const modelContext =
			contextMessages.length > 0
				? contextMessages.map((row) => ({
						role: row.role,
						content: row.content
					}))
				: promptHistory;

		const systemPrompt = buildDynamicSystemPrompt(category, modelContext);
		let completion;
		try {
			completion = await openai.chat.completions.create({
				model: CHAT_MODEL,
				temperature: 0.75,
				max_completion_tokens: 500,
				frequency_penalty: 0.3,
				presence_penalty: 0.2,
				messages: [
					{ role: 'system', content: systemPrompt },
					...modelContext,
					{ role: 'user', content: message }
				]
			});
		} catch (openaiError) {
			logOpenAIError({ guest: true, category, conversationId }, openaiError);
			throw openaiError;
		}

		const reply = completion.choices[0]?.message?.content?.trim() ?? 'Något gick fel.';

		const { error: assistantMessageError } = await guestDbClient.from(GUEST_MESSAGES_TABLE).insert({
			conversation_id: conversationId,
			role: 'assistant',
			content: reply
		});

		if (assistantMessageError) {
			console.error('[chat][guest] DB operation failed: save guest assistant message', assistantMessageError);
			return errorResponse('Could not save guest assistant message.', 500);
		}

		return json({
			reply,
			conversationId,
			mode: 'guest',
			guestId
		});
	} catch (err) {
		if (!token) {
			console.error('[chat][guest] catch error object:', err);
		}
		console.error('Chat API error:', err);
		return errorResponse('AI error', 500);
	}
};

