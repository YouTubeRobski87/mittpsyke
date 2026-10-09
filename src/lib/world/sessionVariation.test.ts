import { describe, expect, it } from 'vitest';
import {
	getCloudSessionVariation,
	getFallingLeafVariation,
	getFoliageLayerVariation,
	getLeafSessionCharacter,
	getWaterLayerVariation
} from './sessionVariation';

describe('sessionvariation för den levande världen', () => {
	it('ger samma molnvariation för samma sessionsseed och lager', () => {
		const input = { durationMs: 96_000, delayMs: -18_000 };
		expect(getCloudSessionVariation('session-a', 'cloud-back', input)).toEqual(
			getCloudSessionVariation('session-a', 'cloud-back', input)
		);
	});

	it('kan ge en annan, men fortsatt lågmäld, molnvariation för en ny session', () => {
		const input = { durationMs: 96_000, delayMs: -18_000 };
		const first = getCloudSessionVariation('session-a', 'cloud-back', input);
		const next = getCloudSessionVariation('session-b', 'cloud-back', input);

		expect(next).not.toEqual(first);
		expect(first.offsetX).toBeGreaterThanOrEqual(-3.5);
		expect(first.offsetX).toBeLessThanOrEqual(3.5);
	});

	it('ger löven samma grundkaraktär under samma session, utan att låsa enskilda löv', () => {
		const first = getLeafSessionCharacter('session-a');
		expect(first).toEqual(getLeafSessionCharacter('session-a'));
		expect(first.spawnMaxX).toBeGreaterThan(first.spawnMinX);
		expect(getLeafSessionCharacter('session-b')).not.toEqual(first);
	});

	it('ger samma sällsynta löv samma bana men varierar mellan event', () => {
		const first = getFallingLeafVariation('session-a', 'wind-1', 'autumn');
		expect(first).toEqual(getFallingLeafVariation('session-a', 'wind-1', 'autumn'));
		expect(getFallingLeafVariation('session-a', 'wind-2', 'autumn')).not.toEqual(first);
		expect(first.durationMs).toBeGreaterThanOrEqual(6_000 * (1.12 - first.depth * 0.18));
		expect(first.durationMs).toBeLessThanOrEqual(12_000 * (1.12 - first.depth * 0.18));
	});

	it('ger varje växtlager en stabil fas, duration och lågmäld vindamplitud', () => {
		const base = { durationMs: 34_000, delayMs: -7_000 };
		const calm = getFoliageLayerVariation('scene-a', 'grass-left', base, 0.18);

		expect(calm).toEqual(getFoliageLayerVariation('scene-a', 'grass-left', base, 0.18));
		expect(getFoliageLayerVariation('scene-a', 'grass-bank', base, 0.18)).not.toEqual(calm);
		expect(calm.durationMs).toBeGreaterThanOrEqual(base.durationMs * 0.93);
		expect(calm.durationMs).toBeLessThanOrEqual(base.durationMs * 1.07);
	});

	it('låter starkare vind öka växtamplituden utan stormiga värden', () => {
		const base = { durationMs: 34_000, delayMs: -7_000 };
		const calm = getFoliageLayerVariation('scene-a', 'grass-left', base, 0);
		const windy = getFoliageLayerVariation('scene-a', 'grass-left', base, 1);

		expect(windy.amplitude).toBeGreaterThan(calm.amplitude);
		expect(calm.amplitude).toBeGreaterThanOrEqual(0.7);
		expect(windy.amplitude).toBeLessThanOrEqual(1.28);
	});

	it('varierar vatten stabilt per lager och följer vind inom ett snävt intervall', () => {
		const base = { durationMs: 64_000, delayMs: -34_000 };
		const calm = getWaterLayerVariation('scene-a', 'water-surface', base, 0);
		const windy = getWaterLayerVariation('scene-a', 'water-surface', base, 1);

		expect(calm).toEqual(getWaterLayerVariation('scene-a', 'water-surface', base, 0));
		expect(windy.motion).toBeGreaterThan(calm.motion);
		expect(calm.motion).toBeGreaterThanOrEqual(0.72);
		expect(windy.motion).toBeLessThanOrEqual(1.18);
	});
});
