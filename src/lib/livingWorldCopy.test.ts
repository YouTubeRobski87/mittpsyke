import { describe, expect, it } from 'vitest';
import {
	getLivingWorldReflectionCopy,
	LIVING_WORLD_REFLECTION_FALLBACK_COPY
} from './livingWorldCopy';

describe('getLivingWorldReflectionCopy', () => {
	it.each([278, 2])('shows a trustworthy entry count (%s)', (entryCount) => {
		expect(getLivingWorldReflectionCopy(entryCount)).toBe(
			`Din plats har vuxit i takt med dina ${entryCount} sparade dagboksinlägg.`
		);
	});

	// Talet är antalet rader i `diary`. "Reflektioner" betyder på andra ställen
	// svar på dagens fråga eller AI-reflektioner, och ingår inte i talet.
	it('names the count after what it counts, and reads right for a single entry', () => {
		expect(getLivingWorldReflectionCopy(1)).toBe(
			'Din plats har vuxit i takt med ditt första sparade dagboksinlägg.'
		);
		expect(getLivingWorldReflectionCopy(5)).not.toContain('reflektioner');
	});

	it.each([0, null, undefined, Number.NaN, -1])('uses fallback for unavailable entry count (%s)', (entryCount) => {
		expect(getLivingWorldReflectionCopy(entryCount)).toBe(LIVING_WORLD_REFLECTION_FALLBACK_COPY);
	});
});
