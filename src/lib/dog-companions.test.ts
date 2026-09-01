import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	COMPANION_PORTRAIT_IMAGES,
	PROGRESS_COMPANION_ANIMALS,
	getCompanionPortraitSrc,
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
	type CompanionPose,
	type CompanionPoseDaypart
} from './companionPoseManifest';
import { getCompanionBasePose } from './companionPoseState';

// Schäfer och Australisk shepherd använder samma companion-system som räv,
// björn och varg. Viktigaste regressionsskyddet: ett sparat hundval får aldrig
// filtreras bort eller falla tillbaka på en rävpose - getFallbackPose()
// returnerar i sista hand COMPANION_POSES[0], som tillhör räven.

// Hundarna delar fem posesorter. Den sjätte skiljer sig: schäferns assets har
// ingen egen liggande bild, utan en stående sidovy (sideway), medan aussien har
// en riktig lying. Listan hålls därför per hund i stället för som en gemensam
// uppsättning - annars låser testet fast en pose som inte finns som bild.
const SHARED_POSE_KINDS = ['standing', 'sitting', 'resting', 'sleeping', 'playful'] as const;

const DOGS = [
	{
		id: 'schafer',
		displayName: 'Schäfer',
		posePrefix: 'schafer',
		assetPrefix: 'schafer',
		poseKinds: [...SHARED_POSE_KINDS, 'sideway'],
		poses: SCHAFER_COMPANION_POSES as readonly CompanionPose[]
	},
	{
		id: 'australisk_shepherd',
		displayName: 'Australisk shepherd',
		posePrefix: 'australisk-shepherd',
		assetPrefix: 'australisk_shepherd',
		poseKinds: [...SHARED_POSE_KINDS, 'lying'],
		poses: AUSTRALISK_SHEPHERD_COMPANION_POSES as readonly CompanionPose[]
	}
] as const;

const DAYPARTS: CompanionPoseDaypart[] = ['day', 'evening', 'night'];
const FOX_POSE_IDS = new Set(
	COMPANION_POSES.filter((pose) => (pose.companionId ?? 'fox') === 'fox').map((pose) => pose.id)
);

describe.each(DOGS)('$displayName', (dog) => {
	it('är ett accepterat companion-ID och överlever metadata-läsning', () => {
		expect(readProgressCompanionFromMetadata({ progress_companion: dog.id })?.id).toBe(dog.id);
	});

	it('behåller sitt ID genom lagring och återläsning', () => {
		const stored = { preferences: { companion: { id: dog.id, name: dog.displayName } } };

		expect(readProgressCompanionFromMetadata(stored)?.id).toBe(dog.id);
	});

	it('finns bland valbara följeslagare med svenskt visningsnamn', () => {
		const entry = PROGRESS_COMPANION_ANIMALS.find((animal) => animal.id === dog.id);

		expect(entry?.name).toBe(dog.displayName);
		expect(getProgressCompanionDisplayName(dog.id)).toBe(dog.displayName);
	});

	it('har exakt sex poser, alla kopplade till rätt companionId', () => {
		expect(dog.poses).toHaveLength(6);

		for (const pose of dog.poses) {
			expect(pose.companionId).toBe(dog.id);
			expect(pose.role).toBe('base');
			expect(pose.frames).toHaveLength(1);
		}
	});

	it.each(dog.poseKinds)('har posen %s med rätt asset, och filen finns', (kind) => {
		const pose = dog.poses.find((item) => item.id === `${dog.posePrefix}-${kind}`);
		const expectedSrc = `/images/scenes/${dog.assetPrefix}-${kind}.png`;

		expect(pose).toBeDefined();
		expect(pose?.frames[0].src).toBe(expectedSrc);
		expect(existsSync(join(process.cwd(), 'static', expectedSrc))).toBe(true);
	});

	it('använder inte de gamla enbildsassets:en', () => {
		for (const pose of dog.poses) {
			expect(pose.frames[0].src).not.toMatch(/\.webp$/);
			expect(pose.frames[0].src).not.toBe(`/images/scenes/${dog.assetPrefix}.png`);
		}
	});

	it('varje pose-ID accepteras av minst en scenposition', () => {
		for (const pose of dog.poses) {
			const accepting = COMPANION_SCENE_POSITIONS.filter((position) =>
				position.allowedPoseIds.includes(pose.id)
			);

			expect(accepting.length).toBeGreaterThan(0);
		}
	});

	it.each(DAYPARTS)('kan alltid lösa en pose för %s', (daypart) => {
		const covering = dog.poses.filter((pose) => pose.dayparts.includes(daypart));

		expect(covering.length).toBeGreaterThan(0);
	});

	it('har dashboard-placement', () => {
		const placement = DASHBOARD_CABIN_COMPANION_PLACEMENTS[dog.id];

		expect(placement?.scale).toBeGreaterThan(0);
		expect(placement?.compact?.scale).toBeGreaterThan(0);
	});

	it('faller ALDRIG tillbaka på en rävpose, oavsett tid på dygnet', () => {
		for (const hour of [7, 9, 13, 16, 18, 20, 23, 3]) {
			const pose = getCompanionBasePose(new Date(2026, 5, 15, hour, 0, 0), null, dog.id);

			expect(pose.companionId).toBe(dog.id);
			expect(FOX_POSE_IDS.has(pose.id)).toBe(false);
			expect(pose.id.startsWith(dog.posePrefix)).toBe(true);
		}
	});

	it('världen väljer hunden, inte räven', () => {
		expect(getWorldCompanionId(dog.id)).toBe(dog.id);
		expect(getProgressCompanionArtId(dog.id)).toBe(dog.id);
	});

	it('poseval ger mer än bara standing', () => {
		const seen = new Set<string>();

		for (const hour of [7, 9, 13, 16, 18, 20, 23, 3]) {
			const pose = getCompanionBasePose(new Date(2026, 5, 15, hour, 0, 0), null, dog.id);
			seen.add(pose.id);
		}

		expect(seen.size).toBeGreaterThan(1);
	});

	it('sleeping-posen väljs vid natt', () => {
		const nightPose = dog.poses.find((pose) => pose.id === `${dog.posePrefix}-sleeping`);

		expect(nightPose).toBeDefined();
		expect(nightPose?.dayparts).toContain('night');

		const nightPoses = dog.poses.filter((pose) => pose.dayparts.includes('night'));
		const sleepingAmong = nightPoses.some((pose) => pose.id === `${dog.posePrefix}-sleeping`);

		expect(sleepingAmong).toBe(true);
	});
});

describe('befintliga följeslagare är oförändrade', () => {
	it.each(['fox', 'bear', 'wolf'])('%s fungerar fortfarande', (id) => {
		expect(readProgressCompanionFromMetadata({ progress_companion: id })?.id).toBe(id);
		expect(getWorldCompanionId(id)).toBe(id);
	});

	it('deras namn och ordning i listan är intakta', () => {
		const firstThree = PROGRESS_COMPANION_ANIMALS.slice(0, 3);

		expect(firstThree.map((animal) => animal.id)).toEqual(['fox', 'bear', 'wolf']);
		expect(firstThree.map((animal) => animal.name)).toEqual(['Vide', 'Balder', 'Ylva']);
	});

	it('deras dashboard-placement är oförändrad', () => {
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.fox).toEqual({ scale: 0.8, x: 37, y: 91 });
		// Vargens desktopvärden är oförändrade; compact gäller bara mobilcropen
		// (se testet "vargens mobilankare" i companionPoseState.test.ts).
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.wolf).toEqual({
			scale: 0.9,
			x: 37,
			y: 91,
			compact: { scale: 0.7, x: 34, y: 92 }
		});
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.bear).toEqual({
			scale: 0.68,
			x: 35,
			y: 94,
			compact: { scale: 0.72, x: 31, y: 92 }
		});
	});

	it('deras poser är inte omskrivna', () => {
		const foxPoses = COMPANION_POSES.filter((pose) => (pose.companionId ?? 'fox') === 'fox');
		const bearPoses = COMPANION_POSES.filter((pose) => pose.companionId === 'bear');
		const wolfPoses = COMPANION_POSES.filter((pose) => pose.companionId === 'wolf');

		expect(foxPoses.length).toBeGreaterThan(0);
		expect(bearPoses).toHaveLength(4);
		expect(wolfPoses).toHaveLength(2);
	});

	it('räven är fortfarande fallback för okända och poselösa ID:n', () => {
		expect(getWorldCompanionId('finns-inte')).toBe('fox');
		expect(getWorldCompanionId(null)).toBe('fox');
		expect(getWorldCompanionId('owl')).toBe('fox');
	});

	it('okänt ID avvisas fortfarande vid metadata-läsning', () => {
		expect(readProgressCompanionFromMetadata({ progress_companion: 'drake' })).toBeNull();
	});
});

describe('väljaren', () => {
	const source = readFileSync(
		join(process.cwd(), 'src/lib/components/CompanionSelector.svelte'),
		'utf8'
	);

	it.each(DOGS)('exponerar $displayName som valbar', (dog) => {
		expect(source).toContain(`'${dog.id}'`);
	});

	// Porträttuppslaget låg tidigare som en egen tabell i CompanionSelector, och
	// testet läste komponentens källtext. Uppslaget bor nu i progressCompanion
	// och används av CompanionAvatar på alla tre porträttytor, så assertionen
	// följer med dit: samma bild oavsett var följeslagaren visas.
	it.each(DOGS)('har ett porträttfoto för $displayName', (dog) => {
		const src = getCompanionPortraitSrc(dog.id);

		expect(src).toBe(`/images/avatars/presets/${dog.assetPrefix}.png`);
		expect(existsSync(join(process.cwd(), 'static', src as string))).toBe(true);
	});
});

// Porträttuppslaget delas av räv, björn och hundarna. Ett ID utan fil på disk
// ger inte krasch - CompanionAvatar faller tillbaka på SVG-figuren - men det
// blir en tyst nedgradering ingen upptäcker. Testet gäller därför HELA
// uppslaget, så en ny följeslagare aldrig kan läggas till utan sin bild.
describe('porträttuppslaget', () => {
	const entries = Object.entries(COMPANION_PORTRAIT_IMAGES) as [string, string][];

	it('täcker räv, björn och båda hundarna', () => {
		expect(entries.map(([id]) => id).sort()).toEqual([
			'australisk_shepherd',
			'bear',
			'fox',
			'schafer'
		]);
	});

	it.each(entries)('%s pekar på en fil som finns', (id, src) => {
		expect(getCompanionPortraitSrc(id)).toBe(src);
		expect(existsSync(join(process.cwd(), 'static', src))).toBe(true);
	});

	// Ylva har medvetet inget foto än. Utan det här testet skulle ett halvfärdigt
	// vargporträtt kunna smyga in utan beslut.
	it('lämnar vargen till SVG-figuren tills ett vargporträtt finns', () => {
		expect(getCompanionPortraitSrc('wolf')).toBeNull();
	});
});
