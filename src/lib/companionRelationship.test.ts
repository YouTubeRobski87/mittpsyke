import { describe, expect, it } from 'vitest';
import {
	FRIEND_SCENE_POSITIONS,
	getCompanionRelationshipStage,
	getFriendPairing,
	getFriendStageAsset
} from './companionRelationship';

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

// Räven och rådjuret var det enda vänparet. Räven är inte längre följeslagare,
// så registret är tomt: ingen följeslagare får en vän i scenen förrän ett nytt
// par medvetet läggs till.
describe('vänregistret', () => {
	it('har inget vänpar för björnen eller de borttagna följeslagarna', () => {
		for (const companionId of ['bear', 'fox', 'wolf', 'schafer', 'australisk_shepherd', null, undefined]) {
			expect(getFriendPairing(companionId)).toBeNull();
		}
	});

	it('returnerar aldrig en vänbild, oavsett steg', () => {
		for (const stage of [0, 1, 2, 3, 4] as const) {
			expect(getFriendStageAsset('bear', stage)).toBeNull();
			expect(getFriendStageAsset('fox', stage)).toBeNull();
		}
	});

	it('håller vännens positioner tydligt vänster om björnen', () => {
		// Björnen står på x78 (foreground-right). En framtida vän får inte
		// hamna ovanpå den.
		for (const position of Object.values(FRIEND_SCENE_POSITIONS)) {
			expect(position.x).toBeLessThan(78 - 10);
		}
	});
});
