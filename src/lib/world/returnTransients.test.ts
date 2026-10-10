import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getReturnAbsenceBand, getReturnTransients } from './returnTransients';

const ROOT = process.cwd();
const base = {
	season: 'autumn' as const,
	timeOfDay: 'day' as const,
	visitSeed: 'stilla-besok'
};

describe('dekorativa återkomsttecken', () => {
	it('mappar kort och längre frånvaro till grova interna band', () => {
		expect(getReturnAbsenceBand(null)).toBe('recent');
		expect(getReturnAbsenceBand(2)).toBe('recent');
		expect(getReturnAbsenceBand(3)).toBe('few-days');
		expect(getReturnAbsenceBand(13)).toBe('few-days');
		expect(getReturnAbsenceBand(14)).toBe('longer');
	});

	it('visar höstlöv först efter några dagar och högst ett tecken åt gången', () => {
		expect(getReturnTransients({ ...base, daysSinceLastVisit: 2 })).toEqual([]);
		const result = getReturnTransients({ ...base, daysSinceLastVisit: 5 });
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ kind: 'gathered-leaves' });
		expect(result[0].items).toHaveLength(3);
	});

	it('visar bara vinterspår efter längre frånvaro i dagsljus', () => {
		expect(getReturnTransients({ ...base, season: 'winter', daysSinceLastVisit: 13 })).toEqual([]);
		expect(
			getReturnTransients({ ...base, season: 'winter', timeOfDay: 'night', daysSinceLastVisit: 30 })
		).toEqual([]);
		expect(
			getReturnTransients({ ...base, season: 'winter', timeOfDay: 'morning', daysSinceLastVisit: 30 })
		).toEqual([expect.objectContaining({ kind: 'animal-tracks' })]);
	});

	it('är deterministisk och hoppar inte vid rerender', () => {
		const input = { ...base, daysSinceLastVisit: 30 };
		expect(getReturnTransients(input)).toEqual(getReturnTransients(input));
		expect(getReturnTransients(input)).not.toEqual(
			getReturnTransients({ ...input, visitSeed: 'annat-besok' })
		);
	});

	it('kräver befintlig sessionsseed och skapar ingen persistence', () => {
		expect(getReturnTransients({ ...base, daysSinceLastVisit: 30, visitSeed: null })).toEqual([]);
		const source = readFileSync(join(ROOT, 'src/lib/world/returnTransients.ts'), 'utf8');
		expect(source).not.toMatch(/localStorage|sessionStorage|setItem|getItem|fetch\(|analytics/i);
	});

	it('renderar inga siffror, kontroller eller rörelse', () => {
		const component = readFileSync(
			join(ROOT, 'src/lib/components/world/ReturnTransientLayer.svelte'),
			'utf8'
		);
		expect(component).not.toMatch(/<button|<a\s|onclick|onkeydown|@keyframes/i);
		expect(component).toContain('aria-hidden="true"');
		expect(component).toContain('prefers-reduced-motion: reduce');
		expect(component).toContain('pointer-events: none');
	});

	it('har inget beroende till känsligt innehåll eller progression', () => {
		const source = readFileSync(join(ROOT, 'src/lib/world/returnTransients.ts'), 'utf8');
		const selector = source.slice(source.indexOf('export function getReturnTransients'));
		expect(selector).not.toMatch(/mood|diagnos|diary|chat|relationship|growth|progression|entry/i);
	});
});
