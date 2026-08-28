export const EVENING_INTERIOR_RUG_MINIMUM_DISTINCT_DAYS = 3;
export const EVENING_INTERIOR_BLANKET_MINIMUM_DISTINCT_DAYS = 5;
export const EVENING_INTERIOR_BLANKET_MINIMUM_SPAN_DAYS = 7;
// Verandan kräver både återkomst och tidsspann, eftersom den speglar
// kontinuitet över tid och inte hur tätt kvällarna ligger. Värdena ligger på
// exakt det dubbla mot filten (5 dagar / 7 spann), så trappan bok → matta →
// filt → veranda behåller sina proportioner.
export const EVENING_VERANDA_MINIMUM_DISTINCT_DAYS = 8;
export const EVENING_VERANDA_MINIMUM_SPAN_DAYS = 14;

export type EveningInteriorMemory = {
	hasBook: boolean;
	hasRug: boolean;
	hasBlanket: boolean;
	hasVeranda: boolean;
};

export const EMPTY_EVENING_INTERIOR_MEMORY: EveningInteriorMemory = {
	hasBook: false,
	hasRug: false,
	hasBlanket: false,
	hasVeranda: false
};

function getCalendarDayNumber(value: unknown): number | null {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}

	return date.getTime() / 86_400_000;
}

/** Bygger bara på den servervaliderade svenska kalenderdagen, aldrig fritext. */
export function getEveningInteriorMemory(checkinDates: readonly unknown[]): EveningInteriorMemory {
	const savedDays = [...new Set(checkinDates.map(getCalendarDayNumber).filter((day): day is number => day !== null))].sort(
		(first, second) => first - second
	);
	const spanDays = savedDays.length > 0 ? savedDays.at(-1)! - savedDays[0] : 0;
	const hasBlanket =
		savedDays.length >= EVENING_INTERIOR_BLANKET_MINIMUM_DISTINCT_DAYS &&
		spanDays >= EVENING_INTERIOR_BLANKET_MINIMUM_SPAN_DAYS;
	const hasVeranda =
		savedDays.length >= EVENING_VERANDA_MINIMUM_DISTINCT_DAYS &&
		spanDays >= EVENING_VERANDA_MINIMUM_SPAN_DAYS;

	return {
		hasBook: savedDays.length > 0,
		hasRug: savedDays.length >= EVENING_INTERIOR_RUG_MINIMUM_DISTINCT_DAYS,
		hasBlanket,
		hasVeranda
	};
}

export function isEveningInteriorMemory(value: unknown): value is EveningInteriorMemory {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const memory = value as Record<string, unknown>;
	return (
		typeof memory.hasBook === 'boolean' &&
		typeof memory.hasRug === 'boolean' &&
		typeof memory.hasBlanket === 'boolean' &&
		typeof memory.hasVeranda === 'boolean'
	);
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

/** Filten får bara introduceras vid övergången till verklig eligibility. */
export function shouldIntroduceEveningInteriorBlanket(
	wasEligible: boolean,
	isEligible: boolean
): boolean {
	return !wasEligible && isEligible;
}

/** Verandan får bara introduceras vid övergången till verklig eligibility. */
export function shouldIntroduceEveningVeranda(
	wasEligible: boolean,
	isEligible: boolean
): boolean {
	return !wasEligible && isEligible;
}
