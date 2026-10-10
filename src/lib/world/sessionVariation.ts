import type { ProgressCompanionSeason } from '$lib/progressCompanion';

/**
 * Små, deterministiska skillnader inom en webbläsarsession. De förändrar
 * aldrig vilken värld som visas, bara hur de redan befintliga ambientlagren
 * kommer in i bild. Ingen Math.random vid render: samma seed och nyckel ger
 * alltid samma lugna karaktär.
 */
function hash(value: string): number {
	let valueHash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		valueHash ^= value.charCodeAt(index);
		valueHash = Math.imul(valueHash, 16777619);
	}
	return (valueHash >>> 0) / 2 ** 32;
}

function between(seed: string, key: string, min: number, max: number): number {
	return min + hash(`${seed}:${key}`) * (max - min);
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export type CloudSessionVariation = {
	offsetX: number;
	offsetY: number;
	durationMs: number;
	delayMs: number;
};

export function getCloudSessionVariation(
	seed: string,
	cloudId: string,
	base: { durationMs?: number; delayMs?: number }
): CloudSessionVariation {
	return {
		offsetX: between(seed, `${cloudId}:x`, -3.5, 3.5),
		offsetY: between(seed, `${cloudId}:y`, -1.15, 1.15),
		durationMs: Math.round((base.durationMs ?? 140_000) * between(seed, `${cloudId}:duration`, 0.94, 1.06)),
		delayMs: Math.round((base.delayMs ?? 0) + between(seed, `${cloudId}:delay`, -7_000, 7_000))
	};
}

export type FoliageLayerVariation = {
	durationMs: number;
	delayMs: number;
	amplitude: number;
};

/**
 * Små, stabila skillnader mellan växtlagren. Duration och fas kommer från
 * scenens seed + effekt-id, medan amplituden också följer den befintliga
 * vindstyrkan. Samma scen får därför samma lugna rytm vid varje render.
 */
export function getFoliageLayerVariation(
	seed: string,
	effectId: string,
	base: { durationMs?: number; delayMs?: number },
	wind: number
): FoliageLayerVariation {
	const baseDurationMs = base.durationMs ?? 36_000;
	const boundedWind = clamp(wind, 0, 1);
	return {
		durationMs: Math.round(baseDurationMs * between(seed, `${effectId}:foliage-duration`, 0.93, 1.07)),
		delayMs: Math.round(
			(base.delayMs ?? 0) +
				baseDurationMs * between(seed, `${effectId}:foliage-phase`, -0.12, 0.12)
		),
		amplitude: clamp(
			between(seed, `${effectId}:foliage-amplitude`, 0.88, 1.08) *
				(0.76 + boundedWind * 0.44),
			0.7,
			1.28
		)
	};
}

export type WaterLayerVariation = {
	durationMs: number;
	delayMs: number;
	motion: number;
};

/**
 * Stabil variation för de befintliga vattenlagren. Den ändrar bara deras
 * tempo, fas och mycket lilla rörelselängd; inga nya lager eller timers skapas.
 */
export function getWaterLayerVariation(
	seed: string,
	effectId: string,
	base: { durationMs?: number; delayMs?: number },
	wind: number
): WaterLayerVariation {
	const baseDurationMs = base.durationMs ?? 34_000;
	const boundedWind = clamp(wind, 0, 1);
	return {
		durationMs: Math.round(baseDurationMs * between(seed, `${effectId}:water-duration`, 0.94, 1.06)),
		delayMs: Math.round(
			(base.delayMs ?? 0) + baseDurationMs * between(seed, `${effectId}:water-phase`, -0.08, 0.08)
		),
		motion: clamp(
			between(seed, `${effectId}:water-motion`, 0.92, 1.08) * (0.78 + boundedWind * 0.32),
			0.72,
			1.18
		)
	};
}

export type LeafSessionCharacter = {
	spawnMinX: number;
	spawnMaxX: number;
	driftFactor: number;
	amplitudeFactor: number;
};

export function getLeafSessionCharacter(seed: string): LeafSessionCharacter {
	const spawnMinX = between(seed, 'leaf:spawn-min-x', 58, 62);
	return {
		spawnMinX,
		spawnMaxX: Math.max(spawnMinX + 24, between(seed, 'leaf:spawn-max-x', 88, 92)),
		driftFactor: between(seed, 'leaf:drift', 0.88, 1.12),
		amplitudeFactor: between(seed, 'leaf:amplitude', 0.9, 1.1)
	};
}

export type FallingLeafVariation = {
	x: number;
	y: number;
	size: number;
	shape: number;
	color: number;
	durationMs: number;
	drift: number;
	fall: number;
	spin: number;
	opacity: number;
	depth: number;
};

export type FallingLeafEligibilityInput = {
	season: ProgressCompanionSeason;
	sessionSeed: string;
	eventId?: string | null;
	motionActive: boolean;
	reducedMotion: boolean;
};

/**
 * Ett fallande löv hör bara till en faktisk höstlig vindpust. Funktionen är
 * ren och använder varken besökshistorik, progression eller lagrad state.
 */
export function canReleaseFallingLeaf(input: FallingLeafEligibilityInput): boolean {
	return (
		input.season === 'autumn' &&
		Boolean(input.eventId) &&
		input.motionActive &&
		!input.reducedMotion &&
		hash(`${input.sessionSeed}:${input.eventId}:falling-leaf:eligible`) < 0.35
	);
}

/** Ett enda lövs bana, helt stabil för samma session och ambient-event. */
export function getFallingLeafVariation(
	seed: string,
	eventId: string,
	season: ProgressCompanionSeason
): FallingLeafVariation {
	const character = getLeafSessionCharacter(seed);
	const leafSeed = `${seed}:${eventId}:falling-leaf`;
	const depth = between(leafSeed, 'depth', 0.45, 1);
	const sizeTier = between(leafSeed, 'size-tier', season === 'autumn' ? 0.18 : 0, 1);
	const size = sizeTier < 0.18
		? between(leafSeed, 'size-small', 8, 12)
		: sizeTier < 0.78
			? between(leafSeed, 'size-medium', 12, 18)
			: between(leafSeed, 'size-large', 18, 22);
	const duration = season === 'autumn' ? [6_000, 12_000] : season === 'winter' ? [11_000, 17_000] : [9_000, 15_000];
	const opacity = season === 'autumn' ? [0.72, 0.9] : season === 'winter' ? [0.12, 0.18] : [0.56, 0.7];

	return {
		x: between(leafSeed, 'x', character.spawnMinX, character.spawnMaxX),
		y: between(leafSeed, 'y', 2, 16),
		size,
		shape: Math.floor(between(leafSeed, 'shape', 0, 3)),
		color: Math.floor(between(leafSeed, 'color', 0, 4)),
		durationMs: between(leafSeed, 'duration', duration[0], duration[1]) * (1.12 - depth * 0.18),
		drift: between(leafSeed, 'drift', -5.2, -1.4) * depth * character.driftFactor,
		fall: between(leafSeed, 'fall', 9, 15) * (0.7 + depth * 0.5) * character.amplitudeFactor,
		spin: between(leafSeed, 'spin', 120, 310) * (hash(`${leafSeed}:spin-direction`) < 0.5 ? -1 : 1),
		opacity: between(leafSeed, 'opacity', opacity[0], opacity[1]),
		depth
	};
}
