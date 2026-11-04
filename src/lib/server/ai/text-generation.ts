import {
	createConfiguredTextProvider,
	getConfiguredAIModelConfiguration
} from './text-generation-provider';
import {
	AITextGenerationError,
	classifyAIFailure,
	type AIModelConfiguration,
	type AITextProvider,
	type AITextProviderRequest,
	type AITextRequest,
	type AITextResponse
} from './text-generation-contract';

export {
	AITextGenerationError,
	classifyAIFailure,
	type AIFailureKind,
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

/**
 * En gemensam, sökbar loggrad för varje misslyckat textanrop. Flera
 * anropsställen svarar med ett reservsvar, och utan den här raden syns ett
 * återkommande konfigurationsfel inte alls. Konfigurationsfel loggas med eget
 * prefix så att de kan larmas separat från tillfälliga leverantörsfel.
 * Bara syfte, modell-ID, felkoder och status loggas - aldrig innehåll.
 */
export function logAITextFailure(purpose: string, model: string | null, error: AITextGenerationError) {
	const kind = classifyAIFailure(error);
	console.error(kind === 'configuration' ? '[ai:config]' : '[ai:error]', {
		purpose,
		// Ett syntaktiskt ogiltigt modellvärde kan vara en felinklistrad nyckel.
		model: error.providerCode === 'invalid_model_id' ? null : model,
		kind,
		code: error.code,
		providerStatus: error.providerStatus,
		providerCode: error.providerCode
	});
}

export function createAITextGenerator(provider?: AITextProvider) {
	return async (request: AITextRequest): Promise<AITextResponse> => {
		let configuration: AIModelConfiguration;
		let activeProvider: AITextProvider;
		try {
			configuration = getAIModelConfiguration(request.purpose);
			// Saknad nyckel är också ett konfigurationsfel och ska synas i samma loggrad.
			activeProvider = provider ?? createConfiguredTextProvider();
		} catch (error) {
			const normalized = normalizeAIError(error);
			logAITextFailure(request.purpose, null, normalized);
			throw normalized;
		}
		try {
			const text = await activeProvider.generate({ ...request, ...configuration });
			return { text, model: configuration.model };
		} catch (error) {
			const normalized = normalizeAIError(error);
			logAITextFailure(request.purpose, configuration.model, normalized);
			throw normalized;
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
