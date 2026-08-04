import { describe, expect, it } from 'vitest';
import {
	getLivingWorldReflectionCopy,
	LIVING_WORLD_REFLECTION_FALLBACK_COPY
} from './livingWorldCopy';

describe('getLivingWorldReflectionCopy', () => {
	it.each([278, 2])('shows a trustworthy entry count (%s)', (entryCount) => {
		expect(getLivingWorldReflectionCopy(entryCount)).toBe(
			`Din plats har vuxit genom ${entryCount} sparade reflektioner.`
		);
	});

	it.each([0, null, undefined, Number.NaN, -1])('uses fallback for unavailable entry count (%s)', (entryCount) => {
		expect(getLivingWorldReflectionCopy(entryCount)).toBe(LIVING_WORLD_REFLECTION_FALLBACK_COPY);
	});
});
