import { env } from '$env/dynamic/private';

// Feature flags för EI-v2. Båda är AV som standard.
//
// När båda är av ska användaren få exakt dagens beteende. Flaggorna läses via
// $env/dynamic/private, så de kan ändras i Render utan ombyggnad.

/** Endast strängen "true" slår på flaggan. Allt annat, inklusive tomt, är av. */
function readBooleanFlag(value: string | undefined): boolean {
	return value?.trim().toLowerCase() === 'true';
}

/** Huvudflagga. Av innebär att ingenting i EI-v2 påverkar körningen. */
export function isEiV2Enabled(): boolean {
	return readBooleanFlag(env.EI_V2_ENABLED);
}

/**
 * Shadow mode. Kräver att huvudflaggan också är på.
 *
 * Shadow mode får aldrig ersätta det synliga svaret och får aldrig spara
 * användartext. Den producerar bara en DecisionLog vid sidan av.
 */
export function isEiV2ShadowModeEnabled(): boolean {
	return isEiV2Enabled() && readBooleanFlag(env.EI_V2_SHADOW_MODE);
}
