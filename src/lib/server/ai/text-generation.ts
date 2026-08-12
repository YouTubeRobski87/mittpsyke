import { env } from '$env/dynamic/private';
import OpenAI from 'openai';

export type AITextPurpose =
	| 'support-chat'
	| 'diary-reflection'
	| 'checkin-reflection'
	| 'diary-narrative'
	| 'weekly-summary'
	| 'user-memory';

export type AIMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export type AITextRequest = {
	purpose: AITextPurpose;
	messages: readonly AIMessage[];
	systemInstructions?: readonly string[];
	temperature?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	outputFormat?: 'text' | 'json_object';
};

export type AITextResponse = {
	text: string;
	provider: 'openai';
	model: string;
};

type ModelConfiguration = {
	provider: 'openai';
	model: string;
	timeoutMs: number;
	maxOutputTokens: number;
	maxTokensField: 'max_tokens' | 'max_completion_tokens';
};

const modelConfigurations: Record<AITextPurpose, ModelConfiguration> = {
	'support-chat': {
		provider: 'openai',
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 25_000,
		maxOutputTokens: 500,
		maxTokensField: 'max_completion_tokens'
	},
	'diary-reflection': {
		provider: 'openai',
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 8_000,
		maxOutputTokens: 150,
		maxTokensField: 'max_completion_tokens'
	},
	'checkin-reflection': {
		provider: 'openai',
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 12_000,
		maxOutputTokens: 260,
		maxTokensField: 'max_completion_tokens'
	},
	'diary-narrative': {
		provider: 'openai',
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 20_000,
		maxOutputTokens: 900,
		maxTokensField: 'max_tokens'
	},
	'weekly-summary': {
		provider: 'openai',
		model: (env.OPENAI_WEEKLY_SUMMARY_MODEL || 'gpt-4-turbo').trim(),
		timeoutMs: 20_000,
		maxOutputTokens: 200,
		maxTokensField: 'max_tokens'
	},
	'user-memory': {
		provider: 'openai',
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 12_000,
		maxOutputTokens: 400,
		maxTokensField: 'max_completion_tokens'
	}
};

export class AITextGenerationError extends Error {
	constructor(
		public readonly code: 'configuration' | 'timeout' | 'rate_limit' | 'provider' | 'empty_response',
		message: string
	) {
		super(message);
		this.name = 'AITextGenerationError';
	}
}

export function getAIModelConfiguration(purpose: string): ModelConfiguration {
	const configuration = modelConfigurations[purpose as AITextPurpose];
	if (!configuration) {
		throw new AITextGenerationError('configuration', `Okänt AI-syfte: ${purpose}`);
	}

	if (!configuration.model) {
		throw new AITextGenerationError('configuration', `AI-modell saknas för syftet: ${purpose}`);
	}

	return configuration;
}

export type AITextProviderRequest = AITextRequest & ModelConfiguration;

export interface AITextProvider {
	generate(request: AITextProviderRequest): Promise<string>;
}

type OpenAIClient = Pick<OpenAI, 'chat'>;

export class OpenAITextProvider implements AITextProvider {
	constructor(private readonly client: OpenAIClient) {}

	async generate(request: AITextProviderRequest): Promise<string> {
		const messages: AIMessage[] = [
			...(request.systemInstructions ?? []).filter(Boolean).map((content) => ({ role: 'system' as const, content })),
			...request.messages
		];

		const common = {
			model: request.model,
			messages,
			temperature: request.temperature,
			frequency_penalty: request.frequencyPenalty,
			presence_penalty: request.presencePenalty,
			...(request.outputFormat === 'json_object' ? { response_format: { type: 'json_object' as const } } : {})
		};
		const completion = await this.client.chat.completions.create(
			request.maxTokensField === 'max_tokens'
				? { ...common, max_tokens: request.maxOutputTokens }
				: { ...common, max_completion_tokens: request.maxOutputTokens },
			{ timeout: request.timeoutMs }
		);
		const text = completion.choices[0]?.message?.content?.trim();
		if (!text) throw new AITextGenerationError('empty_response', 'AI-svaret saknade text.');

		return text;
	}
}

export function normalizeAIError(error: unknown): AITextGenerationError {
	if (error instanceof AITextGenerationError) return error;
	const name = error instanceof Error ? error.name : null;
	if (error instanceof OpenAI.APIConnectionTimeoutError || name === 'APIConnectionTimeoutError') {
		return new AITextGenerationError('timeout', 'AI-anropet tog för lång tid.');
	}
	if (error instanceof OpenAI.RateLimitError || name === 'RateLimitError') {
		return new AITextGenerationError('rate_limit', 'AI-tjänsten är tillfälligt hårt belastad.');
	}
	return new AITextGenerationError('provider', 'AI-tjänsten kunde inte svara.');
}

function createDefaultProvider(): AITextProvider {
	const apiKey = env.OPENAI_API_KEY
		?.trim()
		.replace(/^['"]|['"]$/g, '')
		.replace(/^Bearer\s+/i, '')
		.replace(/\s+/g, '');
	if (!apiKey) {
		throw new AITextGenerationError('configuration', 'OPENAI_API_KEY saknas.');
	}

	return new OpenAITextProvider(new OpenAI({ apiKey }));
}

export function createAITextGenerator(provider: AITextProvider = createDefaultProvider()) {
	return async (request: AITextRequest): Promise<AITextResponse> => {
		const configuration = getAIModelConfiguration(request.purpose);
		try {
			const text = await provider.generate({ ...request, ...configuration });
			return { text, provider: configuration.provider, model: configuration.model };
		} catch (error) {
			throw normalizeAIError(error);
		}
	};
}

export async function generateAIText(request: AITextRequest): Promise<AITextResponse> {
	return createAITextGenerator()(request);
}
