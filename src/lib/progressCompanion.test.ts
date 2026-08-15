import { describe, expect, it } from 'vitest';
import {
	getProgressCompanionDayState,
	getProgressCompanionDayStateLabel
} from './progressCompanion';

describe('Framstegs dygnsrytm', () => {
	it.each([
		['05:00', '2026-08-15T03:00:00Z', 'morning', 'Morgon'],
		['09:59', '2026-08-15T07:59:00Z', 'morning', 'Morgon'],
		['10:00', '2026-08-15T08:00:00Z', 'day', 'Dag'],
		['16:59', '2026-08-15T14:59:00Z', 'day', 'Dag'],
		['17:00', '2026-08-15T15:00:00Z', 'evening', 'Eftermiddag'],
		['19:59', '2026-08-15T17:59:00Z', 'evening', 'Eftermiddag'],
		['20:00', '2026-08-15T18:00:00Z', 'night', 'Kväll'],
		['04:59', '2026-08-15T02:59:00Z', 'night', 'Kväll']
	])('%s i Stockholm ger %s', (_time, iso, expectedState, expectedLabel) => {
		const state = getProgressCompanionDayState(new Date(iso));

		expect(state).toBe(expectedState);
		expect(getProgressCompanionDayStateLabel(state)).toBe(expectedLabel);
	});
});
