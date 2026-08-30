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

/**
 * Antalet är avsiktligt hårdkodat. Grinden finns för att ingenting utöver de
 * granskade, syntetiska fixtures ska kunna skickas till en riktig provider, och
 * ett tal som räknas fram automatiskt hade skyddat mot ingenting. Höj det bara
 * tillsammans med ett nytt scenario som faktiskt granskats.
 */
const EXPECTED_SYNTHETIC_FIXTURES = 25;

export function assertSyntheticEvalFixtures(scenarios: readonly EvalScenario[]) {
	if (scenarios.length !== EXPECTED_SYNTHETIC_FIXTURES) {
		throw new Error(
			`Live-eval kräver exakt ${EXPECTED_SYNTHETIC_FIXTURES} syntetiska scenarier, fick ${scenarios.length}.`
		);
	}

	const ids = new Set(scenarios.map((scenario) => scenario.id));
	if (ids.size !== scenarios.length || scenarios.some((scenario) => !scenario.id.trim() || !scenario.input.trim())) {
		throw new Error('Live-eval-fixtures saknar unika scenario-id eller syntetisk input.');
	}
}
