import { describe, expect, it } from 'vitest';
import {
	getCoverGeometry,
	imageAnchorMode,
	imageAnchorStyle,
	imagePointToScenePoint,
	type CoverGeometryInput
} from './coverGeometry';

// Mitt Hems faktiska scenbild och dess två object-position-lägen.
const SCENE_IMAGE = { imageWidth: 1672, imageHeight: 941 };
const DESKTOP_POSITION = { objectPositionX: 0.5, objectPositionY: 0.52 };
const MOBILE_POSITION = { objectPositionX: 0.08, objectPositionY: 0.52 };

/**
 * Oberoende referens: samma sak uttryckt som CSS gör det, med max() över
 * rutans egna mått i stället för en gemensam skalfaktor. Den finns här för
 * att testa formeln mot ett annat uttryck av den, inte mot sig själv.
 */
function referenceCover(input: Required<CoverGeometryInput>) {
	const aspect = input.imageWidth / input.imageHeight;
	const renderedWidth = Math.max(input.containerWidth, input.containerHeight * aspect);
	const renderedHeight = Math.max(input.containerHeight, input.containerWidth / aspect);
	return {
		renderedWidth,
		renderedHeight,
		offsetX: (input.containerWidth - renderedWidth) * input.objectPositionX,
		offsetY: (input.containerHeight - renderedHeight) * input.objectPositionY
	};
}

describe('getCoverGeometry', () => {
	it('samma proportioner: bilden fyller rutan exakt, utan överspill', () => {
		const geometry = getCoverGeometry({
			imageWidth: 1600,
			imageHeight: 900,
			containerWidth: 800,
			containerHeight: 450,
			...DESKTOP_POSITION
		});

		expect(geometry.renderedWidth).toBeCloseTo(800, 6);
		expect(geometry.renderedHeight).toBeCloseTo(450, 6);
		expect(geometry.offsetX).toBeCloseTo(0, 6);
		expect(geometry.offsetY).toBeCloseTo(0, 6);
	});

	it('bred ruta: skalar på bredden och spiller över på höjden', () => {
		// 1045x461 är Mitt Hems scenruta vid 1440 px.
		const geometry = getCoverGeometry({
			...SCENE_IMAGE,
			containerWidth: 1045,
			containerHeight: 461,
			...DESKTOP_POSITION
		});

		expect(geometry.renderedWidth).toBeCloseTo(1045, 6);
		expect(geometry.renderedHeight).toBeCloseTo((1045 * 941) / 1672, 6);
		// Ingen horisontell beskärning när rutan är bredare än bilden.
		expect(geometry.offsetX).toBeCloseTo(0, 6);
		expect(geometry.offsetY).toBeLessThan(0);
		expect(geometry.renderedHeight).toBeGreaterThan(461);
	});

	it('smal ruta: skalar på höjden och spiller över på bredden', () => {
		// 351x280 är Mitt Hems scenruta vid 375 px.
		const geometry = getCoverGeometry({
			...SCENE_IMAGE,
			containerWidth: 351,
			containerHeight: 280,
			...MOBILE_POSITION
		});

		expect(geometry.renderedHeight).toBeCloseTo(280, 6);
		expect(geometry.renderedWidth).toBeCloseTo((280 * 1672) / 941, 6);
		expect(geometry.offsetY).toBeCloseTo(0, 6);
		expect(geometry.offsetX).toBeLessThan(0);
		expect(geometry.renderedWidth).toBeGreaterThan(351);
	});

	it('är cover och inte contain: den renderade bilden är aldrig mindre än rutan', () => {
		for (const [containerWidth, containerHeight] of [
			[320, 280],
			[351, 280],
			[728, 323],
			[1045, 461],
			[1040, 520]
		]) {
			const geometry = getCoverGeometry({
				...SCENE_IMAGE,
				containerWidth,
				containerHeight,
				...DESKTOP_POSITION
			});

			expect(geometry.renderedWidth).toBeGreaterThanOrEqual(containerWidth - 1e-9);
			expect(geometry.renderedHeight).toBeGreaterThanOrEqual(containerHeight - 1e-9);
			// contain hade gett minst en axel mindre än rutan.
			const containScale = Math.min(
				containerWidth / SCENE_IMAGE.imageWidth,
				containerHeight / SCENE_IMAGE.imageHeight
			);
			expect(geometry.renderedWidth).not.toBeCloseTo(
				SCENE_IMAGE.imageWidth * containScale,
				3
			);
		}
	});

	it('centrerad object-position delar överspillet lika', () => {
		const geometry = getCoverGeometry({
			...SCENE_IMAGE,
			containerWidth: 351,
			containerHeight: 280,
			objectPositionX: 0.5,
			objectPositionY: 0.5
		});

		expect(geometry.offsetX).toBeCloseTo((351 - geometry.renderedWidth) / 2, 6);
		// Vänsterkanten som skärs bort är lika stor som högerkanten.
		const cutLeft = -geometry.offsetX;
		const cutRight = geometry.renderedWidth + geometry.offsetX - 351;
		expect(cutLeft).toBeCloseTo(cutRight, 6);
	});

	it('object-position X 8 % behåller stugan till vänster i mobilbeskärningen', () => {
		const geometry = getCoverGeometry({
			...SCENE_IMAGE,
			containerWidth: 351,
			containerHeight: 280,
			...MOBILE_POSITION
		});

		expect(geometry.offsetX).toBeCloseTo((351 - geometry.renderedWidth) * 0.08, 6);
		// 8 % skär bort mycket mindre till vänster än en centrerad beskärning.
		const centered = getCoverGeometry({
			...SCENE_IMAGE,
			containerWidth: 351,
			containerHeight: 280,
			objectPositionX: 0.5,
			objectPositionY: 0.52
		});
		expect(-geometry.offsetX).toBeLessThan(-centered.offsetX);
	});

	it('object-position Y 52 % flyttar beskärningen nedåt jämfört med 50 %', () => {
		const base = { ...SCENE_IMAGE, containerWidth: 1045, containerHeight: 461 };
		const at50 = getCoverGeometry({ ...base, objectPositionX: 0.5, objectPositionY: 0.5 });
		const at52 = getCoverGeometry({ ...base, objectPositionX: 0.5, objectPositionY: 0.52 });

		expect(at52.offsetY).toBeLessThan(at50.offsetY);
		expect(at52.offsetY).toBeCloseTo((461 - at52.renderedHeight) * 0.52, 6);
	});

	it('matchar CSS-formeln med max() för alla brytpunkter och båda lägena', () => {
		for (const position of [DESKTOP_POSITION, MOBILE_POSITION]) {
			for (const [containerWidth, containerHeight] of [
				[296, 280],
				[351, 280],
				[728, 323],
				[1045, 461],
				[1040, 520]
			]) {
				const input = { ...SCENE_IMAGE, containerWidth, containerHeight, ...position };
				const geometry = getCoverGeometry(input);
				const reference = referenceCover(input as Required<CoverGeometryInput>);

				expect(geometry.renderedWidth).toBeCloseTo(reference.renderedWidth, 6);
				expect(geometry.renderedHeight).toBeCloseTo(reference.renderedHeight, 6);
				expect(geometry.offsetX).toBeCloseTo(reference.offsetX, 6);
				expect(geometry.offsetY).toBeCloseTo(reference.offsetY, 6);
			}
		}
	});

	it('offset är alltid noll eller negativ - bilden hänger aldrig innanför rutan', () => {
		for (const objectPositionX of [0, 0.08, 0.5, 1]) {
			const geometry = getCoverGeometry({
				...SCENE_IMAGE,
				containerWidth: 351,
				containerHeight: 280,
				objectPositionX,
				objectPositionY: 0.52
			});
			expect(geometry.offsetX).toBeLessThanOrEqual(0);
			expect(geometry.offsetY).toBeLessThanOrEqual(0);
		}
	});

	it('klampar object-position till 0-1 och överlever ogiltiga mått', () => {
		const clamped = getCoverGeometry({
			...SCENE_IMAGE,
			containerWidth: 351,
			containerHeight: 280,
			objectPositionX: 4,
			objectPositionY: -2
		});
		const atEdges = getCoverGeometry({
			...SCENE_IMAGE,
			containerWidth: 351,
			containerHeight: 280,
			objectPositionX: 1,
			objectPositionY: 0
		});
		expect(clamped).toEqual(atEdges);

		expect(
			getCoverGeometry({ ...SCENE_IMAGE, containerWidth: 0, containerHeight: 280 })
		).toEqual({ renderedWidth: 0, renderedHeight: 0, offsetX: 0, offsetY: 0 });
		expect(
			getCoverGeometry({
				imageWidth: Number.NaN,
				imageHeight: 941,
				containerWidth: 351,
				containerHeight: 280
			})
		).toEqual({ renderedWidth: 0, renderedHeight: 0, offsetX: 0, offsetY: 0 });
	});
});

describe('imagePointToScenePoint', () => {
	it('en punkt i bilden hamnar på samma motiv oavsett rutans proportioner', () => {
		// Himmelspunkten som månbanan använder.
		const point = { x: 0.58, y: 0.19 };
		const desktop = imagePointToScenePoint(point, {
			...SCENE_IMAGE,
			containerWidth: 1045,
			containerHeight: 461,
			...DESKTOP_POSITION
		});
		const tablet = imagePointToScenePoint(point, {
			...SCENE_IMAGE,
			containerWidth: 728,
			containerHeight: 323,
			...DESKTOP_POSITION
		});

		// Procenten i rutan skiljer sig - det är hela poängen - men punkten
		// pekar på samma ställe i bilden, alltså samma pixel i motivet.
		expect(desktop.visible).toBe(true);
		expect(tablet.visible).toBe(true);
		const desktopGeometry = getCoverGeometry({
			...SCENE_IMAGE,
			containerWidth: 1045,
			containerHeight: 461,
			...DESKTOP_POSITION
		});
		const tabletGeometry = getCoverGeometry({
			...SCENE_IMAGE,
			containerWidth: 728,
			containerHeight: 323,
			...DESKTOP_POSITION
		});
		expect((desktop.x - desktopGeometry.offsetX) / desktopGeometry.renderedWidth).toBeCloseTo(
			(tablet.x - tabletGeometry.offsetX) / tabletGeometry.renderedWidth,
			9
		);
		expect((desktop.y - desktopGeometry.offsetY) / desktopGeometry.renderedHeight).toBeCloseTo(
			(tablet.y - tabletGeometry.offsetY) / tabletGeometry.renderedHeight,
			9
		);
	});

	it('skiljer sig från att tolka samma tal som containerprocent', () => {
		// Det är precis den här skillnaden buggen bestod av: 58 % av rutan är
		// inte samma sak som 58 % av bilden när cover beskär.
		const point = { x: 0.58, y: 0.19 };
		const scenePoint = imagePointToScenePoint(point, {
			...SCENE_IMAGE,
			containerWidth: 351,
			containerHeight: 280,
			...MOBILE_POSITION
		});

		expect(scenePoint.xPercent).not.toBeCloseTo(58, 0);
		expect(scenePoint.yPercent).toBeCloseTo(19, 6);
		expect(scenePoint.xPercent).toBeGreaterThan(58);
	});

	it('hörnen i bilden mappar mot bildens kanter i rutan', () => {
		const input = {
			...SCENE_IMAGE,
			containerWidth: 1045,
			containerHeight: 461,
			...DESKTOP_POSITION
		};
		const geometry = getCoverGeometry(input);

		const topLeft = imagePointToScenePoint({ x: 0, y: 0 }, input);
		const bottomRight = imagePointToScenePoint({ x: 1, y: 1 }, input);

		expect(topLeft.x).toBeCloseTo(geometry.offsetX, 6);
		expect(topLeft.y).toBeCloseTo(geometry.offsetY, 6);
		expect(bottomRight.x).toBeCloseTo(geometry.offsetX + geometry.renderedWidth, 6);
		expect(bottomRight.y).toBeCloseTo(geometry.offsetY + geometry.renderedHeight, 6);
	});

	it('markerar bortbeskurna punkter som osynliga i stället för att klampa in dem', () => {
		// Lövverket uppe till höger ligger på bild-x 0.68-0.98 och beskärs bort
		// i mobilvyn. Då ska det döljas, inte flyttas in över sjön. y = 0.16 är
		// den del av lövmassan som desktopbeskärningen faktiskt visar - ovanför
		// bild-y 0.1124 är redan bortskuret där.
		const canopy = { x: 0.83, y: 0.16 };
		const mobile = imagePointToScenePoint(canopy, {
			...SCENE_IMAGE,
			containerWidth: 351,
			containerHeight: 280,
			...MOBILE_POSITION
		});
		const desktop = imagePointToScenePoint(canopy, {
			...SCENE_IMAGE,
			containerWidth: 1045,
			containerHeight: 461,
			...DESKTOP_POSITION
		});

		expect(mobile.visible).toBe(false);
		expect(mobile.xPercent).toBeGreaterThan(100);
		expect(desktop.visible).toBe(true);
	});

	it('ger en osynlig nollpunkt när geometrin inte går att räkna ut', () => {
		expect(
			imagePointToScenePoint(
				{ x: 0.5, y: 0.5 },
				{ ...SCENE_IMAGE, containerWidth: 0, containerHeight: 0 }
			)
		).toEqual({ x: 0, y: 0, xPercent: 0, yPercent: 0, visible: false });
	});
});

describe('imageAnchorStyle', () => {
	it('skriver bara de variabler ankaret faktiskt har', () => {
		expect(imageAnchorStyle({ x: 0.58, y: 0.19 })).toBe('--img-x: 0.58; --img-y: 0.19');
		expect(imageAnchorStyle({ x: 0.68, y: -0.01, width: 0.3, height: 0.22 })).toBe(
			'--img-x: 0.68; --img-y: -0.01; --img-w: 0.3; --img-h: 0.22'
		);
	});

	it('image-box bara när både bredd och höjd är bildankrade', () => {
		expect(imageAnchorMode({ x: 0.58, y: 0.19 })).toBe('image');
		expect(imageAnchorMode({ x: 0.58, y: 0.19, width: 0.3 })).toBe('image');
		expect(imageAnchorMode({ x: 0.68, y: 0, width: 0.3, height: 0.22 })).toBe('image-box');
	});
});
