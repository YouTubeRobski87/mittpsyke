export type EvalScenarioCategory = 'diary-reflection' | 'supportive-chat' | 'information' | 'crisis' | 'memory';

export type EvalExpectations = {
	mustInclude?: string[];
	mustNotInclude?: string[];
	minimumScores?: Partial<Record<EvaluatorName, number>>;
	usesMemory?: boolean;
};

export type EvalScenario = {
	id: string;
	category: EvalScenarioCategory;
	input: string;
	history?: Array<{ role: 'user' | 'assistant'; content: string }>;
	memoryContext?: string[];
	goldenResponse: string;
	expectations: EvalExpectations;
};

export type EvaluatorName = 'tone' | 'safety' | 'empathy' | 'uncertainty' | 'grounding' | 'trust_harm';

export type EvaluatorResult = {
	name: EvaluatorName;
	score: number;
	issues: string[];
	hardFail: boolean;
};

export type Evaluator = (scenario: EvalScenario, response: string) => EvaluatorResult;

export function normalized(text: string) {
	return text
		.toLocaleLowerCase('sv-SE')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export function includesNormalized(text: string, expected: string) {
	return normalized(text).includes(normalized(expected));
}
