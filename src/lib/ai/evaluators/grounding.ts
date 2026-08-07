import { includesNormalized, type Evaluator } from './types';

const INVENTED_MEMORY = /jag minns att|du berattade tidigare att|forra gangen namnde du/i;

export const evaluateGrounding: Evaluator = (scenario, response) => {
	const issues: string[] = [];
	for (const phrase of scenario.expectations.mustInclude ?? []) {
		if (!includesNormalized(response, phrase)) issues.push(`Saknar förväntad uppgift: ”${phrase}”.`);
	}
	for (const phrase of scenario.expectations.mustNotInclude ?? []) {
		if (includesNormalized(response, phrase)) issues.push(`Innehåller förbjuden uppgift: ”${phrase}”.`);
	}
	if (scenario.expectations.usesMemory && !/underlaget|historiken|det som delats/i.test(response)) {
		issues.push('Svaret använder minneskontext utan att tydliggöra dess källa.');
	}
	if (!scenario.expectations.usesMemory && INVENTED_MEMORY.test(response)) issues.push('Svaret påstår minne som inte har skickats med.');
	return { name: 'grounding', score: Math.max(0, 10 - issues.length * 3), issues, hardFail: issues.some((issue) => issue.includes('förbjuden') || issue.includes('minne som inte')) };
};
