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

export type LeafSessionCharacter = {
	initialDelayMs: number;
	intervalFactor: number;
	spawnMinX: number;
	spawnMaxX: number;
	driftFactor: number;
	amplitudeFactor: number;
};

export function getLeafSessionCharacter(seed: string): LeafSessionCharacter {
	const spawnMinX = between(seed, 'leaf:spawn-min-x', 58, 62);
	return {
		initialDelayMs: Math.round(between(seed, 'leaf:initial-delay', 8_000, 20_000)),
		intervalFactor: between(seed, 'leaf:interval', 0.9, 1.1),
		spawnMinX,
		spawnMaxX: Math.max(spawnMinX + 24, between(seed, 'leaf:spawn-max-x', 88, 92)),
		driftFactor: between(seed, 'leaf:drift', 0.88, 1.12),
		amplitudeFactor: between(seed, 'leaf:amplitude', 0.9, 1.1)
	};
}
