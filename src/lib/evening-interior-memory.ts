export const EVENING_INTERIOR_RUG_MINIMUM_DISTINCT_DAYS = 3;

export type EveningInteriorMemory = {
	hasBook: boolean;
	hasRug: boolean;
};

export const EMPTY_EVENING_INTERIOR_MEMORY: EveningInteriorMemory = {
	hasBook: false,
	hasRug: false
};

function isCheckinDate(value: unknown): value is string {
	return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Bygger bara på den servervaliderade svenska kalenderdagen, aldrig fritext. */
export function getEveningInteriorMemory(checkinDates: readonly unknown[]): EveningInteriorMemory {
	const savedDates = new Set(checkinDates.filter(isCheckinDate));
	return {
		hasBook: savedDates.size > 0,
		hasRug: savedDates.size >= EVENING_INTERIOR_RUG_MINIMUM_DISTINCT_DAYS
	};
}

export function isEveningInteriorMemory(value: unknown): value is EveningInteriorMemory {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const memory = value as Record<string, unknown>;
	return typeof memory.hasBook === 'boolean' && typeof memory.hasRug === 'boolean';
}

/**
 * Boken behåller V1-beteendet: persistence eller en just bekräftad sparning
 * räcker för att den ska synas i den öppna sessionen.
 */
export function isEveningInteriorMemoryEligible(
	hasPersistedEveningCheckin: boolean,
	saveSucceeded: boolean
): boolean {
	return hasPersistedEveningCheckin || saveSucceeded;
}

/** Mattan får bara introduceras vid övergången till verklig eligibility. */
export function shouldIntroduceEveningInteriorRug(
	wasEligible: boolean,
	isEligible: boolean
): boolean {
	return !wasEligible && isEligible;
}
