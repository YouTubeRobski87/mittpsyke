import { describe, expect, it } from 'vitest';
import {
	EVENING_CHECKIN_FLOW_VERSION,
	EVENING_PARKING_BUCKETS,
	EVENING_THEMES,
	MAX_EVENING_THOUGHT_LENGTH,
	canAdvanceEveningFlow,
	validateEveningCheckinInput
} from './evening-checkin';

const validInput = {
	themeId: 'racing_thoughts',
	thought: 'Jag tänker mycket på imorgon.',
	parkingBucket: 'tomorrow',
	flowVersion: EVENING_CHECKIN_FLOW_VERSION
};

describe('Kvällslugns datakontrakt', () => {
	it('har de avsedda, kontrollerade tema- och parkeringsvärdena', () => {
		expect(EVENING_THEMES.map((theme) => theme.id)).toEqual([
			'racing_thoughts',
			'body_anxiety',
			'loneliness',
			'tomorrow',
			'other'
		]);
		expect(EVENING_PARKING_BUCKETS.map((bucket) => bucket.id)).toEqual([
			'tomorrow',
			'small_step',
			'not_tonight'
		]);
	});

	it('godkänner ett tema, frivillig tanke och ett parkeringsval', () => {
		expect(validateEveningCheckinInput(validInput)).toEqual({ ok: true, data: validInput });
	});

	it('normaliserar tom frivillig tanke till null', () => {
		const result = validateEveningCheckinInput({ ...validInput, thought: '   ' });
		expect(result).toEqual({ ok: true, data: { ...validInput, thought: null } });
	});

	it('avvisar okända enumvärden och fel flödesversion', () => {
		expect(validateEveningCheckinInput({ ...validInput, themeId: 'stress' }).ok).toBe(false);
		expect(validateEveningCheckinInput({ ...validInput, parkingBucket: 'solve_all' }).ok).toBe(false);
		expect(validateEveningCheckinInput({ ...validInput, flowVersion: 'v0' }).ok).toBe(false);
	});

	it('avvisar icke-text och fritext över längdgränsen', () => {
		expect(validateEveningCheckinInput({ ...validInput, thought: ['inte text'] }).ok).toBe(false);
		expect(
			validateEveningCheckinInput({ ...validInput, thought: 'a'.repeat(MAX_EVENING_THOUGHT_LENGTH + 1) }).ok
		).toBe(false);
	});

	it('håller flödet till en fråga i taget och gör fritexten frivillig', () => {
		const empty = { themeId: null, parkingBucket: null };
		expect(canAdvanceEveningFlow(1, empty)).toBe(false);
		expect(canAdvanceEveningFlow(1, { ...empty, themeId: 'other' })).toBe(true);
		expect(canAdvanceEveningFlow(2, empty)).toBe(true);
		expect(canAdvanceEveningFlow(3, empty)).toBe(false);
		expect(canAdvanceEveningFlow(3, { ...empty, parkingBucket: 'not_tonight' })).toBe(true);
		expect(canAdvanceEveningFlow(4, { themeId: 'other', parkingBucket: 'not_tonight' })).toBe(false);
	});
});
