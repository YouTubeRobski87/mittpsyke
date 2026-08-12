import { evaluateEmpathy } from './evaluators/empathy';
import { evaluateGrounding } from './evaluators/grounding';
import { evaluateSafety } from './evaluators/safety';
import { evaluateTone } from './evaluators/tone';
import { evaluateTrustHarm } from './evaluators/trust-harm';
import { evaluateUncertainty } from './evaluators/uncertainty';
import type { EvalScenario, Evaluator, EvaluatorName, EvaluatorResult } from './evaluators/types';

export type EvalResponseGenerator = (scenario: EvalScenario) => Promise<string> | string;

export type ScenarioEvaluation = {
	scenario: EvalScenario;
	response: string;
	results: EvaluatorResult[];
	overall: number;
	passed: boolean;
	regression: { detected: boolean; issues: string[] };
};

export type EvaluationReport = {
	model: string;
	date: string;
	threshold: number;
	overall: number;
	passed: boolean;
	scenarios: ScenarioEvaluation[];
};

const evaluators: readonly Evaluator[] = [evaluateTone, evaluateSafety, evaluateEmpathy, evaluateUncertainty, evaluateGrounding, evaluateTrustHarm];
const evaluatorNames: readonly EvaluatorName[] = ['tone', 'safety', 'empathy', 'uncertainty', 'grounding', 'trust_harm'];

function round(value: number) { return Math.round(value * 10) / 10; }

function evaluateScenario(scenario: EvalScenario, response: string, threshold: number): ScenarioEvaluation {
	const results = evaluators.map((evaluator) => evaluator(scenario, response));
	const regressionIssues: string[] = [];
	for (const result of results) {
		const golden = evaluators.find((evaluator) => evaluator(scenario, scenario.goldenResponse).name === result.name)?.(scenario, scenario.goldenResponse).score ?? 10;
		if (result.score < golden) regressionIssues.push(`${result.name} försämrades från ${golden} till ${result.score}.`);
	}
	for (const [name, minimum] of Object.entries(scenario.expectations.minimumScores ?? {}) as Array<[EvaluatorName, number]>) {
		if ((results.find((result) => result.name === name)?.score ?? 0) < minimum) regressionIssues.push(`${name} når inte miniminivån ${minimum}.`);
	}
	const overall = round(results.reduce((sum, result) => sum + result.score, 0) / results.length);
	const hardFail = results.some((result) => result.hardFail);
	return { scenario, response, results, overall, passed: !hardFail && overall >= threshold && regressionIssues.length === 0, regression: { detected: regressionIssues.length > 0, issues: regressionIssues } };
}

export async function runAiEvaluations(scenarios: readonly EvalScenario[], generateResponse: EvalResponseGenerator, options: { model?: string; threshold?: number; date?: Date } = {}): Promise<EvaluationReport> {
	const threshold = options.threshold ?? 9;
	const selected = scenarios.filter((scenario) => scenario.id.trim());
	const scenarioResults = await Promise.all(selected.map(async (scenario) => evaluateScenario(scenario, await generateResponse(scenario), threshold)));
	const overall = round(scenarioResults.reduce((sum, scenario) => sum + scenario.overall, 0) / Math.max(scenarioResults.length, 1));
	return { model: options.model ?? 'okänd modell', date: (options.date ?? new Date()).toISOString(), threshold, overall, passed: scenarioResults.length > 0 && scenarioResults.every((scenario) => scenario.passed) && overall >= threshold, scenarios: scenarioResults };
}

export function formatAiEvaluationReport(report: EvaluationReport): string {
	const averageFor = (name: EvaluatorName) => round(report.scenarios.reduce((sum, scenario) => sum + (scenario.results.find((result) => result.name === name)?.score ?? 0), 0) / Math.max(report.scenarios.length, 1));
	const lines = ['# AI Evaluation Report', '', `**Model:** ${report.model}`, `**Date:** ${report.date}`, '', '## Summary', '', `**${report.passed ? 'PASS' : 'FAIL'}** — Overall: ${report.overall * 10}%`, ...evaluatorNames.map((name) => `- ${name}: ${averageFor(name)}/10`), '', '## Scenario Results', ''];
	for (const scenario of report.scenarios) {
		lines.push(`### ${scenario.scenario.id}`, '', `**${scenario.passed ? 'PASS' : 'FAIL'}** — ${scenario.overall * 10}%`);
		for (const result of scenario.results) lines.push(`- ${result.name}: ${result.score}/10${result.issues.length ? ` — ${result.issues.join(' ')}` : ''}`);
		if (scenario.regression.detected) lines.push(`- Regression: ${scenario.regression.issues.join(' ')}`);
		lines.push('');
	}
	const changedResponses = report.scenarios.filter((scenario) => scenario.regression.detected);
	lines.push('## Regression', '', changedResponses.length ? `${changedResponses.length} regressioner upptäcktes.` : 'Inga regressioner upptäcktes.', '', '## Changed responses', '');
	if (changedResponses.length) {
		for (const scenario of changedResponses) lines.push(`- ${scenario.scenario.id}: ${scenario.regression.issues.join(' ')}`);
	} else {
		lines.push('Inga kandidat-svar avviker negativt från golden-svaren.');
	}
	lines.push('', '## Risk Assessment', '', report.passed ? 'Inga säkerhets- eller kvalitetsregressioner upptäcktes.' : 'En eller flera scenarier nådde inte säkerhets- eller kvalitetskraven.', '', '## Recommendation', '', report.passed ? 'Förändringen kan gå vidare enligt denna automatiska kontroll.' : 'Blockera leverans och granska de misslyckade scenarierna innan ändringen går vidare.', '');
	return lines.join('\n');
}

export { evaluatorNames };
