import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
	PROGRESS_SCENE_BANDS,
	PROGRESS_SCENE_SOURCES,
	getProgressSceneBand,
	getProgressSceneLabel,
	parseProgressSceneOverride,
	type ProgressSceneBand
} from './progressScene';

/**
 * Bygger ett datum som motsvarar en viss klockslag i Stockholm. Testerna körs i
 * januari (CET, UTC+1) så omräkningen är entydig och oberoende av sommartid.
 */
function atStockholm(hour: number, minute: number): Date {
	return new Date(Date.UTC(2026, 0, 15, hour - 1, minute));
}

describe('getProgressSceneBand - tidsgränser', () => {
	it.each([
		['04:59', 4, 59, 'evening'],
		['05:00', 5, 0, 'morning'],
		['09:59', 9, 59, 'morning'],
		['10:00', 10, 0, 'day'],
		['16:59', 16, 59, 'day'],
		['17:00', 17, 0, 'afternoon'],
		['19:59', 19, 59, 'afternoon'],
		['20:00', 20, 0, 'evening'],
		['23:59', 23, 59, 'evening']
	] as const)('%s ger %s', (_label, hour, minute, expected) => {
		expect(getProgressSceneBand(atStockholm(hour, minute))).toBe(expected);
	});

	it('täcker dygnets alla timmar utan lucka', () => {
		for (let hour = 0; hour < 24; hour += 1) {
			const band = getProgressSceneBand(atStockholm(hour, 30));
			expect(PROGRESS_SCENE_BANDS).toContain(band);
		}
	});

	it('faller tillbaka på dag när tiden inte går att läsa', () => {
		expect(getProgressSceneBand(new Date(Number.NaN))).toBe('day');
	});
});

describe('varje spann pekar på rätt befintlig assetfil', () => {
	it.each(PROGRESS_SCENE_BANDS)('%s har tre storlekar som finns på disk', (band) => {
		const { fallback, srcset } = PROGRESS_SCENE_SOURCES[band];

		// Fallback ska vara den minsta varianten, inte fullbredd.
		expect(fallback).toBe(`/images/scenes/progress-cabin-lakeside-${band}-800.webp`);

		const expected = [
			`/images/scenes/progress-cabin-lakeside-${band}-800.webp 800w`,
			`/images/scenes/progress-cabin-lakeside-${band}-1200.webp 1200w`,
			`/images/scenes/progress-cabin-lakeside-${band}.webp 1672w`
		].join(', ');
		expect(srcset).toBe(expected);

		for (const entry of srcset.split(', ')) {
			const path = entry.split(' ')[0];
			expect(existsSync(join(process.cwd(), 'static', path))).toBe(true);
		}
		expect(existsSync(join(process.cwd(), 'static', fallback))).toBe(true);
	});

	it('använder aldrig den gamla enbildsscenen', () => {
		for (const band of PROGRESS_SCENE_BANDS) {
			const { srcset, fallback } = PROGRESS_SCENE_SOURCES[band];
			expect(fallback).not.toBe('/images/scenes/progress-cabin-lakeside-800.webp');
			expect(srcset).not.toContain('progress-cabin-lakeside.webp');
			expect(srcset).not.toContain('progress-cabin-lakeside-1200.webp');
		}
	});

	it('ger varje spann en egen bilduppsättning', () => {
		const all = PROGRESS_SCENE_BANDS.map((band) => PROGRESS_SCENE_SOURCES[band].srcset);
		expect(new Set(all).size).toBe(PROGRESS_SCENE_BANDS.length);
	});
});

describe('etikett och alt', () => {
	it.each([
		['morning', 'Morgon'],
		['day', 'Dag'],
		['afternoon', 'Eftermiddag'],
		['evening', 'Kväll']
	] as const)('%s får etiketten %s', (band, label) => {
		expect(getProgressSceneLabel(band as ProgressSceneBand)).toBe(label);
	});

	it('bild och etikett kommer ur samma spann vid varje timme', () => {
		for (let hour = 0; hour < 24; hour += 1) {
			const band = getProgressSceneBand(atStockholm(hour, 15));
			expect(PROGRESS_SCENE_SOURCES[band].srcset).toContain(`-${band}-800.webp`);
			expect(getProgressSceneLabel(band)).toBe(
				{ morning: 'Morgon', day: 'Dag', afternoon: 'Eftermiddag', evening: 'Kväll' }[band]
			);
		}
	});
});

describe('parseProgressSceneOverride', () => {
	it.each(PROGRESS_SCENE_BANDS)('accepterar %s', (band) => {
		expect(parseProgressSceneOverride(band)).toBe(band);
	});

	it.each([null, undefined, '', 'night', 'DAG', 'nonsense'])('avvisar %s', (value) => {
		expect(parseProgressSceneOverride(value)).toBeNull();
	});
});
