import { describe, expect, it, vi } from 'vitest';
import type { AITextProvider } from '../../src/lib/server/ai/text-generation';
import { loadEvalScenarios } from './fixtures';
import { requireConfiguredLiveProvider, runLiveModelEvaluation } from './live-eval-runner';

// Krisfallen stoppas av den deterministiska guarden och når aldrig providern.
// Talet härleds ur fixtures, så ett nytt scenario inte fäller testet av misstag.
const ALL_SCENARIOS = loadEvalScenarios().length;
const PROVIDER_CALLS = loadEvalScenarios().filter((scenario) => scenario.category !== 'crisis').length;

describe('live AI-eval', () => {
	it('väljer den uttryckligt konfigurerade providern och använder produkt-entrypointen', async () => {
		const provider: AITextProvider = {
			generate: vi.fn().mockResolvedValue('Ensamhet kan kännas tung. Vad känns mest just nu?')
		};

		const run = await runLiveModelEvaluation({
			provider,
			providerName: 'mock-configured-provider',
			writeReport: false
		});

		expect(provider.generate).toHaveBeenCalledTimes(PROVIDER_CALLS);
		expect(provider.generate).toHaveBeenCalledWith(
			expect.objectContaining({
			purpose: 'diary-reflection',
			messages: expect.arrayContaining([expect.objectContaining({ content: expect.stringContaining('Jag känner mig tom idag.') })])
		})
		);
		expect(run.scenarios).toHaveLength(ALL_SCENARIOS);
		expect(run.scenarios.filter((item) => item.deterministic)).toHaveLength(4);
	});

	it('failar före scenarioanrop när provider saknar konfiguration', () => {
		expect(() => requireConfiguredLiveProvider(() => false, () => ({ generate: vi.fn() }))).toThrow(
			'Live-eval kräver en konfigurerad AI-provider'
		);
	});

	it('låter krisguarden stoppa den injicerade live-providern', async () => {
		const provider: AITextProvider = { generate: vi.fn().mockResolvedValue('Får inte användas') };

		const run = await runLiveModelEvaluation({ provider, writeReport: false });

		expect(run.scenarios[0]).toMatchObject({ deterministic: true, model: null, providerCalled: false, providerRequests: [] });
		expect(provider.generate).toHaveBeenCalledTimes(PROVIDER_CALLS);
	});

	it('har ett separat live-kommando som inte ligger i vanliga Vitest-include', async () => {
		const packageJson = await import('../../package.json');
		const source = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../vite.config.ts', import.meta.url), 'utf8'));

		expect(packageJson.default.scripts['ai:eval:live']).toContain('live-eval.vitest.config.ts');
		expect(source).not.toContain('live-eval.live.ts');
	});
});
