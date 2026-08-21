import { describe, expect, it } from 'vitest';
import {
	PROGRESS_CABIN_SOURCE_BOX,
	PROGRESS_COMPACT_BREAKPOINT,
	PROGRESS_COMPANION_SCALES,
	PROGRESS_SCENE_IMAGE_SIZE,
	PROGRESS_SCENE_PLACEMENTS,
	getProgressCabinPlacement,
	getProgressCabinPlacementStyle,
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


/** Samma herohöjder som /framsteg använder, delade av båda sviterna. */
function heroBox(viewportWidth: number) {
	const compact = viewportWidth <= PROGRESS_COMPACT_BREAKPOINT;
	return {
		containerWidth: compact ? viewportWidth - 28 : viewportWidth - 96,
		containerHeight: compact ? Math.min(260, viewportWidth * 0.68) : Math.min(420, viewportWidth * 0.27),
		viewportWidth
	};
}

describe('stugans klickyta', () => {
	const scenes = ['morning', 'day', 'afternoon', 'evening'] as const;

	it.each([
		[1440, 900],
		[1280, 720],
		[390, 844],
		[375, 812]
	])('ligger inom den synliga hero-ytan vid %ix%i', (viewportWidth) => {
		for (const scene of scenes) {
			const box = heroBox(viewportWidth);
			const cabin = getProgressCabinPlacement({ scene, ...box });

			expect(cabin, `${scene} @ ${viewportWidth}`).not.toBeNull();
			expect(cabin!.left).toBeGreaterThanOrEqual(0);
			expect(cabin!.top).toBeGreaterThanOrEqual(0);
			expect(cabin!.left + cabin!.width).toBeLessThanOrEqual(box.containerWidth + 0.01);
			expect(cabin!.top + cabin!.height).toBeLessThanOrEqual(box.containerHeight + 0.01);
			expect(cabin!.width).toBeGreaterThan(0);
			expect(cabin!.height).toBeGreaterThan(0);
		}
	});

	it('följer cropen i stället för en fast pixelposition', () => {
		const wide = getProgressCabinPlacement({ scene: 'day', ...heroBox(1440) });
		const narrow = getProgressCabinPlacement({ scene: 'day', ...heroBox(375) });

		// Olika beskärning och skala ger olika ruta - hade den varit hårdkodad
		// i pixlar skulle de två varit identiska.
		expect(wide!.left).not.toBeCloseTo(narrow!.left, 1);
		expect(wide!.width).not.toBeCloseTo(narrow!.width, 1);
	});

	it('landar på samma bildpunkt som originalbildens stuga', () => {
		const box = heroBox(1440);
		const cabin = getProgressCabinPlacement({ scene: 'day', ...box })!;
		const scale = Math.max(
			box.containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width,
			box.containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height
		);
		const renderedWidth = PROGRESS_SCENE_IMAGE_SIZE.width * scale;
		const offsetX = (box.containerWidth - renderedWidth) * 0.5;

		expect(cabin.left).toBeCloseTo(offsetX + renderedWidth * (PROGRESS_CABIN_SOURCE_BOX.x / 100), 3);
	});

	it('krymper inte bort följeslagarens plats', () => {
		const box = heroBox(1440);
		const cabin = getProgressCabinPlacement({ scene: 'day', ...box })!;
		const companion = getProgressCompanionPlacement({ scene: 'day', companionId: 'fox', ...box })!;

		// Stugan står till vänster i motivet, följeslagaren långt ut till höger.
		expect(cabin.left + cabin.width).toBeLessThan(companion.left);
	});

	it('ger ingen klickyta utan en mätbar container', () => {
		expect(getProgressCabinPlacement({ scene: 'day', containerWidth: 0, containerHeight: 0, viewportWidth: 1440 })).toBeNull();
		expect(getProgressCabinPlacementStyle({ scene: 'day', containerWidth: 0, containerHeight: 0, viewportWidth: 1440 })).toBe('');
	});

	it('skriver ut alla fyra variabler som mallen läser', () => {
		const style = getProgressCabinPlacementStyle({ scene: 'day', ...heroBox(1280) });

		for (const name of ['--progress-cabin-left', '--progress-cabin-top', '--progress-cabin-width', '--progress-cabin-height']) {
			expect(style).toContain(name);
		}
	});
});
