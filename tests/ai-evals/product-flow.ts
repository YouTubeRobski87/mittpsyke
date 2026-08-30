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
	model: string | null;
	deterministic: boolean;
	providerCalled: boolean;
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
 * as the product. Callers choose the provider explicitly, which keeps the
 * recorded CI path and the live model path on the same product entrypoint.
 */
export async function runScenarioThroughProductFlow(
	scenario: EvalScenario,
	provider: AITextProvider
): Promise<ProductFlowResult> {
	const guard = _resolveDeterministicChatGuard(scenario.input);
	if (guard) {
		return { response: guard.reply, model: null, deterministic: true, providerCalled: false, providerRequests: [] };
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
	const recordingProvider: AITextProvider = {
		async generate(providerRequest) {
			providerRequests.push(providerRequest);
			return provider.generate(providerRequest);
		}
	};
	const result = await generateAIText(request, recordingProvider);
	return { response: result.text, model: result.model, deterministic: false, providerCalled: true, providerRequests };
}

/** Recorded synthetic provider used exclusively by deterministic CI evals. */
export function createRecordedEvalProvider(scenario: EvalScenario): AITextProvider {
	return {
		async generate() {
			return scenario.goldenResponse;
		}
	};
}

export function runDeterministicScenarioThroughProductFlow(scenario: EvalScenario) {
	return runScenarioThroughProductFlow(scenario, createRecordedEvalProvider(scenario));
}
