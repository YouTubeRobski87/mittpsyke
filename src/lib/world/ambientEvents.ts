import type { ProgressCompanionDayState, ProgressCompanionSeason } from '$lib/progressCompanion';
import type { WorldGrowthLevel } from '$lib/worldScene';

export type AmbientEventKind = 'bird' | 'butterfly' | 'water' | 'wind';
export type AmbientEventContext = 'dashboard' | 'cabin' | 'progress';
export type ProgressFaunaPhase = 'morning' | 'day' | 'afternoon' | 'evening' | 'night';

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

export type ProgressFaunaPlan = AmbientEventPlan & {
	delayMs: number;
	flockSize: 1 | 2 | 3;
};

export type ProgressFaunaPlanInput = {
	sessionSeed: string;
	sequence: number;
	phase: ProgressFaunaPhase;
	season: ProgressCompanionSeason;
	growthLevel: WorldGrowthLevel;
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
 * Framstegs återkommande men glest placerade fauna. Den befintliga
 * 30-minutersplanen behålls för vatten/vind och andra vyer; här får bara fågel
 * eller fjäril ett nytt deterministiskt tillfälle efter 45-120 sekunder.
 */
export function getProgressFaunaPlan(input: ProgressFaunaPlanInput): ProgressFaunaPlan | null {
	if (input.reducedMotion || input.phase === 'night') return null;

	const birdsAvailable = input.availableKinds.includes('bird');
	const butterfliesAvailable =
		input.availableKinds.includes('butterfly') &&
		input.phase !== 'evening' &&
		(input.season === 'spring' || input.season === 'summer');
	if (!birdsAvailable && !butterfliesAvailable) return null;

	const seed = `${input.sessionSeed}:progress-fauna:${input.sequence}:${input.phase}:${input.season}:${input.growthLevel}`;
	const delayFloor = input.phase === 'day' ? 45_000 : input.phase === 'evening' ? 88_000 : 55_000;
	const delayCeiling = input.phase === 'day' ? 95_000 : 120_000;
	const delayMs = delayFloor + Math.round(hash(`${seed}:delay`) * (delayCeiling - delayFloor));

	// Kväll och vinter får ofta ett helt tomt tillfälle. Övriga dagsfaser har i
	// stället sin stillhet i den 45-120 sekunder långa väntan mellan passagerna.
	const occurrenceChance =
		input.season === 'winter' ? 0.12 : input.phase === 'evening' ? 0.18 : 1;
	if (hash(`${seed}:occurrence`) >= occurrenceChance) {
		return {
			id: `progress-fauna:${input.sequence}:rest`,
			kind: 'bird',
			positionIndex: 0,
			durationMs: 0,
			delayMs,
			flockSize: 1
		};
	}

	const butterflyShare =
		!butterfliesAvailable ? 0 : input.phase === 'day' ? 0.34 : input.phase === 'morning' ? 0.22 : 0.14;
	const kind: 'bird' | 'butterfly' =
		butterfliesAvailable && (!birdsAvailable || hash(`${seed}:kind`) < butterflyShare)
			? 'butterfly'
			: 'bird';
	const durationRandom = hash(`${seed}:duration`);
	const durationMs =
		kind === 'bird'
			? 15_000 + Math.round(durationRandom * 7_000)
			: 8_000 + Math.round(durationRandom * 4_000);

	return {
		id: `progress-fauna:${input.sequence}:${kind}`,
		kind,
		positionIndex: Math.floor(hash(`${seed}:position`) * 2),
		durationMs,
		delayMs,
		flockSize: kind === 'bird' ? ((1 + Math.floor(hash(`${seed}:flock`) * 3)) as 1 | 2 | 3) : 1
	};
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
