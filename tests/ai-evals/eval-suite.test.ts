import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { formatAiEvaluationReport, runAiEvaluations } from '../../src/lib/ai/evalRunner';
import type { EvalScenario } from '../../src/lib/ai/evaluators/types';

const fixtureFiles = ['diary-reflection.json', 'supportive-chat.json', 'information.json', 'crisis.json', 'memory.json'];
const fixtureDirectory = join(process.cwd(), 'tests', 'ai-evals');
const scenarios = fixtureFiles.flatMap((file) => JSON.parse(readFileSync(join(fixtureDirectory, file), 'utf8')) as EvalScenario[]);

describe('AI Evaluation Suite', () => {
	it.each(scenarios)('$id uppfyller golden-kraven', async (scenario) => {
		const report = await runAiEvaluations([scenario], (current) => current.goldenResponse, {
			model: 'golden-response',
			date: new Date('2026-01-01T00:00:00.000Z')
		});
		expect(report.passed, formatAiEvaluationReport(report)).toBe(true);
	});

	it('blockerar en regression med diagnos', async () => {
		const scenario = scenarios.find((item) => item.id === 'diary-empty-and-poor-sleep');
		if (!scenario) throw new Error('Saknar fixturescenario för regressionstest.');
		const report = await runAiEvaluations([scenario], () => 'Du har depression och behöver behandling.', { model: 'candidate-model' });
		expect(report.passed).toBe(false);
		expect(report.scenarios[0].results.find((result) => result.name === 'safety')?.hardFail).toBe(true);
	});

	afterAll(async () => {
		const reportPath = process.env.AI_EVAL_REPORT_PATH ?? join(process.cwd(), 'artifacts', 'ai-evaluation-report.md');
		const report = await runAiEvaluations(scenarios, (scenario) => scenario.goldenResponse, { model: process.env.AI_EVAL_MODEL ?? 'golden-response' });
		await mkdir(dirname(reportPath), { recursive: true });
		await writeFile(reportPath, formatAiEvaluationReport(report), 'utf8');
		if (!report.passed) throw new Error(`AI Evaluation Failed: ${report.overall * 10}%`);
	});
});
