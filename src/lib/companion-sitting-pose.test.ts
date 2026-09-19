import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BEAR_COMPANION_POSES, COMPANION_POSES } from '$lib/companionPoseManifest';
import { getCompanionBasePose } from '$lib/companionPoseState';
import {
	PROGRESS_POSE_ART_BOUNDS,
	PROGRESS_SCENE_IMAGE_SIZE,
	PROGRESS_SCENE_SPOTS,
	getProgressCompanionPlacement,
	getProgressSceneSpots
} from '$lib/progressCompanionPlacement';

// Balder ska kunna sitta stilla och titta ut över scenen, inte bara stå.
// Posen är en egen bild sedd bakifrån - ingen hopklämd eller roterad
// ståendepose - och den ska landa med tassarna på marken i scenen.

const SITTING_AWAY = 'bear-sitting-away';

const pose = COMPANION_POSES.find((item) => item.id === SITTING_AWAY);

describe('den sittande, bortvända posen', () => {
	it('finns i manifestet som en egen bild', () => {
		expect(pose, 'posen saknas i manifestet').toBeDefined();
		expect(pose?.companionId).toBe('bear');
		expect(pose?.role).toBe('base');
		expect(pose?.frames).toHaveLength(1);
		expect(pose?.frames[0].src).toBe('/images/avatars/presets/bear-sitting-back.png');
	});

	it('pekar på en bild som faktiskt finns', () => {
		const src = pose?.frames[0].src ?? '';
		expect(existsSync(join(process.cwd(), 'static', src))).toBe(true);
	});

	it('beskrivs som sittande och vänd mot utsikten', () => {
		expect(pose?.alt).toContain('sitter');
		expect(pose?.alt).toContain('utsikten');
		// Ingen formulering som antyder att björnen är aktiv eller alert.
		expect(pose?.alt).not.toMatch(/står|leker|springer|vaken/i);
	});

	it('hör hemma i dagen och kvällen, inte natten', () => {
		expect(pose?.dayparts).toEqual(['day', 'evening']);
	});

	it('lämnar natten åt den sovande posen, så nattvalet förblir entydigt', () => {
		const nightPoses = BEAR_COMPANION_POSES.filter((item) =>
			(item.dayparts as readonly string[]).includes('night')
		);
		expect(nightPoses.map((item) => item.id)).toEqual(['bear-sleeping']);
	});
});

describe('var posen används', () => {
	// Kvällen, då stugan och återblicken är som lugnast.
	//
	// Tiderna skrivs med explicit +02:00 (svensk sommartid i september).
	// getProgressCompanionLocalTime tolkar alltid Europe/Stockholm, men en
	// datumsträng utan offset tolkas som CI-körarens egen systemtid (UTC på
	// GitHub Actions) - två timmars skillnad flyttade kvällsklockan över
	// gränsen till natt och gjorde testet grönt lokalt men rött i CI.
	const evening = new Date('2026-09-16T19:30:00+02:00');
	const day = new Date('2026-09-16T12:00:00+02:00');
	const night = new Date('2026-09-16T23:30:00+02:00');

	it('kan väljas i stugans lugna och vilande lägen', () => {
		const calm = new Set<string>();
		const resting = new Set<string>();
		for (let attempt = 0; attempt < 200; attempt += 1) {
			calm.add(getCompanionBasePose(evening, null, 'bear', 'dashboard', 'calm').id);
			resting.add(getCompanionBasePose(evening, null, 'bear', 'dashboard', 'resting').id);
		}

		expect(calm.has(SITTING_AWAY), 'lugn profil ska kunna visa den sittande posen').toBe(true);
		expect(resting.has(SITTING_AWAY), 'vilande profil ska kunna visa den sittande posen').toBe(
			true
		);
	});

	it('visar bara sittande eller sovande poser i de lägena', () => {
		for (const date of [day, evening, night]) {
			for (const preference of ['calm', 'resting'] as const) {
				for (let attempt = 0; attempt < 50; attempt += 1) {
					const chosen = getCompanionBasePose(date, null, 'bear', 'dashboard', preference);
					expect(chosen.id, `${preference} valde ${chosen.id}`).toMatch(/sitting|sleeping/);
				}
			}
		}
	});

	it('finns kvar bland Framstegs kuraterade platser, men bara som en av flera', () => {
		const dayPoseIds = getProgressSceneSpots('day').map((spot) => spot.poseId);
		expect(dayPoseIds).toContain(SITTING_AWAY);
		// Den får inte vara det enda Framsteg kan visa - det var precis det som
		// gjorde scenen statisk.
		expect(new Set(dayPoseIds).size).toBeGreaterThan(1);
		expect(dayPoseIds.filter((id) => id === SITTING_AWAY).length).toBeLessThan(dayPoseIds.length);
	});

	it('håller den bortvända posen borta från gamla /dashboards allmänna rotation', () => {
		// Gamla /dashboard hälsar på Balder ansikte mot ansikte (default), så där ska
		// ryggtavlan aldrig dyka upp - men front-sittposen får fortfarande synas.
		const seen = new Set<string>();
		for (let attempt = 0; attempt < 400; attempt += 1) {
			seen.add(getCompanionBasePose(day, null, 'bear', 'dashboard', 'default').id);
			seen.add(getCompanionBasePose(evening, null, 'bear', 'dashboard', 'default').id);
		}
		expect(seen.has(SITTING_AWAY), 'default rotation ska inte visa ryggtavlan').toBe(false);
		expect(seen.has('bear-sitting'), 'front-sittposen ska fortfarande kunna synas').toBe(true);
	});

	it('lämnar natten åt sömnen även i vilande läge', () => {
		for (let attempt = 0; attempt < 50; attempt += 1) {
			expect(getCompanionBasePose(night, null, 'bear', 'dashboard', 'resting').id).toBe(
				'bear-sleeping'
			);
		}
	});
});

describe('placeringen i Framsteg-scenen', () => {
	const box = { containerWidth: 1120, containerHeight: 630 };
	const sceneScale = Math.min(
		box.containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width,
		box.containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height
	);
	const offsetY = (box.containerHeight - PROGRESS_SCENE_IMAGE_SIZE.height * sceneScale) / 2;

	it.each(PROGRESS_SCENE_SPOTS.map((spot) => [spot.id, spot] as const))(
		'sätter tassarna på platsens egen marklinje, inte svävande (%s)',
		(_id, spot) => {
			const placement = getProgressCompanionPlacement({ ...box, spot });
			expect(placement).not.toBeNull();
			if (!placement) return;

			const bounds = PROGRESS_POSE_ART_BOUNDS[spot.poseId];
			const groundY = offsetY + spot.groundY * sceneScale;
			const motifBottom = placement.top + (placement.height * bounds.bottom) / bounds.canvasHeight;

			expect(Math.abs(motifBottom - groundY)).toBeLessThan(1);
		}
	);

	it.each(PROGRESS_SCENE_SPOTS.map((spot) => [spot.id, spot] as const))(
		'ger motivet exakt den höjd platsen är uppmätt för (%s)',
		(_id, spot) => {
			const placement = getProgressCompanionPlacement({ ...box, spot });
			if (!placement) return;

			const bounds = PROGRESS_POSE_ART_BOUNDS[spot.poseId];
			const motifHeight =
				(placement.height * (bounds.bottom - bounds.top)) / bounds.canvasHeight;

			expect(motifHeight).toBeCloseTo(spot.motifHeight * sceneScale, 3);
			// Personen sitter 255 px hög i originalbilden. Ingen plats får ge en
			// björn som är större än personen eller så liten att han försvinner.
			expect(spot.motifHeight).toBeGreaterThan(80);
			expect(spot.motifHeight).toBeLessThan(255);
		}
	);

	it('ligger inom scenytan i både desktop- och mobilmått', () => {
		for (const viewport of [
			{ containerWidth: 1120, containerHeight: 630 },
			{ containerWidth: 347, containerHeight: 231 }
		]) {
			for (const spot of PROGRESS_SCENE_SPOTS) {
				const placement = getProgressCompanionPlacement({ ...viewport, spot });
				expect(placement, `${spot.id} ${JSON.stringify(viewport)}`).not.toBeNull();
				if (!placement) continue;

				expect(placement.left).toBeGreaterThan(-placement.width);
				expect(placement.left + placement.width).toBeLessThan(
					viewport.containerWidth + placement.width
				);
				expect(placement.top).toBeGreaterThan(-placement.height);
				expect(placement.height).toBeGreaterThan(0);
			}
		}
	});
});
