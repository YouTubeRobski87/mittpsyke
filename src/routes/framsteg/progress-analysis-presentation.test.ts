import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

describe('Framstegsanalysens presentation', () => {
	it('beskriver en månad utan mående som saknat måendeunderlag, inte som avsaknad av aktivitet', () => {
		expect(route).toContain('<span>Inget mående registrerat</span>');
		expect(route).not.toContain('<span>Ingen registrering</span>');
	});

	it('visar en tydlig täckningsnotis när analysen har truncerats', () => {
		expect(route).toContain('{#if progressAnalysis.coverage.truncated}');
		expect(route).toContain('Analysen bygger på en begränsad del av periodens anteckningar.');
	});
});
