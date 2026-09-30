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

// ── Ambient director ────────────────────────────────────────────────────
// Framstegs enda tidslinje för sällsynta händelser. Den bygger på faunaplanen
// ovan: varje tillfälle är fortfarande 45-120 sekunder bort och ofta tomt. När
// nedkylningen för tydliga händelser har löpt ut byts ett tillfälle mot en
// vindpust eller ett molnljus. Allt ligger i en kedja, så två händelser kan
// aldrig pågå samtidigt.

export type AmbientMomentKind = 'wind' | 'cloud-light' | 'evening-life';
export type AmbientDirectorKind = 'bird' | 'butterfly' | AmbientMomentKind;

export type AmbientDirectorEvent = {
	id: string;
	kind: AmbientDirectorKind;
	/** Tydliga händelser har egen nedkylning, små följer faunarytmen. */
	tier: 'minor' | 'major';
	durationMs: number;
	/** 0.55-1. Skalar hur tydligt vindpusten eller molnskuggan märks. */
	intensity: number;
	positionIndex: number;
	/** Fåglar i flocken, ljuspunkter i kvällslivet eller löv som släpper i vinden. */
	count: 1 | 2 | 3;
};

export type AmbientDirectorState = {
	sequence: number;
	/** Planerad tid sedan start, i ms, fram till slutet av senaste tillfället. */
	elapsedMs: number;
	nextMajorAtMs: number;
};

export type AmbientDirectorInput = {
	sessionSeed: string;
	phase: ProgressFaunaPhase;
	season: ProgressCompanionSeason;
	growthLevel: WorldGrowthLevel;
	reducedMotion?: boolean;
	availableKinds: readonly AmbientDirectorKind[];
};

export type AmbientDirectorStep = {
	delayMs: number;
	/** Null är ett medvetet tomt tillfälle. */
	event: AmbientDirectorEvent | null;
	nextState: AmbientDirectorState;
};

/** Första tydliga händelsen väntar, så sidan inte känns som en animationsdemo. */
export const AMBIENT_FIRST_MAJOR_MS = [120_000, 210_000] as const;
/** Nedkylning mellan tydliga händelser, räknat från slutet av den förra. */
export const AMBIENT_MAJOR_COOLDOWN_MS = [120_000, 300_000] as const;

function between(range: readonly [number, number], random: number): number {
	return range[0] + Math.round(random * (range[1] - range[0]));
}

export function createAmbientDirectorState(sessionSeed: string): AmbientDirectorState {
	return {
		sequence: 0,
		elapsedMs: 0,
		nextMajorAtMs: between(AMBIENT_FIRST_MAJOR_MS, hash(`${sessionSeed}:ambient-first-major`))
	};
}

/**
 * Nästa tillfälle i tidslinjen. Ren funktion: samma tillstånd och indata ger
 * samma steg. Null betyder att världen ska vara stilla tills fas eller
 * rörelseinställning ändras - natten och reduced motion får inga händelser.
 */
export function planNextAmbientEvent(
	state: AmbientDirectorState,
	input: AmbientDirectorInput
): AmbientDirectorStep | null {
	if (input.reducedMotion || input.phase === 'night') return null;

	const seed = `${input.sessionSeed}:ambient-director:${state.sequence}:${input.phase}:${input.season}`;
	const faunaPlan = getProgressFaunaPlan({
		sessionSeed: input.sessionSeed,
		sequence: state.sequence,
		phase: input.phase,
		season: input.season,
		growthLevel: input.growthLevel,
		availableKinds: input.availableKinds.filter(
			(kind): kind is 'bird' | 'butterfly' => kind === 'bird' || kind === 'butterfly'
		)
	});
	// Utan fauna i vyn behåller tidslinjen ändå samma glesa takt.
	const delayMs = faunaPlan?.delayMs ?? between([45_000, 120_000], hash(`${seed}:delay`));
	const startMs = state.elapsedMs + delayMs;

	const majorKinds = (['wind', 'cloud-light'] as const).filter(
		(kind) =>
			input.availableKinds.includes(kind) &&
			// En molnskugga läses bara i dagsljus.
			(kind !== 'cloud-light' || input.phase !== 'evening')
	);

	let event: AmbientDirectorEvent | null = null;
	if (startMs >= state.nextMajorAtMs && majorKinds.length > 0) {
		const kind = majorKinds[Math.floor(hash(`${seed}:major-kind`) * majorKinds.length)];
		const leafRandom = hash(`${seed}:leaves`);
		event = {
			id: `ambient-director:${state.sequence}:${kind}`,
			kind,
			tier: 'major',
			durationMs: between(
				kind === 'wind' ? [8_000, 11_000] : [9_000, 13_000],
				hash(`${seed}:duration`)
			),
			intensity: 0.55 + Math.round(hash(`${seed}:intensity`) * 45) / 100,
			positionIndex: 0,
			// Hösten släpper två-tre löv, övriga årstider ett-två.
			count: (input.season === 'autumn' ? 2 + Math.floor(leafRandom * 2) : 1 + Math.floor(leafRandom * 2)) as
				| 1
				| 2
				| 3
		};
	} else if (faunaPlan && faunaPlan.durationMs > 0) {
		event = {
			id: faunaPlan.id,
			kind: faunaPlan.kind as 'bird' | 'butterfly',
			tier: 'minor',
			durationMs: faunaPlan.durationMs,
			intensity: 1,
			positionIndex: faunaPlan.positionIndex,
			count: faunaPlan.flockSize
		};
	} else if (
		input.phase === 'evening' &&
		(input.season === 'spring' || input.season === 'summer') &&
		input.availableKinds.includes('evening-life') &&
		hash(`${seed}:evening-life`) < 0.4
	) {
		// Kvällslivet får bara låna kvällens tomma tillfällen, aldrig tränga ut fauna.
		event = {
			id: `ambient-director:${state.sequence}:evening-life`,
			kind: 'evening-life',
			tier: 'minor',
			durationMs: between([14_000, 20_000], hash(`${seed}:duration`)),
			intensity: 1,
			positionIndex: Math.floor(hash(`${seed}:position`) * 2),
			count: (2 + Math.floor(hash(`${seed}:count`) * 2)) as 2 | 3
		};
	}

	const endMs = startMs + (event?.durationMs ?? 0);
	return {
		delayMs,
		event,
		nextState: {
			sequence: state.sequence + 1,
			elapsedMs: endMs,
			nextMajorAtMs:
				event?.tier === 'major'
					? endMs + between(AMBIENT_MAJOR_COOLDOWN_MS, hash(`${seed}:cooldown`))
					: state.nextMajorAtMs
		}
	};
}

type TimerHandle = ReturnType<typeof setTimeout>;

export type AmbientDirectorRunOptions = {
	input: AmbientDirectorInput;
	onEvent: (event: AmbientDirectorEvent) => void;
	onEventEnd: (event: AmbientDirectorEvent) => void;
	/** Ett tillfälle som infaller när sidan är dold hoppas över. */
	isVisible?: () => boolean;
	setTimer?: (callback: () => void, ms: number) => TimerHandle;
	clearTimer?: (handle: TimerHandle) => void;
};

/**
 * Kör tidslinjen med en enda timer i taget. Returnerar en stoppfunktion som
 * rensar den väntande timern; efter stopp anropas inga callbacks.
 */
export function startAmbientDirector(options: AmbientDirectorRunOptions): () => void {
	const setTimer = options.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
	const clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle));
	let state = createAmbientDirectorState(options.input.sessionSeed);
	let timer: TimerHandle | null = null;
	let stopped = false;

	const queueNext = () => {
		if (stopped) return;
		const step = planNextAmbientEvent(state, options.input);
		if (!step) return;
		state = step.nextState;

		timer = setTimer(() => {
			timer = null;
			if (stopped) return;
			const event = step.event;
			if (!event || (options.isVisible && !options.isVisible())) {
				queueNext();
				return;
			}
			options.onEvent(event);
			timer = setTimer(() => {
				timer = null;
				if (stopped) return;
				options.onEventEnd(event);
				queueNext();
			}, event.durationMs);
		}, step.delayMs);
	};

	queueNext();
	return () => {
		stopped = true;
		if (timer !== null) clearTimer(timer);
		timer = null;
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
