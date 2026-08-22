import { _buildSupportChatRequest, _resolveDeterministicChatGuard } from '../../src/routes/api/chat/+server';
import { buildDiaryReflectionRequest } from '../../src/lib/server/ai/diary-reflection';
import {
	generateAIText,
	type AITextProvider,
	type AITextProviderRequest
} from '../../src/lib/server/ai/text-generation';
import { formatMemoriesForPrompt, type UserMemory } from '../../src/lib/server/user-memory';
import type { EvalScenario } from '../../src/lib/ai/evaluators/types';

export type ProductFlowResult = {
	response: string;
	deterministic: boolean;
	providerRequests: AITextProviderRequest[];
};

function buildMemoryContextBlock(memoryContext: string[] | undefined) {
	const memories: UserMemory[] = (memoryContext ?? []).map((content, index) => ({
		id: `eval-memory-${index + 1}`,
		content,
		created_at: '2026-01-01T00:00:00.000Z'
	}));
	const block = formatMemoriesForPrompt(memories);
	return block ? [block] : [];
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
	const result = await generateAIText(request, provider);
	return { response: result.text, deterministic: false, providerRequests };
}
