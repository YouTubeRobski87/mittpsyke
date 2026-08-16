import { getProgressCompanionLocalTime } from '$lib/progressCompanion';

/**
 * Framstegs dygnsscen. Egen modul, medvetet skild från den delade
 * getProgressCompanionDayState: den senare namnger samma gränser som
 * morning/day/evening/night och används av hundposerna, Mitt Hem och
 * Kvällsstugan. Här behövs presentationsnamnen morgon/dag/eftermiddag/kväll,
 * och de fyra landskapsbilderna hör bara hemma på Framsteg.
 *
 * Gränserna är identiska med den delade helperns - bara benämningen skiljer:
 *   morning   05:00-09:59
 *   day       10:00-16:59
 *   afternoon 17:00-19:59  (delad helper kallar detta 'evening')
 *   evening   20:00-04:59  (delad helper kallar detta 'night')
 */
export type ProgressSceneBand = 'morning' | 'day' | 'afternoon' | 'evening';

export const PROGRESS_SCENE_BANDS = ['morning', 'day', 'afternoon', 'evening'] as const;

const SCENE_BASE = '/images/scenes/progress-cabin-lakeside';

function sourcesFor(band: ProgressSceneBand) {
	return {
		/**
		 * src pekar på den minsta varianten. Preload-scannern hinner starta en
		 * hämtning av src innan srcset vägts, och då ska det inte vara fullbredd
		 * som går i onödan. Samma resonemang som den ursprungliga scenbilden.
		 */
		fallback: `${SCENE_BASE}-${band}-800.webp`,
		srcset: [
			`${SCENE_BASE}-${band}-800.webp 800w`,
			`${SCENE_BASE}-${band}-1200.webp 1200w`,
			`${SCENE_BASE}-${band}.webp 1672w`
		].join(', ')
	};
}

export const PROGRESS_SCENE_SOURCES: Record<
	ProgressSceneBand,
	{ fallback: string; srcset: string }
> = {
	morning: sourcesFor('morning'),
	day: sourcesFor('day'),
	afternoon: sourcesFor('afternoon'),
	evening: sourcesFor('evening')
};

const SCENE_LABELS: Record<ProgressSceneBand, string> = {
	morning: 'Morgon',
	day: 'Dag',
	afternoon: 'Eftermiddag',
	evening: 'Kväll'
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
	return 'evening';
}

export function getProgressSceneLabel(band: ProgressSceneBand): string {
	return SCENE_LABELS[band];
}

/**
 * TILLFÄLLIG: ?scene=morning|day|afternoon|evening tvingar fram ett dygnsläge
 * oavsett klockan, så scenerna går att granska okulärt. Tas bort innan commit.
 */
export function parseProgressSceneOverride(value: string | null | undefined): ProgressSceneBand | null {
	if (!value) return null;
	return (PROGRESS_SCENE_BANDS as readonly string[]).includes(value)
		? (value as ProgressSceneBand)
		: null;
}
