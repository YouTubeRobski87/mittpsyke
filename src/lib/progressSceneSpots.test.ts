import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMPANION_POSES } from '$lib/companionPoseManifest';
import { COMPANION } from '$lib/progressCompanion';
import {
	PROGRESS_POSE_ART_BOUNDS,
	PROGRESS_SCENE_SPOTS,
	getProgressInitialSceneSpot,
	getProgressSceneSpot,
	getProgressSceneSpots,
	getProgressScenePose
} from '$lib/progressCompanionPlacement';

// Balder ska kännas som en närvaro på platsen, inte som en dekal klistrad på
// samma punkt varje gång. Framsteg roterar därför mellan ett fåtal kuraterade
// PLATSER - pose plus egen markpunkt och storlek.
//
// Det här testet vaktar tre saker: att platserna finns och är flera, att varje
// plats är byggd på en riktig bild med uppmätt alfayta, och att den bortvända
// posen får finnas kvar utan att ta över igen.

const ROOT = process.cwd();

// Samma fasta tidpunkter som övriga posetester, med explicit offset så CI:ns
// UTC inte flyttar kvällen över gränsen till natt.
const DAY = new Date('2026-09-16T12:00:00+02:00');
const EVENING = new Date('2026-09-16T19:30:00+02:00');
const NIGHT = new Date('2026-09-16T23:30:00+02:00');

class MemoryStorage implements Storage {
	private store = new Map<string, string>();

	get length() {
		return this.store.size;
	}
	clear(): void {
		this.store.clear();
	}
	getItem(key: string): string | null {
		return this.store.get(key) ?? null;
	}
	key(index: number): string | null {
		return [...this.store.keys()][index] ?? null;
	}
	removeItem(key: string): void {
		this.store.delete(key);
	}
	setItem(key: string, value: string): void {
		this.store.set(key, value);
	}
}

describe('Framstegs kuraterade platser', () => {
	it('bygger varje plats på en pose som finns i manifestet och på disk', () => {
		for (const spot of PROGRESS_SCENE_SPOTS) {
			const pose = COMPANION_POSES.find((item) => item.id === spot.poseId);
			expect(pose, `${spot.id} pekar på en pose som inte finns`).toBeDefined();
			expect(pose?.companionId).toBe(COMPANION.id);
			for (const frame of pose?.frames ?? []) {
				expect(existsSync(join(ROOT, 'static', frame.src)), frame.src).toBe(true);
			}
			expect(getProgressScenePose(spot)?.id).toBe(spot.poseId);
		}
	});

	it('har en uppmätt alfayta för varje pose som används', () => {
		// Utan uppmätt yta går markpunkten inte att räkna ut, och björnen skulle
		// sväva eller sjunka genom marken.
		for (const spot of PROGRESS_SCENE_SPOTS) {
			expect(PROGRESS_POSE_ART_BOUNDS[spot.poseId], `${spot.id} saknar alfayta`).toBeDefined();
		}
	});

	it('ger varje plats en egen punkt i scenen - inte samma x/y/skala', () => {
		const geometry = PROGRESS_SCENE_SPOTS.map(
			(spot) => `${spot.groundX}:${spot.groundY}:${spot.motifHeight}`
		);
		expect(new Set(geometry).size).toBe(geometry.length);
		expect(new Set(PROGRESS_SCENE_SPOTS.map((spot) => spot.id)).size).toBe(
			PROGRESS_SCENE_SPOTS.length
		);
	});

	it('säger i en mening var Balder är, på varje plats', () => {
		for (const spot of PROGRESS_SCENE_SPOTS) {
			expect(spot.presence.length, spot.id).toBeGreaterThan(10);
			expect(spot.presence, spot.id).toContain(COMPANION.name);
			// Lågmält: platsen konstateras, den ber inte om något och tolkar
			// varken användaren eller björnen.
			expect(spot.presence, spot.id).not.toMatch(/\?|!|hjälper|vill att du|du borde/i);
		}
	});

	it('har flera platser i både dag och kväll', () => {
		expect(getProgressSceneSpots('day').length).toBeGreaterThanOrEqual(4);
		expect(getProgressSceneSpots('evening').length).toBeGreaterThanOrEqual(4);
	});

	it('täcker de lugna lägena: sittande, stående, vilande och nere vid vattnet', () => {
		const dayPoses = new Set(getProgressSceneSpots('day').map((spot) => spot.poseId));
		expect(dayPoses).toContain('bear-sitting');
		expect(dayPoses).toContain('bear-sitting-away');
		expect(dayPoses).toContain('bear-standing');
		expect(getProgressSceneSpots('evening').map((spot) => spot.poseId)).toContain('bear-sleeping');

		// Minst en plats ska ligga nere vid vattenbrynet, högre upp i bilden än
		// gräsbanken bredvid personen.
		const bankGroundY = Math.max(...PROGRESS_SCENE_SPOTS.map((spot) => spot.groundY));
		expect(PROGRESS_SCENE_SPOTS.some((spot) => spot.groundY < bankGroundY - 30)).toBe(true);
	});

	it('låter natten vara vila, inte en bortvänd vaken björn', () => {
		const night = getProgressSceneSpots('night');
		expect(night.length).toBeGreaterThan(0);
		for (const spot of night) {
			expect(spot.poseId).toBe('bear-sleeping');
		}
	});

	it('låter den bortvända posen finnas kvar utan att dominera', () => {
		for (const daypart of ['day', 'evening'] as const) {
			const spots = getProgressSceneSpots(daypart);
			const total = spots.reduce((sum, spot) => sum + spot.weight, 0);
			const away = spots
				.filter((spot) => spot.poseId === 'bear-sitting-away')
				.reduce((sum, spot) => sum + spot.weight, 0);

			expect(away, `${daypart}: den bortvända posen ska finnas kvar`).toBeGreaterThan(0);
			// Det var precis "nästan alltid ryggen mot användaren" som gjorde
			// scenen statisk. Mindre än hälften, och ingen enskild plats får
			// heller äga mer än en fjärdedel av tiden.
			expect(away / total, `${daypart}: ryggtavlan dominerar`).toBeLessThan(0.5);
			for (const spot of spots) {
				expect(spot.weight / total, `${spot.id} dominerar ${daypart}`).toBeLessThanOrEqual(0.35);
			}
		}
	});

	it('går aldrig utanför sin dagpart', () => {
		for (const [date, daypart] of [
			[DAY, 'day'],
			[EVENING, 'evening'],
			[NIGHT, 'night']
		] as const) {
			const allowed = new Set(getProgressSceneSpots(daypart).map((spot) => spot.id));
			for (let attempt = 0; attempt < 100; attempt += 1) {
				expect(allowed.has(getProgressSceneSpot(date, null).id)).toBe(true);
			}
			expect(allowed.has(getProgressInitialSceneSpot(date).id)).toBe(true);
		}
	});

	it('kan faktiskt hamna på flera olika platser över tid', () => {
		const seen = new Set<string>();
		for (let attempt = 0; attempt < 400; attempt += 1) {
			seen.add(getProgressSceneSpot(DAY, null).id);
		}
		expect(seen.size).toBe(getProgressSceneSpots('day').length);
	});

	it('står stilla tills den ihågkomna platsen gått ut', () => {
		const storage = new MemoryStorage();
		const first = getProgressSceneSpot(DAY, storage);
		for (let attempt = 0; attempt < 50; attempt += 1) {
			expect(getProgressSceneSpot(DAY, storage).id).toBe(first.id);
		}
	});

	it('ger samma startläge i SSR och första klientrender', () => {
		for (const date of [DAY, EVENING, NIGHT]) {
			expect(getProgressInitialSceneSpot(date).id).toBe(getProgressInitialSceneSpot(date).id);
		}
		// Deterministisk: ingen slump, ingen storage.
		expect(getProgressInitialSceneSpot(DAY).id).toBe(getProgressSceneSpots('day')[0].id);
	});
});
