import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BEAR_COMPANION_POSES, COMPANION_POSES } from '$lib/companionPoseManifest';
import { getCompanionBasePose } from '$lib/companionPoseState';
import {
	PROGRESS_COMPANION_GROUND_Y,
	PROGRESS_SCENE_IMAGE_SIZE,
	getProgressCompanionPlacement,
	getProgressScenePose,
	getProgressScenePoseId
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

	it('är den pose Framsteg-scenen väljer, eftersom den är bortvänd', () => {
		expect(getProgressScenePoseId('bear')).toBe(SITTING_AWAY);
		expect(getProgressScenePose('bear')?.id).toBe(SITTING_AWAY);
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

	it('sätter tassarna på marklinjen, inte svävande', () => {
		const placement = getProgressCompanionPlacement({ ...box, companionId: 'bear' });
		expect(placement).not.toBeNull();
		if (!placement) return;

		// Bildens nederkant för motivet ska hamna på scenens marklinje.
		const scale = Math.min(
			box.containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width,
			box.containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height
		);
		const offsetY = (box.containerHeight - PROGRESS_SCENE_IMAGE_SIZE.height * scale) / 2;
		const groundY = offsetY + PROGRESS_COMPANION_GROUND_Y * scale;
		const motifBottom = placement.top + (placement.height * 496) / 512;

		expect(Math.abs(motifBottom - groundY)).toBeLessThan(1);
	});

	it('håller en rimlig storlek mot personen i scenen', () => {
		const placement = getProgressCompanionPlacement({ ...box, companionId: 'bear' });
		if (!placement) return;

		const scale = Math.min(
			box.containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width,
			box.containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height
		);
		// Motivet är satt till 180 px i originalbilden, mot personens 255 px
		// sittande höjd. Kontrollen fångar en pose som råkar bli dubbelt så stor.
		const motifHeight = (placement.height * (496 - 19)) / 512;
		expect(motifHeight).toBeGreaterThan(150 * scale);
		expect(motifHeight).toBeLessThan(210 * scale);
	});

	it('ligger inom scenytan i både desktop- och mobilmått', () => {
		for (const viewport of [
			{ containerWidth: 1120, containerHeight: 630 },
			{ containerWidth: 347, containerHeight: 231 }
		]) {
			const placement = getProgressCompanionPlacement({ ...viewport, companionId: 'bear' });
			expect(placement, JSON.stringify(viewport)).not.toBeNull();
			if (!placement) continue;

			expect(placement.left).toBeGreaterThan(-placement.width);
			expect(placement.left + placement.width).toBeLessThan(viewport.containerWidth + placement.width);
			expect(placement.top).toBeGreaterThan(-placement.height);
			expect(placement.height).toBeGreaterThan(0);
		}
	});
});
