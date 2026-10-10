import type {
	ProgressCompanionDayState,
	ProgressCompanionSeason
} from '$lib/progressCompanion';

export type ReturnAbsenceBand = 'recent' | 'few-days' | 'longer';
export type ReturnTransientKind = 'gathered-leaves' | 'animal-tracks';

export type ReturnTransientItem = {
	x: number;
	y: number;
	rotation: number;
	scale: number;
	opacity: number;
};

export type ReturnTransient = {
	kind: ReturnTransientKind;
	items: ReturnTransientItem[];
};

const FEW_DAYS_MIN = 3;
const LONGER_ABSENCE_MIN = 14;

function hash(value: string): number {
	let result = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		result ^= value.charCodeAt(index);
		result = Math.imul(result, 16777619);
	}
	return (result >>> 0) / 2 ** 32;
}

function between(seed: string, key: string, min: number, max: number): number {
	return min + hash(`${seed}:${key}`) * (max - min);
}

/** Grova interna band. De visas aldrig som siffror eller status i gränssnittet. */
export function getReturnAbsenceBand(daysSinceLastVisit: number | null): ReturnAbsenceBand {
	if (daysSinceLastVisit === null || daysSinceLastVisit < FEW_DAYS_MIN) return 'recent';
	if (daysSinceLastVisit < LONGER_ABSENCE_MIN) return 'few-days';
	return 'longer';
}

function itemsFor(seed: string, count: number, area: { x: [number, number]; y: [number, number] }) {
	return Array.from({ length: count }, (_, index): ReturnTransientItem => ({
		x: between(seed, `${index}:x`, area.x[0], area.x[1]),
		y: between(seed, `${index}:y`, area.y[0], area.y[1]),
		rotation: between(seed, `${index}:rotation`, -34, 34),
		scale: between(seed, `${index}:scale`, 0.78, 1.12),
		opacity: between(seed, `${index}:opacity`, 0.46, 0.7)
	}));
}

/**
 * Första återkomsten kan lämna ett enda neutralt naturtecken i scenen. Planen
 * är ren och stabil för besökets befintliga seed; den läser ingen aktivitet,
 * progression, relation eller känslig data och skapar ingen ny persistence.
 */
export function getReturnTransients(input: {
	daysSinceLastVisit: number | null;
	season: ProgressCompanionSeason;
	timeOfDay: ProgressCompanionDayState;
	visitSeed: string | null;
}): ReturnTransient[] {
	const band = getReturnAbsenceBand(input.daysSinceLastVisit);
	if (band === 'recent' || !input.visitSeed) return [];

	if (input.season === 'autumn') {
		const count = band === 'longer' ? 5 : 3;
		return [{
			kind: 'gathered-leaves',
			items: itemsFor(`${input.visitSeed}:return-leaves`, count, { x: [80.5, 88], y: [77, 82] })
		}];
	}

	if (
		input.season === 'winter' &&
		band === 'longer' &&
		(input.timeOfDay === 'morning' || input.timeOfDay === 'day')
	) {
		return [{
			kind: 'animal-tracks',
			items: itemsFor(`${input.visitSeed}:return-tracks`, 4, { x: [74, 83], y: [72, 79] })
		}];
	}

	return [];
}
