import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import {
	AITextGenerationError,
	type AITextProvider,
	type AITextProviderRequest
} from '../text-generation-contract';

type OpenAIClient = Pick<OpenAI, 'chat'>;

/** Maps MittPsyke's neutral text request to the OpenAI chat-completions API. */
export class OpenAITextProvider implements AITextProvider {
	constructor(private readonly client: OpenAIClient) {}

	async generate(request: AITextProviderRequest): Promise<string> {
		const messages = [
			...(request.systemInstructions ?? [])
				.filter(Boolean)
				.map((content) => ({ role: 'system' as const, content })),
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
		try {
			const completion = await this.client.chat.completions.create(
			usesLegacyMaxTokensField(request.purpose)
					? { ...common, max_tokens: request.maxOutputTokens }
					: { ...common, max_completion_tokens: request.maxOutputTokens },
				{ timeout: request.timeoutMs }
			);
			const text = completion.choices[0]?.message?.content?.trim();
			if (!text) throw new AITextGenerationError('empty_response', 'AI-svaret saknade text.');

			return text;
		} catch (error) {
			throw normalizeOpenAIError(error);
		}
	}
}

function usesLegacyMaxTokensField(purpose: AITextProviderRequest['purpose']): boolean {
	return purpose === 'diary-narrative' || purpose === 'weekly-summary';
}

export function normalizeOpenAIError(error: unknown): AITextGenerationError {
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
