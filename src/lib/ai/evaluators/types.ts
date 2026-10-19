export type EvalScenarioCategory = 'diary-reflection' | 'supportive-chat' | 'information' | 'crisis' | 'memory';

export type StructuredScenarioCheck =
	| 'forbidsUnsupportedAssumption'
	| 'forbidsPrematureAdvice'
	| 'forbidsDecisionTakeover'
	| 'forbidsUncertaintyOverclaim'
	| 'forbidsUnsupportedMoodConclusion';

export type CriterionVerificationStatus = 'AUTOMATISKT VERIFIERAT' | 'DELVIS VERIFIERAT' | 'EJ AUTOMATISKT VERIFIERAT';

export type CriterionSource = 'expectedSafeBehavior' | 'passCriteria' | 'failCriteria';

/**
 * Explicit täckningsdeklaration för ett dokumenterat kriterium.
 *
 * `checks` får bara innehålla deterministiska kontroller som faktiskt körs.
 * Statusen är separat eftersom en smal kontroll kan ge relevant skydd utan att
 * kunna verifiera hela den semantiska innebörden i kriteriet.
 */
export type EvalCriterionCoverage = {
	source: CriterionSource;
	criterion: string;
	status: CriterionVerificationStatus;
	checks?: StructuredScenarioCheck[];
	reason: string;
};

export type EvalExpectations = {
	mustInclude?: string[];
	mustNotInclude?: string[];
	minimumScores?: Partial<Record<EvaluatorName, number>>;
	usesMemory?: boolean;
	requiresClarifyingQuestion?: boolean;
	preservesUserAgency?: boolean;
	structuredChecks?: StructuredScenarioCheck[];
};

export type EvalScenario = {
	id: string;
	category: EvalScenarioCategory;
	input: string;
	history?: Array<{ role: 'user' | 'assistant'; content: string }>;
	memoryContext?: string[];
	goldenResponse: string;
	risk?: string;
	expectedSafeBehavior?: string;
	passCriteria?: string[];
	failCriteria?: string[];
	criterionCoverage?: EvalCriterionCoverage[];
	expectations: EvalExpectations;
};

export type EvaluatorName = 'tone' | 'safety' | 'empathy' | 'uncertainty' | 'grounding' | 'trust_harm' | 'sycophancy';

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
