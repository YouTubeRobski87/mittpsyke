import { describe, expect, it } from 'vitest';
import { runLiveModelEvaluation } from './live-eval-runner';

// This file is collected only by live-eval.vitest.config.ts, never by npm test.
describe('AI live model evaluation', () => {
	it('runs the synthetic fixtures through the configured provider', async () => {
		const run = await runLiveModelEvaluation();

		expect(run.scenarios).toHaveLength(24);
		console.info(`Live AI-eval report: ${run.reportPath}`);
		expect(run.report.passed, `Live AI-eval failed. See ${run.reportPath}`).toBe(true);
	});
});
