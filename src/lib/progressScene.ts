import { getProgressCompanionLocalTime } from '$lib/progressCompanion';

/**
 * Framstegs dygnsscen. Egen modul, medvetet skild från den delade
 * getProgressCompanionDayState: den senare namnger samma gränser som
 * morning/day/evening/night och används av hundposerna, gamla /dashboard och
 * Kvällstugan (dagens Mitt Hem). Här behövs presentationsnamnen morgon/dag/eftermiddag/kväll,
 * och scenpresentationen hör bara hemma på Framsteg.
 *
 * De fyra första gränserna delas med den delade helpern - bara benämningen
 * skiljer. Framstegs kvällsband delas dessutom i kväll och natt, eftersom
 * natten har en egen scenbild:
 *   morning   05:00-09:59
 *   day       10:00-16:59
 *   afternoon 17:00-19:59  (delad helper kallar detta 'evening')
 *   evening   20:00-22:59  (delad helper: 'night')
 *   night     23:00-04:59  (delad helper: 'night')
 */
export type ProgressSceneBand = 'morning' | 'day' | 'afternoon' | 'evening' | 'night';

export type ProgressSceneTransitionState = {
	visibleBand: ProgressSceneBand;
	pendingBand: ProgressSceneBand | null;
	outgoingBand: ProgressSceneBand | null;
};

/**
 * Tiden som två landskapsbilder får överlappa vid ett fasbyte. Kvällens
 * solnedgång och nattbilden skiljer sig kraftigt i ljus, så bytet får ta sex
 * sekunder - som när ljuset faktiskt sjunker - i stället för att hoppa.
 */
export const PROGRESS_SCENE_CROSSFADE_MS = 6_000;

export const PROGRESS_SCENE_BANDS = ['morning', 'day', 'afternoon', 'evening', 'night'] as const;

// En statisk komposition: sjö, berg, stuga, människa, björn, lägereld, ryggsäck
// och mugg. Björnen är en del av Framstegsscenen, inte användarens följeslagare.
const SCENE_BASE = '/images/scenes/progress-lake-bear';
const COMPANION_SCENE_BASE = '/images/scenes/progress-lake';

function sourcesForProgressLake(base: string) {
	return {
		/**
		 * src pekar på den minsta varianten. Preload-scannern hinner starta en
		 * hämtning av src innan srcset vägts, och då ska det inte vara fullbredd
		 * som går i onödan. Samma resonemang som den ursprungliga scenbilden.
		 */
		fallback: `${base}-800.webp`,
		srcset: [
			`${base}-800.webp 800w`,
			`${base}-1200.webp 1200w`,
			`${base}.webp 1672w`
		].join(', ')
	};
}

const PROGRESS_LAKE_SOURCES = sourcesForProgressLake(SCENE_BASE);
const PROGRESS_COMPANION_LAKE_SOURCES = sourcesForProgressLake(COMPANION_SCENE_BASE);
// Morgon-, dag-, kvälls- och nattvarianterna är per-pixel-relights av samma bilder
// (scripts/scene-relight.py), så kompositionen och alla scenkoordinater är
// oförändrade. Bara eftermiddagen använder originalets solnedgång.
const PROGRESS_LAKE_DAY_SOURCES = sourcesForProgressLake(`${SCENE_BASE}-day`);
const PROGRESS_LAKE_EVENING_SOURCES = sourcesForProgressLake(`${SCENE_BASE}-evening`);
const PROGRESS_COMPANION_LAKE_DAY_SOURCES = sourcesForProgressLake(`${COMPANION_SCENE_BASE}-day`);
const PROGRESS_COMPANION_LAKE_EVENING_SOURCES = sourcesForProgressLake(
	`${COMPANION_SCENE_BASE}-evening`
);
const PROGRESS_LAKE_MORNING_SOURCES = sourcesForProgressLake(`${SCENE_BASE}-morning`);
const PROGRESS_COMPANION_LAKE_MORNING_SOURCES = sourcesForProgressLake(
	`${COMPANION_SCENE_BASE}-morning`
);
const PROGRESS_LAKE_NIGHT_SOURCES = sourcesForProgressLake(`${SCENE_BASE}-night`);
const PROGRESS_COMPANION_LAKE_NIGHT_SOURCES = sourcesForProgressLake(`${COMPANION_SCENE_BASE}-night`);

export const PROGRESS_SCENE_SOURCES: Record<
	ProgressSceneBand,
	{ fallback: string; srcset: string }
> = {
	morning: PROGRESS_LAKE_MORNING_SOURCES,
	day: PROGRESS_LAKE_DAY_SOURCES,
	afternoon: PROGRESS_LAKE_SOURCES,
	evening: PROGRESS_LAKE_EVENING_SOURCES,
	night: PROGRESS_LAKE_NIGHT_SOURCES
};

/** Den inloggade användarens följeslagare behöver den artneutrala bilden. */
export const PROGRESS_COMPANION_SCENE_SOURCES: Record<
	ProgressSceneBand,
	{ fallback: string; srcset: string }
> = {
	morning: PROGRESS_COMPANION_LAKE_MORNING_SOURCES,
	day: PROGRESS_COMPANION_LAKE_DAY_SOURCES,
	afternoon: PROGRESS_COMPANION_LAKE_SOURCES,
	evening: PROGRESS_COMPANION_LAKE_EVENING_SOURCES,
	night: PROGRESS_COMPANION_LAKE_NIGHT_SOURCES
};

const SCENE_LABELS: Record<ProgressSceneBand, string> = {
	morning: 'Morgon',
	day: 'Dag',
	afternoon: 'Eftermiddag',
	evening: 'Kväll',
	night: 'Natt'
};

export function getProgressSceneBand(date = new Date()): ProgressSceneBand {
	// Ett ogiltigt datum får Intl.formatToParts att kasta, så det fångas här
	// i stället för att slå upp i vyn. Dag är den neutrala fallbacken.
	if (Number.isNaN(date.getTime())) return 'day';

	const { hour } = getProgressCompanionLocalTime(date);

	if (!Number.isFinite(hour)) return 'day';
	if (hour >= 5 && hour < 10) return 'morning';
	if (hour >= 10 && hour < 17) return 'day';
	if (hour >= 17 && hour < 20) return 'afternoon';
	if (hour >= 20 && hour < 23) return 'evening';
	return 'night';
}

export function getProgressSceneLabel(band: ProgressSceneBand): string {
	return SCENE_LABELS[band];
}

/**
 * Förbereder nästa bild utan att byta den synliga scenen. Routens osynliga img
 * får först ladda klart; först därefter bekräftas övergången nedan. Därmed
 * finns alltid en hel scen under följeslagare och world marks.
 */
export function prepareProgressSceneTransition(
	state: ProgressSceneTransitionState,
	nextBand: ProgressSceneBand
): ProgressSceneTransitionState {
	if (nextBand === state.visibleBand || nextBand === state.pendingBand) return state;
	return { ...state, pendingBand: nextBand };
}

/** Bekräftar endast den bild som just nu väntar på att få visas. */
export function completeProgressSceneTransition(
	state: ProgressSceneTransitionState,
	loadedBand: ProgressSceneBand
): ProgressSceneTransitionState {
	if (loadedBand !== state.pendingBand) return state;
	return {
		visibleBand: loadedBand,
		pendingBand: null,
		outgoingBand: state.visibleBand
	};
}

export function clearProgressSceneOutgoing(
	state: ProgressSceneTransitionState
): ProgressSceneTransitionState {
	return state.outgoingBand ? { ...state, outgoingBand: null } : state;
}
