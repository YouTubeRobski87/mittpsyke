// Companion Bond - hur väl följeslagaren känner användaren.
//
// Bandet är rent additivt och härleds ur antalet dagar användaren faktiskt
// svarat på följeslagarens fråga. Det finns alltså inget lagrat poängsaldo som
// kan sjunka, ingen streak som kan brytas och ingen frånvaro som kostar något:
// en missad dag ger noll, aldrig minus. Det är ett medvetet arkitekturval, inte
// bara en regel i koden - se docs/NORTH_STAR.md ("Ingen skuld").
//
// Värdet är internt. V1 visar varken siffror, nivåer eller mätare för
// användaren; bandet ska märkas i upplevelsen, inte i ett gränssnitt.

/** Ett svar på dagens fråga. Hoppa över ger medvetet ingenting. */
export const COMPANION_BOND_PER_ANSWER = 1;

/**
 * Förberedd, ännu inte utnyttjad: nivåerna finns så att kommande steg (nya
 * poser, hur nära följeslagaren står, fler reaktioner, besökare) kan härledas
 * ur bandet utan att lagringen behöver ändras. V1 läser dem inte.
 */
export type CompanionBondLevel = 0 | 1 | 2 | 3;

const COMPANION_BOND_LEVEL_THRESHOLDS: Record<Exclude<CompanionBondLevel, 0>, number> = {
	1: 3,
	2: 10,
	3: 25
};

function toSafeCount(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
	return Math.max(0, Math.floor(value));
}

/**
 * Bandet utifrån antalet besvarade dagar. Aldrig negativt, aldrig beroende av
 * när svaren gavs - tio svar med ett års uppehåll emellan är värda exakt lika
 * mycket som tio svar i rad.
 */
export function getCompanionBond(answeredDayCount: unknown): number {
	return toSafeCount(answeredDayCount) * COMPANION_BOND_PER_ANSWER;
}

export function getCompanionBondLevel(bond: unknown): CompanionBondLevel {
	const value = toSafeCount(bond);
	if (value >= COMPANION_BOND_LEVEL_THRESHOLDS[3]) return 3;
	if (value >= COMPANION_BOND_LEVEL_THRESHOLDS[2]) return 2;
	if (value >= COMPANION_BOND_LEVEL_THRESHOLDS[1]) return 1;
	return 0;
}
