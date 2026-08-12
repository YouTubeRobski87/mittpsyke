// Världens korta svar på att användaren reflekterat.
//
// Rent kosmetiskt och helt transient: ingenting här sparas, räknas eller matas
// in i Growth Garden. Den permanenta tillväxten ligger kvar i
// getGardenGrowthPoints/getGrowthLevel och påverkas inte av den här modulen.
//
// Modulen äger bara reglerna - när världen får svara, hur länge, och hur den
// svarar när användaren bett om mindre rörelse. Själva animationen bor i
// CompanionWorldResponse.svelte.

import type { CompanionDailyStatus } from '$lib/companionDailyQuestion';

/** Hur länge pusten drar genom scenen. Kort nog att kännas som en andning. */
export const WORLD_RESPONSE_DURATION_MS = 1_500;

/**
 * Liten fördröjning efter svaret, så följeslagarens reaktion hinner först.
 * Ordningen ska läsas som en sammanhängande händelse, inte som två system.
 */
export const WORLD_RESPONSE_DELAY_MS = 120;

export type WorldResponseMode = 'motion' | 'still';

/**
 * Vid reducerad rörelse förflyttas ingenting - samma pust tonar i stället upp
 * och ner på plats. Ingen egen accessibility-logik: anroparen läser
 * reducedMotion ur den delade createMotionAwareness().
 */
export function getWorldResponseMode(reducedMotion: boolean): WorldResponseMode {
	return reducedMotion ? 'still' : 'motion';
}

export type WorldResponseTrigger = {
	isAnonymous: boolean;
	/** Dagens status *innan* svaret skickades. Bara 'pending' får svara. */
	previousStatus: CompanionDailyStatus | null;
	/** null = hoppa över. Hoppa över ger ingen respons. */
	answerId: string | null;
	/** Om servern bekräftade sparningen. */
	requestOk: boolean;
};

/**
 * Världen svarar bara på dagens första faktiska svar, och först när servern
 * bekräftat det. Den svarar alltså aldrig när frågan laddas, vid refresh eller
 * navigation tillbaka samma dag (status är då inte längre 'pending'), vid
 * hoppa över, för anonyma besökare, eller när anropet misslyckats.
 */
export function shouldTriggerWorldResponse(input: WorldResponseTrigger): boolean {
	if (input.isAnonymous) return false;
	if (input.previousStatus !== 'pending') return false;
	if (!input.answerId) return false;
	return input.requestOk;
}
