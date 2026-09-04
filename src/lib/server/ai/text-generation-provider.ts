import { env } from '$env/dynamic/private';
import {
	createDefaultTextProvider,
	hasOpenAITextProviderConfiguration
} from './providers/openai-text-provider';
import {
	AITextGenerationError,
	type AIModelConfiguration,
	type AITextProvider,
	type AITextPurpose
} from './text-generation-contract';

// Provider/model selection is composition, not product behaviour. The core
// only receives a neutral model policy for the requested MittPsyke purpose.
const modelConfigurations: Record<AITextPurpose, AIModelConfiguration> = {
	'support-chat': {
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 25_000,
		maxOutputTokens: 500
	},
	'diary-reflection': {
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 8_000,
		maxOutputTokens: 150
	},
	'checkin-reflection': {
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 12_000,
		maxOutputTokens: 260
	},
	'diary-narrative': {
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 20_000,
		maxOutputTokens: 900
	},
	'user-memory': {
		model: (env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
		timeoutMs: 12_000,
		maxOutputTokens: 400
	}
};

/**
 * Composition root for the currently configured text provider. Product code
 * only depends on the neutral contract; provider selection stays here.
 */
export function createConfiguredTextProvider(): AITextProvider {
	return createDefaultTextProvider();
}

export function hasConfiguredTextProvider(): boolean {
	return hasOpenAITextProviderConfiguration();
}

export function getConfiguredAIModelConfiguration(purpose: string): AIModelConfiguration {
	const configuration = modelConfigurations[purpose as AITextPurpose];
	if (!configuration) {
		throw new AITextGenerationError('configuration', `Okänt AI-syfte: ${purpose}`);
	}
	if (!configuration.model) {
		throw new AITextGenerationError('configuration', `AI-modell saknas för syftet: ${purpose}`);
	}
	return configuration;
}
