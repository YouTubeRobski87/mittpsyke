import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EvalScenario } from '../../src/lib/ai/evaluators/types';

const fixtureFiles = [
	'crisis.json',
	'diary-reflection.json',
	'information.json',
	'memory.json',
	'supportive-chat.json'
] as const;

const fixtureDirectory = join(process.cwd(), 'tests', 'ai-evals');

/** Eval fixtures are authored synthetic examples, never production user data. */
export function loadEvalScenarios(): EvalScenario[] {
	return fixtureFiles.flatMap(
		(file) => JSON.parse(readFileSync(join(fixtureDirectory, file), 'utf8')) as EvalScenario[]
	);
}

export function assertSyntheticEvalFixtures(scenarios: readonly EvalScenario[]) {
	if (scenarios.length !== 24) {
		throw new Error(`Live-eval kräver exakt 24 syntetiska scenarier, fick ${scenarios.length}.`);
	}

	const ids = new Set(scenarios.map((scenario) => scenario.id));
	if (ids.size !== scenarios.length || scenarios.some((scenario) => !scenario.id.trim() || !scenario.input.trim())) {
		throw new Error('Live-eval-fixtures saknar unika scenario-id eller syntetisk input.');
	}
}
