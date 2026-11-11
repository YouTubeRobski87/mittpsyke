import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { CLAUDE_MODELS, estimateCostUsd, type ClaudeModel } from './models';

// Gemensamt lager för alla Claude-anrop. Ersätter den handskrivna fetch-plumbing
// som tidigare låg duplicerad i daily-question, spegelvattnet och admin
// — inklusive två separata kopior av samma extractAnthropicText.

function normalizeApiKey(value: string | undefined): string | null {
	if (!value) return null;
	// Nycklar klistras ibland in med citattecken eller "Bearer "-prefix.
	const normalized = value.trim().replace(/^['"]/, '').replace(/['"]$/, '').replace(/^Bearer\s+/i, '');
	return normalized || null;
}

function resolveApiKey(): string | null {
	// STORIFY_API_KEY ligger kvar sist i kedjan: Storify är borttaget, men
	// nyckeln kan fortfarande vara den enda som är satt i driftsmiljön.
	return normalizeApiKey(env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || env.STORIFY_API_KEY);
}

function createClient(timeoutMs: number): Anthropic | null {
	const apiKey = resolveApiKey();
	if (!apiKey) return null;

	// SDK:ns timeout anges i millisekunder i TypeScript.
	return new Anthropic({ apiKey, timeout: timeoutMs });
}

type UsageLike = {
	input_tokens?: number | null;
	output_tokens?: number | null;
} | null;

/**
 * Loggar tokenförbrukning och uppskattad kostnad per anrop. Raderna är
 * avsiktligt sökbara i Render-loggen på prefixet "[ai:usage]".
 */
function logUsage(label: string, model: ClaudeModel, usage: UsageLike) {
	const inputTokens = usage?.input_tokens ?? 0;
	const outputTokens = usage?.output_tokens ?? 0;

	console.log(
		'[ai:usage]',
		JSON.stringify({
			label,
			model,
			inputTokens,
			outputTokens,
			estimatedCostUsd: Number(estimateCostUsd(model, inputTokens, outputTokens).toFixed(6))
		})
	);
}

// Statusar som kräver en ändring i konfigurationen (nyckel, behörighet,
// avvecklad modell) och inte går över av att vänta.
const CONFIGURATION_STATUSES = new Set([401, 403, 404]);
const ERROR_TYPE_PATTERN = /^[a-z0-9_.-]{1,64}$/i;

/**
 * Plockar ut leverantörens korta feltyp (t.ex. 'not_found_error') ur svaret.
 * Fritextmeddelandet loggas aldrig: det kan innehålla delar av requesten.
 */
function anthropicErrorType(error: InstanceType<typeof Anthropic.APIError>): string | undefined {
	const body = (error as { error?: unknown }).error;
	const nested = body && typeof body === 'object' ? (body as { error?: unknown }).error : undefined;
	const type = nested && typeof nested === 'object' ? (nested as { type?: unknown }).type : undefined;
	return typeof type === 'string' && ERROR_TYPE_PATTERN.test(type) ? type : undefined;
}

function logError(label: string, model: ClaudeModel, error: unknown) {
	if (error instanceof Anthropic.APIError) {
		// status särskiljer avvecklad modell (404) från kvot (429) och nyckelfel (401).
		const status = typeof error.status === 'number' ? error.status : undefined;
		const configuration = status !== undefined && CONFIGURATION_STATUSES.has(status);
		console.error(configuration ? '[ai:config]' : '[ai:error]', {
			label,
			model,
			kind: configuration ? 'configuration' : status === undefined || status === 429 || status >= 500 ? 'transient' : 'request',
			providerStatus: status,
			providerCode: anthropicErrorType(error),
			errorName: error.name
		});
		return;
	}

	// Okända fel kan bära godtycklig text; bara feltypens namn loggas.
	console.error('[ai:error]', { label, model, kind: 'unknown', errorName: error instanceof Error ? error.name : typeof error });
}

/**
 * Loggar stoppskäl som betyder att svaret är ofullständigt. Texten returneras
 * som tidigare - anropsställena validerar själva och har reservsvar - men ett
 * för snävt tokentak eller för långt underlag syns nu i loggen.
 */
function logIncompleteStop(label: string, model: ClaudeModel, stopReason: string | null | undefined, hasText: boolean) {
	if (stopReason === 'max_tokens' || stopReason === 'model_context_window_exceeded' || stopReason === 'pause_turn') {
		console.warn('[ai:truncated]', { label, model, stopReason, hasText });
	}
}

/** Plockar ut all textinnehåll ur ett svar och slår ihop det. */
function extractText(content: Anthropic.ContentBlock[]): string {
	return content
		.map((block) => (block.type === 'text' ? block.text : ''))
		.join('')
		.trim();
}

export type ClaudeRequest = {
	/** Kort etikett som identifierar anropsstället i usage- och felloggen. */
	label: string;
	system: string;
	/** Enkel prompt, eller en färdig meddelandelista för flerstegssamtal. */
	prompt?: string;
	messages?: Anthropic.MessageParam[];
	model?: ClaudeModel;
	/**
	 * Tak för thinking OCH svarstext tillsammans. På claude-opus-5 är thinking
	 * påslaget som standard, så ett tak satt efter enbart svarslängden ger ett
	 * tomt svar. Håll det rejält tilltaget — det är ett tak, inte ett mål.
	 */
	maxTokens: number;
	timeoutMs?: number;
	/**
	 * Styr hur djupt modellen tänker. 'low' håller latensen nere för korta,
	 * väldefinierade uppgifter; höj för uppgifter som kräver mer resonemang.
	 */
	effort?: 'low' | 'medium' | 'high';
};

const DEFAULT_TIMEOUT_MS = 20_000;

type ClaudeEffort = NonNullable<ClaudeRequest['effort']>;

/**
 * Uttryckliga kapabiliteter för de registrerade modellerna. Nya modeller måste
 * granskas här - en modell som saknas i tabellen går inte att typa in i
 * CLAUDE_MODELS utan att TypeScript kräver en rad.
 *
 * - claude-opus-5: adaptive thinking (på som standard), effort low-max.
 *   Sampling (temperature/top_p/top_k) stöds inte och skickas aldrig.
 * - claude-haiku-4-5: varken adaptive thinking eller effort. Extended thinking
 *   med budget_tokens finns men används inte.
 *
 * Kontrollerat mot Anthropics dokumentation 2026-11-04, se
 * docs/ai/AI-modelljamforelse-2026.md.
 */
export const CLAUDE_MODEL_CAPABILITIES: Record<
	ClaudeModel,
	{ thinking: 'adaptive' | 'none'; effortLevels: readonly ClaudeEffort[] }
> = {
	'claude-opus-5': { thinking: 'adaptive', effortLevels: ['low', 'medium', 'high'] },
	'claude-haiku-4-5': { thinking: 'none', effortLevels: [] }
};

export function thinkingOptions(model: ClaudeModel, effort: ClaudeRequest['effort']): {
	thinking?: { type: 'adaptive' };
	output_config?: { effort: ClaudeEffort };
} {
	const capabilities = CLAUDE_MODEL_CAPABILITIES[model];
	if (capabilities.thinking !== 'adaptive') return {};
	const requested = effort ?? 'low';
	// En effortnivå som modellen inte stöder skickas inte; standardnivån low används.
	const supported = capabilities.effortLevels.includes(requested) ? requested : 'low';
	return { thinking: { type: 'adaptive' }, output_config: { effort: supported } };
}

/**
 * Kör ett Claude-anrop och returnerar texten, eller null om anropet misslyckas
 * eller ingen nyckel är konfigurerad. Kastar aldrig — anropsställena har alla
 * en fallback, och ett AI-fel ska inte fälla sidan.
 */
export async function callClaude(request: ClaudeRequest): Promise<string | null> {
	const model = request.model ?? CLAUDE_MODELS.deep;
	const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const client = createClient(timeoutMs);

	if (!client) {
		console.error('[ai:config]', { label: request.label, model, kind: 'configuration', providerCode: 'missing_api_key' });
		return null;
	}

	const messages =
		request.messages ?? [{ role: 'user' as const, content: request.prompt ?? '' }];

	try {
		const response = await client.messages.create({
			model,
			max_tokens: request.maxTokens,
			system: request.system,
			messages,
			...thinkingOptions(model, request.effort)
		});

		logUsage(request.label, model, response.usage);

		if (response.stop_reason === 'refusal') {
			console.error(`[ai:error] ${request.label} avvisades av modellen`);
			return null;
		}

		const text = extractText(response.content);
		logIncompleteStop(request.label, model, response.stop_reason, Boolean(text));
		return text;
	} catch (error) {
		logError(request.label, model, error);
		return null;
	}
}

export type ClaudeStreamRequest = Omit<ClaudeRequest, 'prompt'> & {
	messages: Anthropic.MessageParam[];
};

/**
 * Strömmar svarstext som en följd av textbitar. Kastar vidare om anropet
 * misslyckas, så att anropsstället kan skicka ett felmeddelande på sin egen
 * ström i stället för att lämna klienten hängande.
 */
export async function* streamClaudeText(
	request: ClaudeStreamRequest
): AsyncGenerator<string, void, unknown> {
	const model = request.model ?? CLAUDE_MODELS.deep;
	const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const client = createClient(timeoutMs);

	if (!client) {
		throw new Error(`${request.label} saknar API-nyckel`);
	}

	const stream = client.messages.stream({
		model,
		max_tokens: request.maxTokens,
		system: request.system,
		messages: request.messages,
		...thinkingOptions(model, request.effort)
	});

	try {
		for await (const event of stream) {
			if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
				yield event.delta.text;
			}
		}

		const finalMessage = await stream.finalMessage();
		logUsage(request.label, model, finalMessage.usage);
		logIncompleteStop(request.label, model, finalMessage.stop_reason, true);
	} catch (error) {
		logError(request.label, model, error);
		throw error;
	}
}
