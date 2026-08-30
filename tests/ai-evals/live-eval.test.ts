import { describe, expect, it, vi } from 'vitest';
import type { AITextProvider } from '../../src/lib/server/ai/text-generation';
import { requireConfiguredLiveProvider, runLiveModelEvaluation } from './live-eval-runner';

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

		expect(provider.generate).toHaveBeenCalledTimes(20);
		expect(provider.generate).toHaveBeenCalledWith(
			expect.objectContaining({
			purpose: 'diary-reflection',
			messages: expect.arrayContaining([expect.objectContaining({ content: expect.stringContaining('Jag känner mig tom idag.') })])
		})
		);
		expect(run.scenarios).toHaveLength(24);
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
		expect(provider.generate).toHaveBeenCalledTimes(20);
	});

	it('har ett separat live-kommando som inte ligger i vanliga Vitest-include', async () => {
		const packageJson = await import('../../package.json');
		const source = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../vite.config.ts', import.meta.url), 'utf8'));

		expect(packageJson.default.scripts['ai:eval:live']).toContain('live-eval.vitest.config.ts');
		expect(source).not.toContain('live-eval.live.ts');
	});
});
