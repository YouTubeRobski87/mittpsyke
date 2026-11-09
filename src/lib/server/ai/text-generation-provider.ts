import { env } from '$env/dynamic/private';
import {
	createDefaultTextProvider,
	hasOpenAITextProviderConfiguration
} from './providers/openai-text-provider';
import { validateOpenAITextModel } from './providers/openai-model-capabilities';
import {
	AITextGenerationError,
	type AIModelConfiguration,
	type AITextProvider,
	type AITextPurpose
} from './text-generation-contract';

// Tomma frivilliga syftesval faller tillbaka på den befintliga gemensamma
// inställningen. Utan syftesval gäller samma gemensamma inställning och standard som tidigare.
function resolveTextModel(override: string | undefined): string {
	return (override?.trim() || env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim();
}

// Provider/model selection is composition, not product behaviour. The core
// only receives a neutral model policy for the requested MittPsyke purpose.
const modelConfigurations: Record<AITextPurpose, AIModelConfiguration> = {
	'support-chat': {
		model: resolveTextModel(env.OPENAI_SUPPORT_CHAT_MODEL),
		timeoutMs: 25_000,
		maxOutputTokens: 500
	},
	'diary-reflection': {
		model: resolveTextModel(env.OPENAI_DIARY_REFLECTION_MODEL),
		timeoutMs: 8_000,
		maxOutputTokens: 150
	},
	'checkin-reflection': {
		model: resolveTextModel(env.OPENAI_CHECKIN_REFLECTION_MODEL),
		timeoutMs: 12_000,
		maxOutputTokens: 260
	},
	'diary-narrative': {
		model: resolveTextModel(env.OPENAI_DIARY_NARRATIVE_MODEL),
		timeoutMs: 20_000,
		maxOutputTokens: 900
	},
	'user-memory': {
		model: resolveTextModel(env.OPENAI_USER_MEMORY_MODEL),
		timeoutMs: 12_000,
		maxOutputTokens: 400
	}
};

/**
 * Granskar de upplösta modellvalen en gång när modulen laddas. Felet stoppar
 * inte uppstarten - anropet för det syftet ger ett konfigurationsfel i stället -
 * men raden gör ett felaktigt modellval synligt direkt efter en deploy. Ett
 * värde som inte är godkänt loggas aldrig: även en kort nyckel kan se ut som
 * ett giltigt modell-ID.
 */
export function reportModelConfigurationProblems(
	configurations: Readonly<Record<string, AIModelConfiguration>> = modelConfigurations
): number {
	let problems = 0;
	for (const [purpose, configuration] of Object.entries(configurations)) {
		if (!configuration.model) continue;
		const validation = validateOpenAITextModel(configuration.model);
		if (validation.ok) continue;
		problems += 1;
		console.error('[ai:config]', {
			purpose,
			model: null,
			kind: 'configuration',
			providerCode: validation.reason
		});
	}
	return problems;
}

reportModelConfigurationProblems();

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
