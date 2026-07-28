import { describe, expect, it } from 'vitest';
import {
	FOX_DEER_RELATIONSHIP,
	getCompanionRelationshipStage,
	getFriendPairing,
	getFriendStageAsset,
	isFoxDeerRelationship
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

describe('fox and deer relationship', () => {
	it('only enables the first pair for the fox', () => {
		expect(isFoxDeerRelationship('fox')).toBe(true);
		expect(isFoxDeerRelationship('bear')).toBe(false);
		expect(isFoxDeerRelationship('wolf')).toBe(false);
	});
});

describe('getFriendStageAsset', () => {
	it('returns nothing for every stage while the assets are still missing', () => {
		// Skyddar produktionen: så länge flaggan är false får inget steg peka
		// ut en bildfil, oavsett hur långt användaren kommit.
		expect(FOX_DEER_RELATIONSHIP.assetsAvailable).toBe(false);
		for (const stage of [0, 1, 2, 3, 4] as const) {
			expect(getFriendStageAsset('fox', stage)).toBeNull();
		}
	});

	it('never returns an asset for companions without a friend pair', () => {
		for (const stage of [0, 1, 2, 3, 4] as const) {
			expect(getFriendStageAsset('bear', stage)).toBeNull();
			expect(getFriendStageAsset('wolf', stage)).toBeNull();
			expect(getFriendStageAsset(null, stage)).toBeNull();
			expect(getFriendStageAsset(undefined, stage)).toBeNull();
		}
	});

	it('keeps stages 0 and 1 free of any deer imagery', () => {
		// Steg 1 ska bara vara AmbientWorlds naturtecken - aldrig ett djur.
		expect(FOX_DEER_RELATIONSHIP.stageAssets[0]).toBeUndefined();
		expect(FOX_DEER_RELATIONSHIP.stageAssets[1]).toBeUndefined();
	});

	it('defines a distinct asset for every visible stage, including stage 4', () => {
		// Stage 4 måste ha en egen bild. Saknas den skulle rådjuret försvinna
		// för den som kommit längst, vilket vore en nedgradering.
		const stageAssets = FOX_DEER_RELATIONSHIP.stageAssets;
		for (const stage of [2, 3, 4] as const) {
			expect(stageAssets[stage]?.src).toMatch(/^\/images\/world\/friends\/.+\.webp$/);
			expect(stageAssets[stage]?.alt).toBe('');
		}
		expect(stageAssets[2]?.position.id).toBe('shore-far');
		expect(stageAssets[3]?.position.id).toBe('shore-near');
		expect(stageAssets[4]?.position.id).toBe('shore-foreground');
	});

	it('moves the friend steadily closer with each stage', () => {
		const stageAssets = FOX_DEER_RELATIONSHIP.stageAssets;
		const positions = [2, 3, 4].map((stage) => stageAssets[stage as 2 | 3 | 4]!.position);

		for (let i = 1; i < positions.length; i += 1) {
			// Större skala, längre ner i bild och tydligare = närmare.
			expect(positions[i].scale).toBeGreaterThan(positions[i - 1].scale);
			expect(positions[i].y).toBeGreaterThan(positions[i - 1].y);
			expect(positions[i].opacity).toBeGreaterThan(positions[i - 1].opacity);
		}
	});

	it('never places the friend where the companion stands', () => {
		// Följeslagaren står på x78 (foreground-right). Vännen måste hålla sig
		// tydligt åt vänster, annars överlappar de.
		const companionX = 78;
		for (const stage of [2, 3, 4] as const) {
			expect(FOX_DEER_RELATIONSHIP.stageAssets[stage]!.position.x).toBeLessThan(companionX - 10);
		}
	});
});

describe('getFriendPairing', () => {
	it('resolves the fox pairing and nothing else yet', () => {
		expect(getFriendPairing('fox')?.friendId).toBe('deer');
		expect(getFriendPairing('bear')).toBeNull();
		expect(getFriendPairing('wolf')).toBeNull();
		expect(getFriendPairing(null)).toBeNull();
		expect(getFriendPairing(undefined)).toBeNull();
	});

	it('exposes pairings as data so a new friend needs no component change', () => {
		const pairing = getFriendPairing('fox');
		expect(pairing).toMatchObject({
			companionId: expect.any(String),
			friendId: expect.any(String),
			assetsAvailable: expect.any(Boolean)
		});
		expect(pairing?.stageAssets).toBeTypeOf('object');
	});
});
