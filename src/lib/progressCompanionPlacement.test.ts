import { describe, expect, it } from 'vitest';
import {
	PROGRESS_COMPACT_BREAKPOINT,
	PROGRESS_COMPANION_SCALES,
	PROGRESS_SCENE_PLACEMENTS,
	getProgressCompanionPlacement
} from './progressCompanionPlacement';

const scenes = ['morning', 'day', 'afternoon', 'evening'] as const;
const companions = ['fox', 'bear', 'wolf', 'schafer', 'australisk_shepherd'] as const;

describe('Framstegs följeslagarplacering', () => {
	it('har en dokumenterad safe zone per scen och viewport', () => {
		for (const scene of scenes) {
			for (const viewport of ['desktop', 'mobile'] as const) {
				const placement = PROGRESS_SCENE_PLACEMENTS[scene][viewport];
				expect(placement.safeZone).not.toHaveLength(0);
				expect(placement.ground.x).toBeGreaterThan(0);
				expect(placement.ground.y).toBeGreaterThan(0);
			}
		}
	});

	it.each([
		[1920, 1080],
		[1440, 900],
		[1280, 720],
		[390, 844],
		[375, 812]
	])('räknar en synlig, positiv storlek vid %ix%i', (viewportWidth, viewportHeight) => {
		// Samma herohöjder som /framsteg använder för respektive breakpoint.
		const containerWidth = viewportWidth <= PROGRESS_COMPACT_BREAKPOINT ? viewportWidth - 28 : viewportWidth - 96;
		const containerHeight = viewportWidth <= PROGRESS_COMPACT_BREAKPOINT ? Math.min(260, viewportWidth * 0.68) : Math.min(420, viewportWidth * 0.27);

		for (const scene of scenes) {
			for (const companionId of companions) {
				const placement = getProgressCompanionPlacement({
					scene,
					companionId,
					containerWidth,
					containerHeight,
					viewportWidth
				});

				expect(placement).not.toBeNull();
				expect(placement!.width).toBeGreaterThan(0);
				expect(placement!.left).toBeGreaterThan(0);
				expect(placement!.left).toBeLessThan(containerWidth);
				expect(placement!.top).toBeGreaterThan(0);
				expect(placement!.top).toBeLessThan(containerHeight);
				// Hela elementet, även den största vargen, ska rymmas inom den
				// synliga cropen. Det är ett regressionsskydd mot avklippta djur.
				expect(placement!.left - placement!.width / 2).toBeGreaterThanOrEqual(0);
				expect(placement!.left + placement!.width / 2).toBeLessThanOrEqual(containerWidth);
				expect(placement!.top - placement!.width).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it('håller djurens storlek separat från scenens markpunkt', () => {
		const fox = getProgressCompanionPlacement({ scene: 'afternoon', companionId: 'fox', containerWidth: 1300, containerHeight: 390, viewportWidth: 1440 });
		const australianShepherd = getProgressCompanionPlacement({ scene: 'afternoon', companionId: 'australisk_shepherd', containerWidth: 1300, containerHeight: 390, viewportWidth: 1440 });

		expect(fox?.left).toBe(australianShepherd?.left);
		expect(fox?.top).toBe(australianShepherd?.top);
		expect(PROGRESS_COMPANION_SCALES.australisk_shepherd).toBeLessThan(PROGRESS_COMPANION_SCALES.wolf);
	});
});
