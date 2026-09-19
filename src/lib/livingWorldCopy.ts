const FALLBACK_COPY = 'Din plats förändras när du återkommer och skriver över tid.';

/**
 * Förklarar varsamt sambandet mellan sparade dagboksinlägg och den personliga
 * platsen. Bara ett positivt heltal är ett trovärdigt antal att visa.
 *
 * Talet är antalet rader i `diary`. Det kallas dagboksinlägg - samma ord som
 * "Vad det här bygger på" använder för samma tal - och inte "reflektioner",
 * som i världen betyder svar på dagens fråga och i dagboken AI-reflektioner.
 */
export function getLivingWorldReflectionCopy(entryCount: unknown): string {
	if (typeof entryCount !== 'number' || !Number.isFinite(entryCount) || !Number.isInteger(entryCount) || entryCount <= 0) {
		return FALLBACK_COPY;
	}

	if (entryCount === 1) return 'Din plats har vuxit i takt med ditt första sparade dagboksinlägg.';
	return `Din plats har vuxit i takt med dina ${entryCount} sparade dagboksinlägg.`;
}

export { FALLBACK_COPY as LIVING_WORLD_REFLECTION_FALLBACK_COPY };
