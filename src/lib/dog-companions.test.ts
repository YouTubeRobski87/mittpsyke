import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
	PROGRESS_COMPANION_ANIMALS,
	getProgressCompanionArtId,
	getProgressCompanionDisplayName,
	getWorldCompanionId,
	readProgressCompanionFromMetadata
} from './progressCompanion';
import {
	AUSTRALISK_SHEPHERD_COMPANION_POSES,
	COMPANION_POSES,
	COMPANION_SCENE_POSITIONS,
	DASHBOARD_CABIN_COMPANION_PLACEMENTS,
	SCHAFER_COMPANION_POSES,
	type CompanionPoseDaypart
} from './companionPoseManifest';
import { getCompanionBasePose } from './companionPoseState';

// Schäfer och Australisk shepherd är statiska följeslagare med en pose vardera.
// Det viktigaste regressionsskyddet: de får aldrig falla tillbaka på en rävpose,
// eftersom getFallbackPose() i sista hand returnerar COMPANION_POSES[0].

const DOGS = [
	{
		id: 'schafer',
		displayName: 'Schäfer',
		poseId: 'schafer-static',
		preset: '/images/avatars/presets/schafer.png',
		scene: '/images/scenes/schafer.png',
		poses: SCHAFER_COMPANION_POSES
	},
	{
		id: 'australisk_shepherd',
		displayName: 'Australisk shepherd',
		poseId: 'australisk-shepherd-static',
		preset: '/images/avatars/presets/australisk_shepherd.png',
		scene: '/images/scenes/australisk_shepherd.png',
		poses: AUSTRALISK_SHEPHERD_COMPANION_POSES
	}
] as const;

const DAYPARTS: CompanionPoseDaypart[] = ['day', 'evening', 'night'];
const FOX_POSE_IDS = new Set(
	COMPANION_POSES.filter((pose) => (pose.companionId ?? 'fox') === 'fox').map((pose) => pose.id)
);

describe.each(DOGS)('$displayName som följeslagare', (dog) => {
	it('är ett accepterat companion-ID och överlever metadata-läsning', () => {
		const selection = readProgressCompanionFromMetadata({ progress_companion: dog.id });

		expect(selection).not.toBeNull();
		expect(selection?.id).toBe(dog.id);
	});

	it('behåller sitt ID genom lagring och återläsning', () => {
		// Så som värdet faktiskt ligger i user_metadata efter ett val.
		const stored = { preferences: { companion: { id: dog.id, name: dog.displayName } } };

		expect(readProgressCompanionFromMetadata(stored)?.id).toBe(dog.id);
	});

	it('finns bland valbara följeslagare med rätt visningsnamn', () => {
		const entry = PROGRESS_COMPANION_ANIMALS.find((animal) => animal.id === dog.id);

		expect(entry).toBeDefined();
		expect(entry?.name).toBe(dog.displayName);
		expect(getProgressCompanionDisplayName(dog.id)).toBe(dog.displayName);
	});

	it('har exakt en pose, kopplad till rätt companionId', () => {
		expect(dog.poses).toHaveLength(1);
		expect(dog.poses[0].id).toBe(dog.poseId);
		expect(dog.poses[0].companionId).toBe(dog.id);
		expect(dog.poses[0].role).toBe('base');
	});

	it('posen använder rätt scene-asset, och filen finns', () => {
		expect(dog.poses[0].frames).toHaveLength(1);
		expect(dog.poses[0].frames[0].src).toBe(dog.scene);
		expect(existsSync(join(process.cwd(), 'static', dog.scene))).toBe(true);
	});

	it('preset-bilden för väljaren finns', () => {
		expect(existsSync(join(process.cwd(), 'static', dog.preset))).toBe(true);
	});

	it('posen är giltig under day, evening och night', () => {
		for (const daypart of DAYPARTS) {
			expect(dog.poses[0].dayparts).toContain(daypart);
		}
	});

	it('pose-ID:t accepteras av minst en scenposition', () => {
		const accepting = COMPANION_SCENE_POSITIONS.filter((position) =>
			position.allowedPoseIds.includes(dog.poseId)
		);

		expect(accepting.length).toBeGreaterThan(0);
	});

	it('har dashboard-placement', () => {
		const placement = DASHBOARD_CABIN_COMPANION_PLACEMENTS[dog.id];

		expect(placement).toBeDefined();
		expect(placement.scale).toBeGreaterThan(0);
		expect(Number.isFinite(placement.x)).toBe(true);
		expect(Number.isFinite(placement.y)).toBe(true);
	});

	it('faller ALDRIG tillbaka på en rävpose, oavsett dygnsdel', () => {
		// Klockslag som täcker day, evening och night.
		for (const hour of [9, 13, 18, 23, 3]) {
			const date = new Date(2026, 5, 15, hour, 0, 0);
			const pose = getCompanionBasePose(date, null, dog.id);

			expect(pose.id).toBe(dog.poseId);
			expect(pose.companionId).toBe(dog.id);
			expect(FOX_POSE_IDS.has(pose.id)).toBe(false);
		}
	});

	it('världen väljer hunden, inte räven', () => {
		expect(getWorldCompanionId(dog.id)).toBe(dog.id);
		expect(getProgressCompanionArtId(dog.id)).toBe(dog.id);
	});
});

describe('befintliga följeslagare är oförändrade', () => {
	it.each(['fox', 'bear', 'wolf'])('%s fungerar fortfarande', (id) => {
		expect(readProgressCompanionFromMetadata({ progress_companion: id })?.id).toBe(id);
		expect(getWorldCompanionId(id)).toBe(id);
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS[id as 'fox']).toBeDefined();
	});

	it('deras namn och ordning i listan är intakta', () => {
		const firstThree = PROGRESS_COMPANION_ANIMALS.slice(0, 3);

		expect(firstThree.map((animal) => animal.id)).toEqual(['fox', 'bear', 'wolf']);
		expect(firstThree.map((animal) => animal.name)).toEqual(['Vide', 'Balder', 'Ylva']);
	});

	it('deras dashboard-placement är oförändrad', () => {
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.fox).toEqual({ scale: 0.8, x: 37, y: 91 });
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.wolf).toEqual({ scale: 0.9, x: 37, y: 91 });
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.bear).toEqual({
			scale: 0.68,
			x: 35,
			y: 94,
			compact: { scale: 0.72, x: 31, y: 92 }
		});
	});

	it('räven är fortfarande fallback för okända och poselösa ID:n', () => {
		expect(getWorldCompanionId('finns-inte')).toBe('fox');
		expect(getWorldCompanionId(null)).toBe('fox');
		// Uggla finns som art-ID men saknar poser i världen.
		expect(getWorldCompanionId('owl')).toBe('fox');
	});

	it('okänt ID avvisas fortfarande vid metadata-läsning', () => {
		expect(readProgressCompanionFromMetadata({ progress_companion: 'drake' })).toBeNull();
	});
});

describe('väljaren', () => {
	it('exponerar båda hundarna', () => {
		const source = require('node:fs').readFileSync(
			join(process.cwd(), 'src/lib/components/CompanionSelector.svelte'),
			'utf8'
		) as string;

		for (const dog of DOGS) {
			expect(source).toContain(`'${dog.id}'`);
			expect(source).toContain(dog.preset);
		}
	});
});
