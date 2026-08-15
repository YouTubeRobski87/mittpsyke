import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { hasHealthConsentInMetadata, hasSensitiveConsentHeader } from '$lib/consent';
import { CHAT_CONTEXT_LIMIT, getChatContextMessages } from '$lib/state/chat-memory';
import { resolveDeterministicRiskGuard } from '$lib/ai/crisis-guard';
import {
	formatMemoriesForPrompt,
	loadUserMemories,
	refreshUserMemories,
	shouldRefreshUserMemories,
	type MemoryHistoryMessage
} from '$lib/server/user-memory';
import {
	formatDiaryContextForPrompt,
	getActivePersonalGoals,
	loadRecentDiaryEntries
} from '$lib/server/diary-context';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '$lib/server/supabase-admin';
import { hasChatAiConsent } from '$lib/server/chat-ai-consent';
import {
	ANONYMOUS_CHAT_CONSENT_COOKIE,
	hasAnonymousChatConsentSecret,
	hasValidAnonymousChatConsent
} from '$lib/server/anonymous-chat-consent';
import {
	AITextGenerationError,
	generateAIText,
	type AIMessage,
	type AITextRequest
} from '$lib/server/ai/text-generation';
import { buildSupportChatSafetyInstructions } from '$lib/server/ai/safety-instructions';
import { RateLimiter } from '$lib/server/rate-limit';
import { buildTopicHintInstruction, getTopicHint } from '$lib/ai/chat-topics';
import { normalizeCategory, type SupportCategory } from '$lib/ai/chat-categories';
import {
	buildReassurancePatternInstruction,
	detectReassurancePattern
} from '$lib/ai/reassurance-pattern';
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
- Skriv i ren text. Ingen markdown: inga asterisker för fetstil, inga rubriker med brädgård, inga punktlistor med bindestreck. Chatten visar text precis som den skrivs, så formateringstecken syns som tecken.
- Undvik överdriven AI-empati.
Samtalsstil:

- Undvik att alltid börja svar med frasen "Det låter som att".
- Börja inte svar med "Det låter som att..." eller "Det verkar som att...".
- Variera öppningen så att svaren känns mer naturliga.
- Börja hellre direkt och konkret i det användaren faktiskt skrev.
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
- Undvik att kategorisera åt användaren med färdiga alternativ (t.ex. "är det X, Y eller Z?").
- Låt användaren själv sätta ord på det.
- Ställ hellre öppna, enkla frågor (t.ex. "Vad känns tyngst just nu?").

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

Prioritet: användarens intention
- Om användaren uttrycker vad hen vill just nu (t.ex. "jag vill bara skriva av mig", "jag vill förstå vad som är värst", "jag vet inte om jag ska fortsätta"):
  1. Svara direkt på det målet.
  2. Spegla riktningen kort.
  3. Fortsätt i samma spår.
- Byt inte riktning.
- Introducera inte en ny metod.
- Ge inte en övning direkt om användaren inte bett om det.
- Börja inte strukturera upp om användaren inte efterfrågar det.

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
// Krisorddetektering – körs alltid FÖRE AI-anrop.
// Ordlistorna kommer från $lib/ai/crisis-keywords, den enda källan som delas
// med klientens omedelbara UI-check och ChatWindows stödnivåer.
// ---------------------------------------------------------------------------
/** Runs before rate limiting, storage and any provider request. */
export function _resolveDeterministicChatGuard(message: string) {
	return resolveDeterministicRiskGuard(message);
}

// Säkerhetssvaren ligger i $lib/ai/crisis-responses, som ren text.
// ---------------------------------------------------------------------------

// Per-IP gräns (samma mönster som hibp/breaches och diary/reflect): stoppar
// skriptad spam mot AI-tjänsten utan att störa ett vanligt, aktivt samtal. Körs
// EFTER kris-/tredjepartsdetekteringen längre ner så en person i akut kris
// alltid får krissvaret, oavsett hur många meddelanden som skickats innan.
const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 12;
const chatRateLimiter = new RateLimiter(CHAT_RATE_LIMIT_WINDOW_MS, CHAT_RATE_LIMIT_MAX_REQUESTS);
const CHAT_RATE_LIMIT_MESSAGE =
	'Du skickar meddelanden lite för snabbt. Vänta en liten stund och skicka igen.';

function logAIError(
	context: { guest: boolean; category: SupportCategory; conversationId: string | null },
	error: AITextGenerationError
) {
	console.error('Chat AI generation failed', {
		purpose: 'support-chat',
		guest: context.guest,
		category: context.category,
		conversationId: context.conversationId,
		code: error.code
	});
}

const systemByCategory: Record<string, string> = {
	A: `${SYSTEM_PROMPT}\nFokusera varsamt på ångest och oro med stabiliserande, jordande språk.`,
	B: `${SYSTEM_PROMPT}\nFokusera varsamt på nedstämdhet med hoppfull men realistisk ton, utan att bagatellisera.`,
	E: `${SYSTEM_PROMPT}\nFokusera varsamt på trauma med extra försiktighet, undvik detaljer som kan återaktivera stark stress.`,
	// G = samtal utan vald kategori, numera den normala vägen in. Ingen
	// ämnesstyrning läggs på: användarens egna ord ska avgöra riktningen, och
	// samtalet ska kunna byta spår utan att något behöver väljas om.
	G: `${SYSTEM_PROMPT}
Användaren har inte valt något ämne, och behöver inte göra det.
Följ det användaren faktiskt skriver. Tvinga inte fram en etikett, kategori eller diagnos, och be inte användaren precisera vilket område det gäller.
Du hanterar lika gärna ångest, nedstämdhet, ensamhet, relationer, stress och utmattning, trauma, sömn, neuropsykiatriska svårigheter eller ett helt vanligt samtal.
Om det är oklart vad det handlar om: säg att det är okej att inte veta, och fråga vad som känns tyngst just nu i stället för att be om en kategori.
Om samtalet byter riktning, följ med dit utan att kommentera bytet.`
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ConversationRow = {
	id: string;
	user_id: string;
	category: string | null;
};

type PromptHistoryMessage = {
	role: 'user' | 'assistant';
	content: string;
};

const MAX_CHAT_MESSAGE_LENGTH = 2000;
const CHAT_MESSAGE_TOO_LONG_ERROR = 'Din text blev lite för lång att skicka på en gång. Dela gärna upp den i två delar.';

export function _buildDynamicSystemPrompt(
	category: SupportCategory,
	history: PromptHistoryMessage[],
	topicHintId: string | null = null,
	reassurancePatternInstruction = ''
) {
	const categoryPrompt = systemByCategory[category] || SYSTEM_PROMPT;
	// Genvägen är extra kontext ovanpå grundprompten, aldrig en egen prompt.
	const topicInstruction = buildTopicHintInstruction(topicHintId);
	const basePrompt = topicInstruction
		? `${categoryPrompt}\n${topicInstruction}`
		: categoryPrompt;
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
	const retentionInstructionBlock = [
		retentionInstructions.length > 0 ? retentionInstructions.join('\n') : '',
		reassurancePatternInstruction
	]
		.filter(Boolean)
		.join('\n');

	if (history.length === 0) {
		return `${basePrompt}

Det här är första gången du pratar med den här användaren. Välkomna dem varmt.
${phaseInstruction}${retentionInstructionBlock ? `\n${retentionInstructionBlock}` : ''}`.trim();
	}

	return `${basePrompt}

Konversationen pågår redan – användaren har skickat meddelanden tidigare i denna session.
Svara direkt på det senaste meddelandet utan att hälsa, presentera dig eller sammanfatta vad ni pratat om.
Använd ALDRIG fraser som "Hej igen", "Jag minns att vi pratade om...", "Vill du att vi börjar om?" eller liknande återöppningsfraser mitt i en pågående konversation.
${phaseInstruction}${retentionInstructionBlock ? `\n${retentionInstructionBlock}` : ''}`.trim();
}

export function _buildSupportChatRequest(options: {
	category: SupportCategory;
	history: PromptHistoryMessage[];
	message: string;
	topicHintId?: string | null;
	contextBlocks?: string[];
}): AITextRequest {
	const reassurancePatternInstruction = buildReassurancePatternInstruction(
		detectReassurancePattern(options.message, options.history)
	);
	const systemPrompt = _buildDynamicSystemPrompt(
		options.category,
		options.history,
		options.topicHintId ?? null,
		reassurancePatternInstruction
	);
	return {
		purpose: 'support-chat',
		systemInstructions: [
			...buildSupportChatSafetyInstructions(),
			[systemPrompt, ...(options.contextBlocks ?? [])].filter(Boolean).join('\n\n')
		],
		messages: [...options.history, { role: 'user', content: options.message }],
		temperature: 0.75,
		frequencyPenalty: 0.3,
		presencePenalty: 0.2
	};
}

function logChatPayloadStructure(context: {
	guest: boolean;
	category: SupportCategory;
	conversationId: string | null;
	contextSource: 'client' | 'database';
	messages: readonly AIMessage[];
}) {
	console.info('[chat] AI payload structure', {
		purpose: 'support-chat',
		guest: context.guest,
		category: context.category,
		conversationId: context.conversationId,
		contextSource: context.contextSource,
		messageCount: context.messages.length,
		roles: context.messages.map((message) => message.role),
		contentLengths: context.messages.map((message) =>
			typeof message.content === 'string' ? message.content.length : null
		)
	});
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

function normalizeConversationId(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed || !UUID_REGEX.test(trimmed)) return null;
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

export const POST: RequestHandler = async ({ request, getClientAddress, cookies }) => {
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
		contextMessages?: unknown;
		topicHint?: unknown;
	};

	// Valfri ämnesgenväg. Valideras mot den fasta listan innan den kan nå
	// systemprompten - fritext härifrån får aldrig vävas in.
	const topicHintId = getTopicHint(body.topicHint)?.id ?? null;

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
	const isGuestRequest = !token;

	// ---------------------------------------------------------------------------
	// Krischeck – avbryt AI-anrop och returnera säkerhetssvar om riskord hittas
	// ---------------------------------------------------------------------------
	const guardResult = _resolveDeterministicChatGuard(message);
	if (guardResult) {
		console.warn('[chat] deterministic risk guard matched', {
			kind: guardResult.kind,
			guest: isGuestRequest,
			messageLength: message.length
		});
		return json({
			reply: guardResult.reply,
			crisis: guardResult.crisis,
			conversationId: null,
			mode: isGuestRequest ? 'guest' : 'user'
		});
	}
	// ---------------------------------------------------------------------------

	// Rate limit - placerad EFTER kris-/tredjepartschecken ovan så den aldrig
	// kan blockera ett akut krissvar, men innan några Supabase- eller
	// AI-anrop görs.
	if (chatRateLimiter.consume(`ip:${getClientAddress()}`)) {
		return errorResponse(CHAT_RATE_LIMIT_MESSAGE, 429);
	}

	if (!normalizeApiKey(env.OPENAI_API_KEY)) {
		console.error('OPENAI_API_KEY is missing or malformed');
		return errorResponse('Server configuration error', 500);
	}

	try {
		let category = normalizeCategory(body.category);
		let conversationId = normalizeConversationId(body.conversationId);

		// Gästläge är avsiktligt utan serverlagring tills datahanteringen och
		// retentionen är genomgångna. Samtalet fortsätter endast med den begränsade
		// kontext som webbläsaren skickar i det aktuella anropet.
		if (!token) {
			// Serververifierat samtycke för gästchatt: en HMAC-signerad,
			// kortlivad HttpOnly-cookie som bara servern kan utfärda. Den gamla
			// klientheadern är en konstant ur bundeln och duger inte ensam.
			//
			// Krisgrinden ovan ligger avsiktligt före den här punkten: den är
			// deterministisk, körs lokalt och skickar ingenting vidare. Ett
			// saknat samtycke får aldrig tysta ett akut säkerhetssvar.
			if (!hasAnonymousChatConsentSecret()) {
				console.error('Missing CHAT_ANON_CONSENT_SECRET for guest chat consent.');
				return errorResponse('Server configuration error', 500);
			}

			if (!hasValidAnonymousChatConsent(cookies.get(ANONYMOUS_CHAT_CONSENT_COOKIE))) {
				return errorResponse('Consent required for sensitive AI features.', 403, {
					code: 'ANONYMOUS_CONSENT_REQUIRED'
				});
			}

			const modelContext = contextMessages.map((row) => ({
				role: row.role,
				content: row.content
			}));
			const generationRequest = _buildSupportChatRequest({
				category,
				history: modelContext,
				message,
				topicHintId
			});
			const completionMessages = generationRequest.messages;
			logChatPayloadStructure({
				guest: true,
				category,
				conversationId: null,
				contextSource: 'client',
				messages: completionMessages
			});

			try {
				const result = await generateAIText(generationRequest);
				return json({ reply: result.text, conversationId: null, mode: 'guest' });
			} catch (error) {
				const aiError =
					error instanceof AITextGenerationError
						? error
						: new AITextGenerationError('provider', 'AI-tjänsten kunde inte svara.');
				logAIError({ guest: true, category, conversationId: null }, aiError);
				throw aiError;
			}
		}

		const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseAnonKey) {
			console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY.');
			return errorResponse('Server configuration error', 500);
		}

		const authClient = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { autoRefreshToken: false, persistSession: false },
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		// INLOGGAD ANVÄNDARE
		{
			const {
				data: { user },
				error: userError
			} = await authClient.auth.getUser();

			if (userError || !user) {
				return errorResponse('Unauthorized.', 401);
			}

			// Serverägt samtycke för AI-chatten (scope chat_ai_support).
			// Klientheadern och user_metadata är båda skrivbara av användaren och
			// duger därför inte som säkerhetsbeslut. Grinden ligger före all
			// lagring av meddelandet och före varje leverantörsanrop.
			//
			// Krisgrinden ovan är avsiktligt kvar före den här punkten: den är
			// deterministisk, körs lokalt och skickar ingenting vidare. Ett
			// saknat samtycke får aldrig tysta ett akut säkerhetssvar.
			const consentServiceClient = createServiceClient();
			if (!consentServiceClient) {
				console.error('Missing service role client for chat consent check.');
				return errorResponse('Server configuration error', 500);
			}

			if (!(await hasChatAiConsent(consentServiceClient, user.id))) {
				return errorResponse('Consent required for sensitive AI features.', 403);
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

			const promptHistory = getChatContextMessages(previousMessages, CHAT_CONTEXT_LIMIT);

			const contextSource = contextMessages.length > 0 ? 'client' : 'database';
			const modelContext =
				contextMessages.length > 0
					? contextMessages.map((row) => ({
							role: row.role,
							content: row.content
						}))
					: promptHistory;

			// Hämta relevanta minnen och väv in dem i systemprompten för kontinuitet.
			const memories = await loadUserMemories(authClient, user.id);
			const memoryBlock = formatMemoriesForPrompt(memories);

			// Frivillig extra kontext från dagbok/mål – kräver att användaren both
			// slagit på inställningen och redan lämnat samtycke för känsliga uppgifter.
			const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
			const diaryContextEnabled =
				userMetadata.ai_diary_context_enabled === true && hasHealthConsentInMetadata(userMetadata);
			const diaryContextBlock = diaryContextEnabled
				? formatDiaryContextForPrompt(
						await loadRecentDiaryEntries(authClient, user.id),
						getActivePersonalGoals(userMetadata)
					)
				: '';

			const generationRequest = _buildSupportChatRequest({
				category,
				history: modelContext,
				message,
				topicHintId,
				contextBlocks: [memoryBlock, diaryContextBlock]
			});
			const completionMessages = generationRequest.messages;
			logChatPayloadStructure({
				guest: false,
				category,
				conversationId,
				contextSource,
				messages: completionMessages
			});
			let reply: string;
			try {
				const result = await generateAIText(generationRequest);
				reply = result.text;
			} catch (error) {
				const aiError = error instanceof AITextGenerationError ? error : new AITextGenerationError('provider', 'AI-tjänsten kunde inte svara.');
				logAIError({ guest: false, category, conversationId }, aiError);
				throw aiError;
			}

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

			// Uppdatera användarminnet i bakgrunden (best effort, blockerar inte svaret).
			const priorRows = (previousMessages ?? []) as Array<{ role: string; content: string }>;
			const memoryHistory: MemoryHistoryMessage[] = [
				...priorRows
					.filter((row) => row.role === 'user' || row.role === 'assistant')
					.map((row) => ({ role: row.role as 'user' | 'assistant', content: row.content })),
				{ role: 'user', content: message },
				{ role: 'assistant', content: reply }
			];
			const memoryTurns = memoryHistory.filter((item) => item.role === 'user').length;
			if (shouldRefreshUserMemories(memoryTurns)) {
				void refreshUserMemories({
					client: authClient,
					userId: user.id,
					history: memoryHistory
				}).catch((err) =>
					console.error('[chat] bakgrundsuppdatering av minne misslyckades', err)
				);
			}

			return json({
				reply,
				conversationId,
				mode: 'user'
			});
		}

	} catch (err) {
		console.error('Chat API error:', {
			errorType: err instanceof Error ? err.name : typeof err,
			code: err instanceof AITextGenerationError ? err.code : undefined
		});

		// Lugna, konkreta svenska felmeddelanden istället för ett generiskt
		// tekniskt fel - särskilja timeout/överbelastning så användaren förstår
		// att det är tillfälligt och kan försöka igen.
		if (err instanceof AITextGenerationError && err.code === 'timeout') {
			return errorResponse('Svaret tog för lång tid just nu. Försök gärna igen om en liten stund.', 504);
		}
		if (err instanceof AITextGenerationError && err.code === 'rate_limit') {
			return errorResponse('Tjänsten är hårt belastad just nu. Vänta en liten stund och försök igen.', 503);
		}
		return errorResponse('Något gick fel just nu. Försök gärna igen om en liten stund.', 500);
	}
};

