import type { ProgressCompanionDayState, ProgressCompanionSeason } from '$lib/progressCompanion';
import type { WorldGrowthLevel } from '$lib/worldScene';

export type AmbientEventKind = 'bird' | 'butterfly' | 'water' | 'wind';
export type AmbientEventContext = 'dashboard' | 'cabin' | 'progress';

export type AmbientEventPlan = {
	id: string;
	kind: AmbientEventKind;
	positionIndex: number;
	durationMs: number;
};

export type AmbientEventPlanInput = {
	sessionSeed: string;
	dateKey: string;
	localTimeMinutes: number;
	timeOfDay: ProgressCompanionDayState;
	season: ProgressCompanionSeason;
	growthLevel: WorldGrowthLevel;
	context: AmbientEventContext;
	reducedMotion?: boolean;
	availableKinds: readonly AmbientEventKind[];
};

export const AMBIENT_EVENT_BUCKET_MINUTES = 30;

function hash(value: string): number {
	let valueHash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		valueHash ^= value.charCodeAt(index);
		valueHash = Math.imul(valueHash, 16777619);
	}
	return (valueHash >>> 0) / 2 ** 32;
}

function isEligible(kind: AmbientEventKind, input: AmbientEventPlanInput): boolean {
	if (!input.availableKinds.includes(kind)) return false;
	if (input.context === 'cabin' && kind !== 'bird' && kind !== 'water') return false;
	if (kind === 'bird') return input.timeOfDay !== 'night' && input.season !== 'winter';
	if (kind === 'butterfly') {
		return input.timeOfDay === 'day' && (input.season === 'spring' || input.season === 'summer');
	}
	return true;
}

function getWeight(kind: AmbientEventKind, growthLevel: WorldGrowthLevel): number {
	if (kind === 'butterfly') return 0.8 + growthLevel * 0.14;
	if (kind === 'bird') return 1 + growthLevel * 0.06;
	if (kind === 'wind') return 0.72;
	return 1.25;
}

function getDurationMs(kind: AmbientEventKind, random: number): number {
	if (kind === 'bird') return 8_000 + Math.round(random * 4_000);
	if (kind === 'butterfly') return 6_500 + Math.round(random * 2_500);
	if (kind === 'wind') return 7_000 + Math.round(random * 4_000);
	return 3_800 + Math.round(random * 2_000);
}

/**
 * En ren, deterministisk plan per sessionsseed och 30-minutersfönster. De
 * flesta fönster blir medvetet tomma; det finns aldrig mer än ett event i en
 * plan. Detta avgör bara *om* världen får göra något, inte hur det renderas.
 */
export function getAmbientEventPlan(input: AmbientEventPlanInput): AmbientEventPlan | null {
	if (input.reducedMotion) return null;

	const bucket = Math.floor(input.localTimeMinutes / AMBIENT_EVENT_BUCKET_MINUTES);
	const seed = `${input.sessionSeed}:${input.dateKey}:${bucket}:${input.context}:${input.timeOfDay}:${input.season}:${input.growthLevel}`;
	// Basen ger ofta noll events; en rikare plats får en mycket liten extra chans,
	// aldrig en garanti eller en "upplåsning".
	const chance = 0.075 + input.growthLevel * 0.012;
	if (hash(`${seed}:chance`) >= chance) return null;

	const eligible = (['water', 'wind', 'bird', 'butterfly'] as AmbientEventKind[]).filter((kind) =>
		isEligible(kind, input)
	);
	if (!eligible.length) return null;

	const totalWeight = eligible.reduce((sum, kind) => sum + getWeight(kind, input.growthLevel), 0);
	let cursor = hash(`${seed}:kind`) * totalWeight;
	let kind = eligible[eligible.length - 1];
	for (const candidate of eligible) {
		cursor -= getWeight(candidate, input.growthLevel);
		if (cursor <= 0) {
			kind = candidate;
			break;
		}
	}

	return {
		id: `ambient:${input.dateKey}:${bucket}:${input.context}:${kind}`,
		kind,
		positionIndex: Math.floor(hash(`${seed}:position`) * 2),
		durationMs: getDurationMs(kind, hash(`${seed}:duration`))
	};
}
