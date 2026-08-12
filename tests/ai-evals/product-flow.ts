import { _buildSupportChatRequest, _resolveDeterministicChatGuard } from '../../src/routes/api/chat/+server';
import { buildDiaryReflectionRequest } from '../../src/lib/server/ai/diary-reflection';
import {
	createAITextGenerator,
	type AITextProvider,
	type AITextProviderRequest
} from '../../src/lib/server/ai/text-generation';
import type { EvalScenario } from '../../src/lib/ai/evaluators/types';

export type ProductFlowResult = {
	response: string;
	deterministic: boolean;
	providerRequests: AITextProviderRequest[];
};

function buildMemoryContextBlock(memoryContext: string[] | undefined) {
	if (!memoryContext?.length) return [];
	return [`Minnesunderlag från det användaren har delat:\n${memoryContext.map((entry) => `- ${entry}`).join('\n')}`];
}

/**
 * Runs an eval through the same deterministic chat guard and request builders
 * as the product. The provider is injected and only returns the fixture's
 * recorded synthetic response, so no sensitive text leaves the test process.
 */
export async function runScenarioThroughProductFlow(scenario: EvalScenario): Promise<ProductFlowResult> {
	const guard = _resolveDeterministicChatGuard(scenario.input);
	if (guard) {
		return { response: guard.reply, deterministic: true, providerRequests: [] };
	}

	if (scenario.category === 'crisis') {
		throw new Error(`Krisscenariot ${scenario.id} passerade den deterministiska krisgrinden.`);
	}

	const request =
		scenario.category === 'diary-reflection'
			? buildDiaryReflectionRequest(scenario.input)
			: _buildSupportChatRequest({
				category: 'G',
				history: scenario.history ?? [],
				message: scenario.input,
				contextBlocks: buildMemoryContextBlock(scenario.memoryContext)
			});
	const providerRequests: AITextProviderRequest[] = [];
	const provider: AITextProvider = {
		async generate(providerRequest) {
			providerRequests.push(providerRequest);
			return scenario.goldenResponse;
		}
	};
	const result = await createAITextGenerator(provider)(request);
	return { response: result.text, deterministic: false, providerRequests };
}
