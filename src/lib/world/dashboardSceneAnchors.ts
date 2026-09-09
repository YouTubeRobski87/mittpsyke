/**
 * Bildankare för Mitt Hems stugscen.
 *
 * Här bor mätvärdena för `dashboard-cabin-view-clean.webp`: var i fotot
 * himlen, lövverket och stugan faktiskt ligger. Allt uttrycks som andelar av
 * originalbilden (0-1), så lagren följer motivet när `object-fit: cover`
 * beskär bilden olika i olika scenrutor.
 *
 * Bara lager som representerar en fysisk punkt i fotot hör hemma här. Moln som
 * driver förbi, fåglar som glider genom bild och dimband som spänner över hela
 * bredden ska fortsätta ligga i scenrymd - de har ingen geografi att följa.
 *
 * Se $lib/world/coverGeometry för själva omräkningen.
 */

import type { ImageAnchor } from './coverGeometry';
import { getMoonArcProgress } from '$lib/worldScene';
import type { LivingWorldScene } from '$lib/worldScene';

/** Scenbildens intrinsiska mått. Samma värden som img-taggens width/height. */
export const DASHBOARD_SCENE_IMAGE = {
	width: 1672,
	height: 941
} as const;

export const DASHBOARD_SCENE_IMAGE_ASPECT =
	DASHBOARD_SCENE_IMAGE.width / DASHBOARD_SCENE_IMAGE.height;

/**
 * `object-position` i CSS, som andelar. Måste hållas i takt med
 * `.companion-hero-scene` i routen - både där och här styr de var bilden
 * beskärs, och glider de isär hamnar ankarna fel.
 */
export const DASHBOARD_SCENE_OBJECT_POSITION = {
	/** Desktop och surfplatta: `object-position: 50% 52%`. */
	wide: { x: 0.5, y: 0.52 },
	/** Under 620 px: `object-position: 8% 52%` - stugan behålls till vänster. */
	compact: { x: 0.08, y: 0.52 }
} as const;

/**
 * Den fotografiska himmelsficka månen får röra sig i: mellan tallarna och
 * björkstammen till vänster (slut ungefär bild-x 0.50) och lövmassan uppe till
 * höger, ovanför bergsryggen som börjar kring bild-y 0.31.
 *
 * Uppmätt i bilden, inte härlett ur den gamla scenrymdsbågen. Slutpunkten är
 * medvetet dragen till 0.575: längre åt höger glider månskivan in under Mitt
 * Hems högra textyta mot slutet av natten.
 */
export const DASHBOARD_MOON_SKY = {
	startX: 0.505,
	endX: 0.575,
	/** Bild-y vid nattens kanter - strax ovanför bergsryggen. */
	baseY: 0.295,
	/** Hur högt bågen når mitt i natten, i andel av bildens höjd. */
	riseY: 0.105
} as const;

/**
 * Månens läge i bildrymd för en given punkt på nattbågen (0-1).
 *
 * Formen är densamma som scenrymdsbågen i `getMoonPosition` - linjär i x, en
 * sinusbåge i y - men lagd i fotots himmel i stället för i rutans procent.
 * Tidsmappningen kommer fortfarande enbart från `getMoonArcProgress`.
 */
export function getDashboardMoonAnchor(progress: number): ImageAnchor {
	const clamped = Math.min(Math.max(progress, 0), 1);
	return {
		x: DASHBOARD_MOON_SKY.startX + clamped * (DASHBOARD_MOON_SKY.endX - DASHBOARD_MOON_SKY.startX),
		y: DASHBOARD_MOON_SKY.baseY - Math.sin(clamped * Math.PI) * DASHBOARD_MOON_SKY.riseY
	};
}

/**
 * Lövmassan som hänger in uppifrån höger i fotot: björkens krona mellan
 * bild-x 0.68 och 0.98, ned till ungefär bild-y 0.21. Toppen ligger utanför
 * desktopbeskärningen, därför det negativa y-värdet - lagret ska klippas där,
 * inte tryckas ned i bild.
 *
 * I mobilbeskärningen syns bara bild-x upp till ~0.63-0.73, så hela ankaret
 * hamnar utanför rutan och klipps bort. Det är avsikten: hellre osynligt än
 * svajande över öppet vatten.
 */
export const DASHBOARD_CANOPY_RIGHT_ANCHOR: ImageAnchor = {
	x: 0.68,
	y: -0.01,
	width: 0.3,
	height: 0.22
};

/**
 * Bildankarna för en given scen. Månen får bara ett ankare när den faktiskt
 * är tänd; övriga lager lämnas i scenrymd och rörs inte.
 */
export function getDashboardImageAnchors(
	scene: Pick<LivingWorldScene, 'timeOfDay' | 'localTimeMinutes'>
): Record<string, ImageAnchor> {
	const anchors: Record<string, ImageAnchor> = {
		'canopy-right': DASHBOARD_CANOPY_RIGHT_ANCHOR
	};

	const moonProgress = getMoonArcProgress(scene.timeOfDay, scene.localTimeMinutes);
	if (moonProgress !== null) anchors.moon = getDashboardMoonAnchor(moonProgress);

	return anchors;
}
