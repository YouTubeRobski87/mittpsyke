import {
	createConfiguredTextProvider,
	getConfiguredAIModelConfiguration
} from './text-generation-provider';
import {
	AITextGenerationError,
	type AIModelConfiguration,
	type AITextProvider,
	type AITextProviderRequest,
	type AITextRequest,
	type AITextResponse
} from './text-generation-contract';

export {
	AITextGenerationError,
	type AIMessage,
	type AIModelConfiguration,
	type AITextProvider,
	type AITextProviderRequest,
	type AITextPurpose,
	type AITextRequest,
	type AITextResponse
} from './text-generation-contract';

export function getAIModelConfiguration(purpose: string): AIModelConfiguration {
	return getConfiguredAIModelConfiguration(purpose);
}

export { hasConfiguredTextProvider } from './text-generation-provider';

export function normalizeAIError(error: unknown): AITextGenerationError {
	if (error instanceof AITextGenerationError) return error;
	return new AITextGenerationError('provider', 'AI-tjänsten kunde inte svara.');
}

export function createAITextGenerator(provider: AITextProvider = createConfiguredTextProvider()) {
	return async (request: AITextRequest): Promise<AITextResponse> => {
		const configuration = getAIModelConfiguration(request.purpose);
		try {
			const text = await provider.generate({ ...request, ...configuration });
			return { text, model: configuration.model };
		} catch (error) {
			throw normalizeAIError(error);
		}
	};
}

/**
 * Production uses the default provider. Tests may pass a recorded provider to
 * exercise the same generation service without making a network request.
 */
export async function generateAIText(
	request: AITextRequest,
	provider?: AITextProvider
): Promise<AITextResponse> {
	return createAITextGenerator(provider)(request);
}
