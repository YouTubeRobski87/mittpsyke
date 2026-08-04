const FALLBACK_COPY = 'Din plats förändras när du återkommer och skriver över tid.';

/**
 * Förklarar varsamt sambandet mellan sparade reflektioner och den personliga
 * platsen. Bara ett positivt heltal är ett trovärdigt antal att visa.
 */
export function getLivingWorldReflectionCopy(entryCount: unknown): string {
	if (typeof entryCount !== 'number' || !Number.isFinite(entryCount) || !Number.isInteger(entryCount) || entryCount <= 0) {
		return FALLBACK_COPY;
	}

	return `Din plats har vuxit i takt med dina ${entryCount} sparade reflektioner.`;
}

export { FALLBACK_COPY as LIVING_WORLD_REFLECTION_FALLBACK_COPY };
