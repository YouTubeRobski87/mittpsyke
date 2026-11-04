import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import {
	AITextGenerationError,
	type AIProviderDiagnostics,
	type AITextProvider,
	type AITextProviderRequest
} from '../text-generation-contract';
import { validateOpenAITextModel, type OpenAIModelValidation } from './openai-model-capabilities';

export {
	OPENAI_TEXT_MODEL_CAPABILITIES,
	validateOpenAITextModel,
	type OpenAIModelValidation,
	type OpenAITextModelCapabilities
} from './openai-model-capabilities';

type OpenAIClient = Pick<OpenAI, 'chat'>;

export type OpenAIChatParams = {
	model: string;
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
	max_completion_tokens: number;
	temperature?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
	response_format?: { type: 'json_object' };
};

/**
 * Bygger Chat Completions-parametrarna utifrån modellens granskade egenskaper.
 * Kastar ett konfigurationsfel för otillåtna modeller och för JSON-läge som
 * modellen saknar stöd för - JSON-läget kan inte tyst släppas eftersom
 * anropsställena tolkar svaret som JSON.
 */
export function buildOpenAIChatParams(
	request: AITextProviderRequest,
	validation: OpenAIModelValidation = validateOpenAITextModel(request.model)
): OpenAIChatParams {
	if (!validation.ok) {
		throw new AITextGenerationError('configuration', 'AI-modellen är inte godkänd för MittPsyke.', {
			providerCode: validation.reason
		});
	}
	const { capabilities } = validation;
	if (request.outputFormat === 'json_object' && !capabilities.jsonObject) {
		throw new AITextGenerationError('configuration', 'AI-modellen saknar stöd för JSON-svar.', {
			providerCode: 'json_object_unsupported'
		});
	}

	const messages = [
		...(request.systemInstructions ?? [])
			.filter(Boolean)
			.map((content) => ({ role: 'system' as const, content })),
		...request.messages
	];

	return {
		model: request.model,
		messages,
		...(capabilities.temperature && request.temperature !== undefined ? { temperature: request.temperature } : {}),
		...(capabilities.penalties && request.frequencyPenalty !== undefined
			? { frequency_penalty: request.frequencyPenalty }
			: {}),
		...(capabilities.penalties && request.presencePenalty !== undefined
			? { presence_penalty: request.presencePenalty }
			: {}),
		...(request.outputFormat === 'json_object' ? { response_format: { type: 'json_object' as const } } : {}),
		max_completion_tokens: request.maxOutputTokens
	};
}

/** Maps MittPsyke's neutral text request to the OpenAI chat-completions API. */
export class OpenAITextProvider implements AITextProvider {
	constructor(private readonly client: OpenAIClient) {}

	async generate(request: AITextProviderRequest): Promise<string> {
		// Valideringen ligger före try-blocket: ett konfigurationsfel ska inte
		// passera leverantörsfelmappningen och se ut som ett tillfälligt fel.
		const params = buildOpenAIChatParams(request);
		try {
			const completion = await this.client.chat.completions.create(params, { timeout: request.timeoutMs });
			const choice = completion.choices[0];
			const text = choice?.message?.content?.trim();
			if (choice?.finish_reason === 'length') {
				// Svaret klipptes vid tokentaket. Texten returneras som tidigare,
				// men loggen visar att budgeten är för snäv för modellen.
				console.warn('[ai:truncated]', {
					purpose: request.purpose,
					model: request.model,
					finishReason: 'length',
					hasText: Boolean(text)
				});
			}
			if (!text) {
				const providerCode = choice?.message?.refusal
					? 'refusal'
					: choice?.finish_reason === 'length' || choice?.finish_reason === 'content_filter'
						? choice.finish_reason
						: undefined;
				throw new AITextGenerationError('empty_response', 'AI-svaret saknade text.', { providerCode });
			}

			return text;
		} catch (error) {
			throw normalizeOpenAIError(error);
		}
	}
}

// Alla nuvarande textsyften använder max_completion_tokens. Det håller adaptern
// kompatibel med GPT-5-serien och undviker det äldre, avvecklade max_tokens-fältet.

export function normalizeOpenAIError(error: unknown): AITextGenerationError {
	if (error instanceof AITextGenerationError) return error;
	const name = error instanceof Error ? error.name : null;
	if (error instanceof OpenAI.APIConnectionTimeoutError || name === 'APIConnectionTimeoutError') {
		return new AITextGenerationError('timeout', 'AI-anropet tog för lång tid.');
	}
	const diagnostics = providerDiagnostics(error);
	if (error instanceof OpenAI.RateLimitError || name === 'RateLimitError') {
		// OpenAI svarar 429 även när kvoten eller faktureringen är slut. Det går
		// inte över av att vänta, så det får inte visas som överbelastning.
		if (diagnostics.providerCode === 'insufficient_quota') {
			return new AITextGenerationError('quota', 'AI-tjänstens kvot är slut.', diagnostics);
		}
		return new AITextGenerationError('rate_limit', 'AI-tjänsten är tillfälligt hårt belastad.', diagnostics);
	}
	return new AITextGenerationError('provider', 'AI-tjänsten kunde inte svara.', diagnostics);
}

const PROVIDER_CODE_PATTERN = /^[a-z0-9_.-]{1,64}$/i;

/**
 * Plockar ut status och felkod ur ett SDK-fel för serverloggen. Felkoden
 * godtas bara som en kort identifierare - leverantörens fritext kan innehålla
 * nyckelfragment eller kontouppgifter och följer aldrig med.
 */
function providerDiagnostics(error: unknown): AIProviderDiagnostics {
	if (!error || typeof error !== 'object') return {};
	const { status, code, type } = error as { status?: unknown; code?: unknown; type?: unknown };
	const providerCode = [code, type].find(
		(value): value is string => typeof value === 'string' && PROVIDER_CODE_PATTERN.test(value)
	);
	return {
		providerStatus: Number.isInteger(status) && (status as number) >= 100 && (status as number) <= 599 ? (status as number) : undefined,
		providerCode
	};
}

function normalizeApiKey(value: string | undefined): string | null {
	const apiKey = value
		?.trim()
		.replace(/^['"]|['"]$/g, '')
		.replace(/^Bearer\s+/i, '')
		.replace(/\s+/g, '');
	return apiKey && !/[\u0000-\u001f\u007f]/.test(apiKey) ? apiKey : null;
}

export function hasOpenAITextProviderConfiguration(): boolean {
	return Boolean(normalizeApiKey(env.OPENAI_API_KEY));
}

/** Default composition belongs to the OpenAI adapter, not the product core. */
export function createDefaultTextProvider(): AITextProvider {
	const apiKey = normalizeApiKey(env.OPENAI_API_KEY);
	if (!apiKey) {
		throw new AITextGenerationError('configuration', 'OPENAI_API_KEY saknas.');
	}

	return new OpenAITextProvider(new OpenAI({ apiKey }));
}
