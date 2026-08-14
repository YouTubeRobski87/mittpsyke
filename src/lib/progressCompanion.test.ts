import { describe, expect, it } from 'vitest';
import {
	PROGRESS_COMPANION_ANIMALS,
	getProgressCompanionDisplayName
} from './progressCompanion';

describe('companion display names', () => {
	it.each([
		['fox', 'Vide'],
		['bear', 'Balder'],
		['wolf', 'Ylva']
	] as const)('maps %s to %s', (id, displayName) => {
		expect(getProgressCompanionDisplayName(id)).toBe(displayName);
	});

	it('keeps the technical species IDs unchanged', () => {
		expect(PROGRESS_COMPANION_ANIMALS.slice(0, 3).map((companion) => companion.id)).toEqual([
			'fox',
			'bear',
			'wolf'
		]);
	});

	it('formats an unknown companion ID safely', () => {
		expect(getProgressCompanionDisplayName('river-otter')).toBe('River otter');
		expect(getProgressCompanionDisplayName(null)).toBe('Din följeslagare');
	});
});
