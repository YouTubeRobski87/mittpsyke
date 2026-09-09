import { describe, expect, it } from 'vitest';
import { getCoverGeometry, imagePointToScenePoint } from './coverGeometry';
import {
	DASHBOARD_CANOPY_RIGHT_ANCHOR,
	DASHBOARD_SCENE_IMAGE,
	DASHBOARD_SCENE_IMAGE_ASPECT,
	DASHBOARD_SCENE_OBJECT_POSITION,
	getDashboardImageAnchors,
	getDashboardMoonAnchor
} from './dashboardSceneAnchors';

/**
 * Mitt Hems scenruta vid de fem QA-bredderna, uppmätta i webbläsaren.
 * `compact` markerar de bredder där routen byter till object-position 8 %.
 */
const BREAKPOINTS = [
	{ label: '320', width: 296, height: 280, compact: true },
	{ label: '375', width: 351, height: 280, compact: true },
	{ label: '768', width: 728, height: 323, compact: false },
	{ label: '1440', width: 1045, height: 461, compact: false },
	{ label: '1920', width: 1040, height: 520, compact: false }
] as const;

function geometryInput(breakpoint: (typeof BREAKPOINTS)[number]) {
	const position = breakpoint.compact
		? DASHBOARD_SCENE_OBJECT_POSITION.compact
		: DASHBOARD_SCENE_OBJECT_POSITION.wide;
	return {
		imageWidth: DASHBOARD_SCENE_IMAGE.width,
		imageHeight: DASHBOARD_SCENE_IMAGE.height,
		containerWidth: breakpoint.width,
		containerHeight: breakpoint.height,
		objectPositionX: position.x,
		objectPositionY: position.y
	};
}

/** Det synliga bildfönstret som andelar av originalbilden. */
function visibleImageWindow(breakpoint: (typeof BREAKPOINTS)[number]) {
	const input = geometryInput(breakpoint);
	const geometry = getCoverGeometry(input);
	return {
		x0: -geometry.offsetX / geometry.renderedWidth,
		x1: (-geometry.offsetX + input.containerWidth) / geometry.renderedWidth,
		y0: -geometry.offsetY / geometry.renderedHeight,
		y1: (-geometry.offsetY + input.containerHeight) / geometry.renderedHeight
	};
}

describe('scenbildens konstanter', () => {
	it('proportionerna matchar den faktiska bilden', () => {
		expect(DASHBOARD_SCENE_IMAGE_ASPECT).toBeCloseTo(1672 / 941, 9);
		expect(DASHBOARD_SCENE_IMAGE_ASPECT).toBeGreaterThan(1.77);
		expect(DASHBOARD_SCENE_IMAGE_ASPECT).toBeLessThan(1.78);
	});

	it('mobilbeskärningen behåller stugan och tappar sjökanten till höger', () => {
		const compact = visibleImageWindow(BREAKPOINTS[1]);
		const wide = visibleImageWindow(BREAKPOINTS[3]);

		// Stugan ligger på bild-x 0-0.30 och måste finnas kvar i båda.
		expect(compact.x0).toBeLessThan(0.05);
		expect(wide.x0).toBeCloseTo(0, 6);
		// Mobilen visar bara vänstra tre fjärdedelarna av bilden.
		expect(compact.x1).toBeLessThan(0.75);
		expect(wide.x1).toBeCloseTo(1, 6);
	});
});

describe('getDashboardMoonAnchor', () => {
	it('håller sig i den uppmätta himmelsfickan hela natten', () => {
		for (let step = 0; step <= 20; step += 1) {
			const anchor = getDashboardMoonAnchor(step / 20);
			// Till vänster om 0.50 börjar tallarna och björkstammen.
			expect(anchor.x).toBeGreaterThanOrEqual(0.5);
			// Till höger om 0.60 hamnar månen bakom Mitt Hems textyta.
			expect(anchor.x).toBeLessThanOrEqual(0.6);
			// Ovanför 0.18 börjar lövmassan, under 0.31 börjar bergsryggen.
			expect(anchor.y).toBeGreaterThanOrEqual(0.18);
			expect(anchor.y).toBeLessThanOrEqual(0.31);
		}
	});

	it('stiger mot mitten av natten och sjunker igen', () => {
		const start = getDashboardMoonAnchor(0);
		const middle = getDashboardMoonAnchor(0.5);
		const end = getDashboardMoonAnchor(1);

		// Mindre y = högre upp i bilden.
		expect(middle.y).toBeLessThan(start.y);
		expect(middle.y).toBeLessThan(end.y);
		expect(start.y).toBeCloseTo(end.y, 9);
		expect(start.x).toBeLessThan(middle.x);
		expect(middle.x).toBeLessThan(end.x);
	});

	it('klampar utanför 0-1 i stället för att lämna bågen', () => {
		expect(getDashboardMoonAnchor(-3)).toEqual(getDashboardMoonAnchor(0));
		expect(getDashboardMoonAnchor(9)).toEqual(getDashboardMoonAnchor(1));
	});

	it('pekar på samma bildpunkt oavsett brytpunkt - det är hela poängen', () => {
		const anchor = getDashboardMoonAnchor(0.5);
		const scenePercents = BREAKPOINTS.map(
			(breakpoint) => imagePointToScenePoint(anchor, geometryInput(breakpoint)).xPercent
		);

		// Scenprocenten skiljer sig mellan brytpunkterna...
		expect(new Set(scenePercents.map((value) => value.toFixed(2))).size).toBeGreaterThan(1);
		// ...men punkten ligger på samma motiv, och den syns på var och en.
		for (const breakpoint of BREAKPOINTS) {
			expect(imagePointToScenePoint(anchor, geometryInput(breakpoint)).visible).toBe(true);
		}
	});

	it('ligger i den del av himlen som desktopbeskärningen faktiskt visar', () => {
		for (const breakpoint of BREAKPOINTS.filter((entry) => !entry.compact)) {
			const window = visibleImageWindow(breakpoint);
			for (const progress of [0, 0.5, 1]) {
				const anchor = getDashboardMoonAnchor(progress);
				expect(anchor.y).toBeGreaterThan(window.y0);
				expect(anchor.y).toBeLessThan(window.y1);
			}
		}
	});
});

describe('DASHBOARD_CANOPY_RIGHT_ANCHOR', () => {
	it('täcker den fotografiska lövmassan uppe till höger', () => {
		expect(DASHBOARD_CANOPY_RIGHT_ANCHOR.x).toBeCloseTo(0.68, 6);
		expect(DASHBOARD_CANOPY_RIGHT_ANCHOR.x + (DASHBOARD_CANOPY_RIGHT_ANCHOR.width ?? 0)).toBeCloseTo(
			0.98,
			6
		);
		// Toppen ligger ovanför bildkanten och ska klippas, inte tryckas ned.
		expect(DASHBOARD_CANOPY_RIGHT_ANCHOR.y).toBeLessThan(0);
	});

	it('syns på desktop och beskärs bort på mobil i stället för att flyttas', () => {
		const centre = {
			x: DASHBOARD_CANOPY_RIGHT_ANCHOR.x + (DASHBOARD_CANOPY_RIGHT_ANCHOR.width ?? 0) / 2,
			y: 0.16
		};

		for (const breakpoint of BREAKPOINTS) {
			const scenePoint = imagePointToScenePoint(centre, geometryInput(breakpoint));
			if (breakpoint.compact) {
				// Utanför rutan till höger - overflow: hidden klipper bort det.
				expect(scenePoint.visible).toBe(false);
				expect(scenePoint.xPercent).toBeGreaterThan(100);
			} else {
				expect(scenePoint.visible).toBe(true);
				// Och den sitter i scenens högra tredjedel, där lövverket är.
				expect(scenePoint.xPercent).toBeGreaterThan(70);
			}
		}
	});
});

describe('getDashboardImageAnchors', () => {
	it('ger bara lövverket på dagen - månen har inget läge då', () => {
		const anchors = getDashboardImageAnchors({ timeOfDay: 'day', localTimeMinutes: 13 * 60 });
		expect(Object.keys(anchors)).toEqual(['canopy-right']);
	});

	it('lägger till månen på natten, på samma bana som nattens gång', () => {
		const early = getDashboardImageAnchors({ timeOfDay: 'night', localTimeMinutes: 20 * 60 });
		const late = getDashboardImageAnchors({ timeOfDay: 'night', localTimeMinutes: 5 * 60 });

		expect(early.moon).toEqual(getDashboardMoonAnchor(0));
		expect(late.moon).toEqual(getDashboardMoonAnchor(1));
		expect(early['canopy-right']).toEqual(DASHBOARD_CANOPY_RIGHT_ANCHOR);
	});

	it('ankrar inget annat lager - resten ligger kvar i scenrymd', () => {
		const anchors = getDashboardImageAnchors({ timeOfDay: 'night', localTimeMinutes: 0 });
		expect(Object.keys(anchors).sort()).toEqual(['canopy-right', 'moon']);
		for (const id of ['cloud-back', 'cloud-front', 'grass-left', 'grass-bank', 'mist-one']) {
			expect(anchors[id]).toBeUndefined();
		}
	});
});
