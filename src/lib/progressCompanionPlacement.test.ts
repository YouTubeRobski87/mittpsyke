import { describe, expect, it } from 'vitest';
import {
	PROGRESS_CABIN_SOURCE_BOX,
	PROGRESS_SCENE_IMAGE_SIZE,
	MIN_PROGRESS_CABIN_HIT_SIZE,
	getProgressCabinPlacement,
	getProgressCabinPlacementStyle
} from './progressCompanionPlacement';

/** Brytpunkten i routens sizes-attribut, speglad här för hero-måtten. */
const COMPACT_BREAKPOINT = 640;

/** Samma proportionella scenyta och sidmarginaler som /framsteg använder. */
function heroBox(viewportWidth: number) {
	const containerWidth =
		viewportWidth <= COMPACT_BREAKPOINT
			? viewportWidth - 28
			: viewportWidth <= 980
				? viewportWidth - 44
				: Math.min(1120, viewportWidth - 96);
	return {
		containerWidth,
		containerHeight: containerWidth * (PROGRESS_SCENE_IMAGE_SIZE.height / PROGRESS_SCENE_IMAGE_SIZE.width)
	};
}

/** Contain-geometrin, uträknad oberoende av implementationen. */
function expectedContainGeometry(containerWidth: number, containerHeight: number) {
	const scale = Math.min(
		containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width,
		containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height
	);
	const renderedWidth = PROGRESS_SCENE_IMAGE_SIZE.width * scale;
	const renderedHeight = PROGRESS_SCENE_IMAGE_SIZE.height * scale;
	return {
		renderedWidth,
		renderedHeight,
		offsetX: (containerWidth - renderedWidth) / 2,
		offsetY: (containerHeight - renderedHeight) / 2
	};
}

describe('stugans klickyta', () => {
	it.each([
		[1920, 1080],
		[1440, 900],
		[1280, 720],
		[915, 412],
		[844, 390],
		[430, 932],
		[412, 915],
		[390, 844],
		[375, 812],
		[360, 800]
	])('ligger inom den synliga hero-ytan vid %ix%i', (viewportWidth) => {
		const box = heroBox(viewportWidth);
		const cabin = getProgressCabinPlacement(box);

		expect(cabin, `${viewportWidth}`).not.toBeNull();
		expect(cabin!.left).toBeGreaterThanOrEqual(0);
		expect(cabin!.top).toBeGreaterThanOrEqual(0);
		expect(cabin!.left + cabin!.width).toBeLessThanOrEqual(box.containerWidth + 0.01);
		expect(cabin!.top + cabin!.height).toBeLessThanOrEqual(box.containerHeight + 0.01);
		expect(cabin!.width).toBeGreaterThanOrEqual(MIN_PROGRESS_CABIN_HIT_SIZE);
		expect(cabin!.height).toBeGreaterThanOrEqual(MIN_PROGRESS_CABIN_HIT_SIZE);
	});

	it('följer den proportionella bilden i stället för en fast pixelposition', () => {
		const wide = getProgressCabinPlacement(heroBox(1440));
		const narrow = getProgressCabinPlacement(heroBox(375));

		// Olika skala ger olika ruta - hade den varit hårdkodad
		// i pixlar skulle de två varit identiska.
		expect(wide!.left).not.toBeCloseTo(narrow!.left, 1);
		expect(wide!.width).not.toBeCloseTo(narrow!.width, 1);
	});

	it('landar på samma bildpunkt som originalbildens stuga', () => {
		const box = heroBox(1440);
		const cabin = getProgressCabinPlacement(box)!;
		const { renderedWidth, offsetX } = expectedContainGeometry(box.containerWidth, box.containerHeight);

		expect(cabin.left).toBeCloseTo(offsetX + renderedWidth * (PROGRESS_CABIN_SOURCE_BOX.x / 100), 3);
	});

	it('ger ingen klickyta utan en mätbar container', () => {
		expect(getProgressCabinPlacement({ containerWidth: 0, containerHeight: 0 })).toBeNull();
		expect(getProgressCabinPlacementStyle({ containerWidth: 0, containerHeight: 0 })).toBe('');
	});

	it('skriver ut alla fyra variabler som mallen läser', () => {
		const style = getProgressCabinPlacementStyle(heroBox(1280));

		for (const name of ['--progress-cabin-left', '--progress-cabin-top', '--progress-cabin-width', '--progress-cabin-height']) {
			expect(style).toContain(name);
		}
	});
});

/**
 * Regression: geometrin räknade tidigare enligt object-fit: cover medan CSS
 * renderar contain. Det gick inte att se så länge scenrutan hade exakt bildens
 * proportion - då är cover och contain identiska. Testerna nedan ger rutan en
 * ANNAN proportion än bilden, vilket är enda sättet att skilja dem åt.
 */
describe('stughotspoten följer contain-geometrin, inte cover', () => {
	it('centrerar bilden i sidled när rutan är bredare än bilden', () => {
		// Bredare ruta -> contain begränsas av höjden och lämnar pelarboxar i sidled.
		const box = { containerWidth: 1400, containerHeight: 500 };
		const { renderedWidth, renderedHeight, offsetX, offsetY } = expectedContainGeometry(
			box.containerWidth,
			box.containerHeight
		);

		// Contain, inte cover: bilden ryms helt och blir smalare än rutan.
		expect(renderedWidth).toBeLessThan(box.containerWidth);
		expect(renderedHeight).toBeCloseTo(box.containerHeight, 6);
		expect(offsetX).toBeGreaterThan(0);
		expect(offsetY).toBeCloseTo(0, 6);

		const cabin = getProgressCabinPlacement(box)!;
		expect(cabin.left).toBeCloseTo(offsetX + renderedWidth * (PROGRESS_CABIN_SOURCE_BOX.x / 100), 3);
		expect(cabin.top).toBeCloseTo(offsetY + renderedHeight * (PROGRESS_CABIN_SOURCE_BOX.y / 100), 3);
	});

	it('centrerar bilden i höjdled när rutan är högre än bilden', () => {
		// Högre ruta -> contain begränsas av bredden och lämnar brevlådekanter.
		const box = { containerWidth: 800, containerHeight: 900 };
		const { renderedWidth, renderedHeight, offsetX, offsetY } = expectedContainGeometry(
			box.containerWidth,
			box.containerHeight
		);

		expect(renderedHeight).toBeLessThan(box.containerHeight);
		expect(renderedWidth).toBeCloseTo(box.containerWidth, 6);
		expect(offsetY).toBeGreaterThan(0);
		expect(offsetX).toBeCloseTo(0, 6);

		const cabin = getProgressCabinPlacement(box)!;
		expect(cabin.left).toBeCloseTo(offsetX + renderedWidth * (PROGRESS_CABIN_SOURCE_BOX.x / 100), 3);
		expect(cabin.top).toBeCloseTo(offsetY + renderedHeight * (PROGRESS_CABIN_SOURCE_BOX.y / 100), 3);
	});

	it('skiljer sig mätbart från vad cover-geometrin hade gett', () => {
		// Det här testet faller om någon återinför Math.max/imagePosition.
		const box = { containerWidth: 1400, containerHeight: 500 };
		const coverScale = Math.max(
			box.containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width,
			box.containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height
		);
		const coverRenderedWidth = PROGRESS_SCENE_IMAGE_SIZE.width * coverScale;
		const coverLeft =
			(box.containerWidth - coverRenderedWidth) * 0.5 +
			coverRenderedWidth * (PROGRESS_CABIN_SOURCE_BOX.x / 100);

		const cabin = getProgressCabinPlacement(box)!;
		expect(Math.abs(cabin.left - coverLeft)).toBeGreaterThan(1);
	});

	it('håller hotspoten inom bildens yta, inte bara inom rutan', () => {
		const box = { containerWidth: 1400, containerHeight: 500 };
		const { renderedWidth, offsetX } = expectedContainGeometry(box.containerWidth, box.containerHeight);
		const cabin = getProgressCabinPlacement(box)!;

		// Klickytan får aldrig hamna i den tomma pelarboxen bredvid motivet.
		expect(cabin.left).toBeGreaterThanOrEqual(offsetX - 0.01);
		expect(cabin.left + cabin.width).toBeLessThanOrEqual(offsetX + renderedWidth + 0.01);
	});

	it('ger oförändrad placering när rutan har bildens egen proportion', () => {
		// Skyddar dagens rendering: contain och cover sammanfaller exakt här, så
		// den här ändringen får inte flytta hotspoten en enda pixel.
		const box = heroBox(1440);
		const cabin = getProgressCabinPlacement(box)!;

		expect(cabin.left).toBeCloseTo(box.containerWidth * (PROGRESS_CABIN_SOURCE_BOX.x / 100), 6);
		expect(cabin.top).toBeCloseTo(box.containerHeight * (PROGRESS_CABIN_SOURCE_BOX.y / 100), 6);
	});
});
