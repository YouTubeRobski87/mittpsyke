import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { CLAUDE_MODELS, estimateCostUsd, type ClaudeModel } from './models';

// Gemensamt lager för alla Claude-anrop. Ersätter den handskrivna fetch-plumbing
// som tidigare låg duplicerad i daily-question, spegelvattnet, admin och storify
// — inklusive två separata kopior av samma extractAnthropicText.

/**
 * Vilken nyckel ett anrop ska använda. Storify har en egen nyckel så att dess
 * förbrukning går att skilja från resten av plattformens.
 */
export type ClaudeCredential = 'default' | 'storify';

function normalizeApiKey(value: string | undefined): string | null {
	if (!value) return null;
	// Nycklar klistras ibland in med citattecken eller "Bearer "-prefix.
	const normalized = value.trim().replace(/^['"]/, '').replace(/['"]$/, '').replace(/^Bearer\s+/i, '');
	return normalized || null;
}

function resolveApiKey(credential: ClaudeCredential): string | null {
	if (credential === 'storify') {
		return normalizeApiKey(env.STORIFY_API_KEY);
	}

	return normalizeApiKey(env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || env.STORIFY_API_KEY);
}

function createClient(credential: ClaudeCredential, timeoutMs: number): Anthropic | null {
	const apiKey = resolveApiKey(credential);
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

function logError(label: string, error: unknown) {
	if (error instanceof Anthropic.APIError) {
		// status särskiljer avvecklad modell (404) från kvot (429) och nyckelfel (401).
		console.error(`[ai:error] ${label}`, error.status, error.name, error.message);
		return;
	}

	console.error(`[ai:error] ${label}`, error);
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
	credential?: ClaudeCredential;
	/**
	 * Styr hur djupt modellen tänker. 'low' håller latensen nere för korta,
	 * väldefinierade uppgifter; höj för uppgifter som kräver mer resonemang.
	 */
	effort?: 'low' | 'medium' | 'high';
};

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Kör ett Claude-anrop och returnerar texten, eller null om anropet misslyckas
 * eller ingen nyckel är konfigurerad. Kastar aldrig — anropsställena har alla
 * en fallback, och ett AI-fel ska inte fälla sidan.
 */
export async function callClaude(request: ClaudeRequest): Promise<string | null> {
	const model = request.model ?? CLAUDE_MODELS.deep;
	const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const client = createClient(request.credential ?? 'default', timeoutMs);

	if (!client) {
		console.error(`[ai:error] ${request.label} saknar API-nyckel`);
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
			thinking: { type: 'adaptive' },
			output_config: { effort: request.effort ?? 'low' }
		});

		logUsage(request.label, model, response.usage);

		if (response.stop_reason === 'refusal') {
			console.error(`[ai:error] ${request.label} avvisades av modellen`);
			return null;
		}

		return extractText(response.content);
	} catch (error) {
		logError(request.label, error);
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
	const client = createClient(request.credential ?? 'default', timeoutMs);

	if (!client) {
		throw new Error(`${request.label} saknar API-nyckel`);
	}

	const stream = client.messages.stream({
		model,
		max_tokens: request.maxTokens,
		system: request.system,
		messages: request.messages,
		thinking: { type: 'adaptive' },
		output_config: { effort: request.effort ?? 'low' }
	});

	try {
		for await (const event of stream) {
			if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
				yield event.delta.text;
			}
		}

		const finalMessage = await stream.finalMessage();
		logUsage(request.label, model, finalMessage.usage);
	} catch (error) {
		logError(request.label, error);
		throw error;
	}
}
