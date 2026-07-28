import { describe, expect, it } from 'vitest';
import { getCompanionRelationshipStage, isFoxDeerRelationship } from './companionRelationship';

describe('getCompanionRelationshipStage', () => {
	it.each([
		[0, 0],
		[1, 1],
		[2, 1],
		[3, 2],
		[5, 2],
		[6, 3],
		[9, 3],
		[10, 4],
		[24, 4]
	] as const)('maps %i active weeks to stage %i', (weeks, stage) => {
		expect(getCompanionRelationshipStage(weeks)).toBe(stage);
	});

	it('never regresses as active weeks increase', () => {
		let previous = 0;
		for (let weeks = 0; weeks <= 52; weeks += 1) {
			const stage = getCompanionRelationshipStage(weeks);
			expect(stage).toBeGreaterThanOrEqual(previous);
			previous = stage;
		}
	});
});

describe('fox and deer relationship', () => {
	it('only enables the first pair for the fox', () => {
		expect(isFoxDeerRelationship('fox')).toBe(true);
		expect(isFoxDeerRelationship('bear')).toBe(false);
		expect(isFoxDeerRelationship('wolf')).toBe(false);
	});
});
