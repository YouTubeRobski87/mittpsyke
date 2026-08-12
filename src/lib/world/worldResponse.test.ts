import { describe, expect, it } from 'vitest';
import {
	WORLD_RESPONSE_DELAY_MS,
	WORLD_RESPONSE_DURATION_MS,
	getWorldResponseMode,
	shouldTriggerWorldResponse,
	type WorldResponseTrigger
} from './worldResponse';
import { getGardenGrowthPoints, getGrowthLevel } from '$lib/worldScene';

function trigger(overrides: Partial<WorldResponseTrigger> = {}): WorldResponseTrigger {
	return {
		isAnonymous: false,
		previousStatus: 'pending',
		answerId: 'calm',
		requestOk: true,
		...overrides
	};
}

describe('shouldTriggerWorldResponse', () => {
	it('svarar på dagens första faktiska svar', () => {
		expect(shouldTriggerWorldResponse(trigger())).toBe(true);
	});

	it('svarar inte på hoppa över', () => {
		expect(shouldTriggerWorldResponse(trigger({ answerId: null }))).toBe(false);
	});

	it('svarar inte när anropet misslyckats', () => {
		expect(shouldTriggerWorldResponse(trigger({ requestOk: false }))).toBe(false);
	});

	it('svarar inte på en dag som redan är hanterad', () => {
		// Täcker load, refresh och navigation tillbaka samma dag: status är då
		// aldrig 'pending' längre, så vägen hit kan inte utlösa någon respons.
		expect(shouldTriggerWorldResponse(trigger({ previousStatus: 'answered' }))).toBe(false);
		expect(shouldTriggerWorldResponse(trigger({ previousStatus: 'skipped' }))).toBe(false);
		expect(shouldTriggerWorldResponse(trigger({ previousStatus: null }))).toBe(false);
	});

	it('svarar aldrig för anonyma besökare', () => {
		expect(shouldTriggerWorldResponse(trigger({ isAnonymous: true }))).toBe(false);
	});
});

describe('getWorldResponseMode', () => {
	it('rör sig normalt, men står stilla vid reducerad rörelse', () => {
		expect(getWorldResponseMode(false)).toBe('motion');
		expect(getWorldResponseMode(true)).toBe('still');
	});
});

describe('tider', () => {
	it('håller sig kort och startar strax efter följeslagarens reaktion', () => {
		expect(WORLD_RESPONSE_DURATION_MS).toBeGreaterThanOrEqual(1_000);
		expect(WORLD_RESPONSE_DURATION_MS).toBeLessThanOrEqual(2_000);
		expect(WORLD_RESPONSE_DELAY_MS).toBeLessThanOrEqual(300);
	});
});

describe('världens svar och trädgården', () => {
	it('påverkar inte tillväxtunderlaget - responsen är rent kosmetisk', () => {
		const before = getGardenGrowthPoints(12, 1);
		// Oavsett om världen svarar eller inte är underlaget detsamma: modulen
		// matar ingenting in i trädgården.
		expect(shouldTriggerWorldResponse(trigger())).toBe(true);
		expect(getGardenGrowthPoints(12, 1)).toBe(before);
		expect(getGrowthLevel(getGardenGrowthPoints(12, 1))).toBe(getGrowthLevel(before));
	});

	it('lämnar trösklarna orörda', () => {
		expect(getGrowthLevel(0)).toBe(0);
		expect(getGrowthLevel(1)).toBe(1);
		expect(getGrowthLevel(6)).toBe(2);
		expect(getGrowthLevel(16)).toBe(3);
		expect(getGrowthLevel(31)).toBe(4);
	});
});
