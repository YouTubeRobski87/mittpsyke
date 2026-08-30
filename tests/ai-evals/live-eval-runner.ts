import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
	createConfiguredTextProvider,
	hasConfiguredTextProvider
} from '../../src/lib/server/ai/text-generation-provider';
import { AITextGenerationError, type AITextProvider } from '../../src/lib/server/ai/text-generation';
import { formatAiEvaluationReport, runAiEvaluations, type EvaluationReport } from '../../src/lib/ai/evalRunner';
import type { EvalScenario } from '../../src/lib/ai/evaluators/types';
import { assertSyntheticEvalFixtures, loadEvalScenarios } from './fixtures';
import { runScenarioThroughProductFlow, type ProductFlowResult } from './product-flow';

type LiveScenarioResult = ProductFlowResult & {
	scenario: EvalScenario;
	failure: string | null;
};

export type LiveEvalRun = {
	provider: string;
	report: EvaluationReport;
	scenarios: LiveScenarioResult[];
	reportPath: string | null;
};

type LiveEvalOptions = {
	provider?: AITextProvider;
	providerName?: string;
	writeReport?: boolean;
	reportPath?: string;
};

export function requireConfiguredLiveProvider(
	hasProvider = hasConfiguredTextProvider,
	createProvider = createConfiguredTextProvider
): AITextProvider {
	if (!hasProvider()) {
		throw new AITextGenerationError(
			'configuration',
			'Live-eval kräver en konfigurerad AI-provider. Sätt OPENAI_API_KEY innan du kör npm run ai:eval:live.'
		);
	}

	return createProvider();
}

function providerLabel(provider: AITextProvider, explicitName?: string) {
	return explicitName || provider.constructor.name || 'configured-provider';
}

function defaultReportPath() {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	return process.env.AI_LIVE_EVAL_REPORT_PATH ?? join(process.cwd(), 'artifacts', `ai-live-evaluation-${timestamp}.md`);
}

function safeFailure(error: unknown) {
	if (error instanceof AITextGenerationError) return `AI-providerfel: ${error.code}`;
	return 'AI-providerfel: okänt fel';
}

function formatLiveReport(run: Omit<LiveEvalRun, 'reportPath'>) {
	const lines = [
		'# MittPsyke Live AI Evaluation',
		'',
		`**Provider:** ${run.provider}`,
		`**Scenarier:** ${run.scenarios.length} syntetiska fixtures`,
		'',
		'## Summary',
		'',
		formatAiEvaluationReport(run.report),
		'## Golden vs Live',
		''
	];

	for (const item of run.scenarios) {
		const evaluation = run.report.scenarios.find((scenario) => scenario.scenario.id === item.scenario.id);
		lines.push(`### ${item.scenario.id}`, '');
		lines.push(`- Provider called: ${item.providerCalled}`);
		lines.push(`- Model: ${item.model ?? 'deterministisk safety guard'}`);
		lines.push(`- Golden response: ${item.scenario.goldenResponse}`);
		lines.push(`- Live response: ${item.response || '(inget svar)'}`);
		if (item.failure) lines.push(`- Failure: ${item.failure}`);
		if (evaluation) {
			lines.push(`- Eval: ${evaluation.passed ? 'PASS' : 'FAIL'} (${evaluation.overall * 10}%)`);
			for (const result of evaluation.results) {
				lines.push(`  - ${result.name}: ${result.score}/10${result.hardFail ? ' hard fail' : ''}${result.issues.length ? ` - ${result.issues.join(' ')}` : ''}`);
			}
		}
		lines.push('');
	}

	return lines.join('\n');
}

/**
 * Sequential by design: live runs are explicit, bounded and avoid a burst of
 * concurrent provider requests. The product request construction remains in
 * runScenarioThroughProductFlow.
 */
export async function runLiveModelEvaluation(options: LiveEvalOptions = {}): Promise<LiveEvalRun> {
	// The live command is intentionally closed over the reviewed fixtures.
	// Callers cannot pass arbitrary text into a provider through this runner.
	const scenarios = loadEvalScenarios();
	assertSyntheticEvalFixtures(scenarios);

	const provider = options.provider ?? requireConfiguredLiveProvider();
	const providerName = providerLabel(provider, options.providerName);
	const liveResults: LiveScenarioResult[] = [];

	for (const scenario of scenarios) {
		try {
			liveResults.push({
				scenario,
				...(await runScenarioThroughProductFlow(scenario, provider)),
				failure: null
			});
		} catch (error) {
			liveResults.push({
				scenario,
				response: '',
				model: null,
				deterministic: false,
				providerCalled: scenario.category !== 'crisis',
				providerRequests: [],
				failure: safeFailure(error)
			});
		}
	}

	const byId = new Map(liveResults.map((item) => [item.scenario.id, item]));
	const report = await runAiEvaluations(
		scenarios,
		(scenario) => byId.get(scenario.id)?.response ?? '',
		{ model: providerName }
	);
	const shouldWriteReport = options.writeReport ?? true;
	const reportPath = shouldWriteReport ? options.reportPath ?? defaultReportPath() : null;
	const run = { provider: providerName, report, scenarios: liveResults, reportPath };

	if (reportPath) {
		await mkdir(dirname(reportPath), { recursive: true });
		await writeFile(reportPath, formatLiveReport(run), 'utf8');
	}

	return run;
}
