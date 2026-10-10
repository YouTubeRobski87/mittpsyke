// Förgängliga återkomsttecken (Living World V3.3).
//
// Världen ska kunna visa att den har fortsatt leva medan användaren var borta,
// utan att säga något om frånvaron. Modulen översätter den befintliga lokala
// "senast besökt"-stämpeln (se readLastVisit i $lib/world/worldStage) till ett
// grovt, internt frånvaroband och väljer högst två små, dekorativa tecken.
//
// Regler som bär hela filen:
//
// 1. Underlaget är bara dygn sedan förra besöket, årstid och tid på dygnet.
//    Ingen dagbokstext, inget humör, ingen chatt, ingen AI-tolkning.
// 2. Bandet och tecknen är interna. De exponeras aldrig som siffra, text,
//    nivå eller streak, och de låser inte upp något beständigt.
// 3. Tecknen är förgängliga. De sparas inte mellan sessioner och försvinner
//    av sig själva vid nästa besök, eftersom frånvaron då är kort igen.
// 4. Ett val per session. Tecknen räknas fram en gång när sessionen börjar och
//    hålls sedan stilla, även om dygnsdelen hinner skifta medan sidan är öppen.

import type { ProgressCompanionDayState, ProgressCompanionSeason } from '$lib/progressCompanion';

/** Grovt, internt frånvaroband. Gränserna visas aldrig i gränssnittet. */
export type WorldAbsenceBand = 'none' | 'short' | 'few-days' | 'longer';

/** Från så här många hela dygn räknas frånvaron som "några dagar". */
export const ABSENCE_FEW_DAYS_MIN = 2;
/** Från så här många hela dygn räknas frånvaron som "längre". */
export const ABSENCE_LONGER_MIN = 7;

/**
 * Null betyder att det saknas en tidigare stämpel på den här enheten. Då finns
 * inget att jämföra med, och en ny enhet ska inte behandlas som en återkomst.
 */
export function getWorldAbsenceBand(daysSinceLastVisit: number | null | undefined): WorldAbsenceBand {
	if (typeof daysSinceLastVisit !== 'number' || !Number.isFinite(daysSinceLastVisit)) return 'none';
	if (daysSinceLastVisit < 0) return 'none';
	if (daysSinceLastVisit >= ABSENCE_LONGER_MIN) return 'longer';
	if (daysSinceLastVisit >= ABSENCE_FEW_DAYS_MIN) return 'few-days';
	return 'short';
}

export type WorldReturnTraceId = 'gathered-leaves' | 'still-water-ring';

export const WORLD_RETURN_TRACE_IDS: readonly WorldReturnTraceId[] = [
	'gathered-leaves',
	'still-water-ring'
];

export interface WorldReturnTraceInput {
	absenceBand: WorldAbsenceBand;
	season: ProgressCompanionSeason;
	timeOfDay: ProgressCompanionDayState;
}

/**
 * Vilka tecken som får synas. Högst två, och bara efter en frånvaro som är
 * längre än ett vanligt dygn.
 *
 * - Löv som samlats vid stugans trappa: bara på hösten och bara efter en längre
 *   frånvaro. Det ska läsas som att det har blåst här, inte som en räkning.
 * - En extra stilla ring på vattnet: efter några dagar eller mer, när vattnet
 *   är som lugnast på morgonen och kvällen. Sjön är aldrig frusen i scenen,
 *   så tecknet är inte bundet till årstid.
 */
export function getWorldReturnTraces(input: WorldReturnTraceInput): WorldReturnTraceId[] {
	const traces: WorldReturnTraceId[] = [];
	if (input.absenceBand === 'longer' && input.season === 'autumn') {
		traces.push('gathered-leaves');
	}
	if (
		(input.absenceBand === 'few-days' || input.absenceBand === 'longer') &&
		(input.timeOfDay === 'morning' || input.timeOfDay === 'evening')
	) {
		traces.push('still-water-ring');
	}
	return traces;
}

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

export interface GatheredLeaf {
	key: string;
	/** Placering i procent av scenen, samma koordinatsystem som världens spår. */
	x: number;
	y: number;
	/** Storlek i px innan lagrets skala för smala vyer. */
	size: number;
	rotation: number;
	shape: 0 | 1 | 2;
	color: 0 | 1 | 2 | 3;
	opacity: number;
}

/**
 * Lövens yta är marken framför stugans trappa, uppe till vänster i scenen.
 * Scenen visar hela bilden på alla bredder, så samma procent gäller överallt.
 * Ytan ligger ovanför scenens textblock och vänster om bryggans stolpar, och
 * undviker lägerelden nere till höger där löv vare sig syns eller hör hemma.
 */
const LEAF_AREA = { minX: 10, maxX: 21, minY: 43.5, maxY: 47 } as const;
export const GATHERED_LEAF_COUNT = 6;

/**
 * En liten, statisk samling löv. Samma seed ger alltid samma löv, så
 * placeringen hoppar aldrig mellan renderingar. Utan seed används en fast
 * nyckel, vilket fortfarande är helt deterministiskt.
 */
export function getGatheredLeaves(seed: string | null | undefined): GatheredLeaf[] {
	const base = `${seed ?? 'world'}:gathered-leaves`;
	return Array.from({ length: GATHERED_LEAF_COUNT }, (_, index) => {
		const leafSeed = `${base}:${index}`;
		return {
			key: `gathered-leaf-${index}`,
			x: Math.round(between(leafSeed, 'x', LEAF_AREA.minX, LEAF_AREA.maxX) * 100) / 100,
			y: Math.round(between(leafSeed, 'y', LEAF_AREA.minY, LEAF_AREA.maxY) * 100) / 100,
			size: Math.round(between(leafSeed, 'size', 7, 11) * 10) / 10,
			rotation: Math.round(between(leafSeed, 'rotation', -160, 160)),
			shape: Math.floor(between(leafSeed, 'shape', 0, 3)) as 0 | 1 | 2,
			color: Math.floor(between(leafSeed, 'color', 0, 4)) as 0 | 1 | 2 | 3,
			opacity: Math.round(between(leafSeed, 'opacity', 0.42, 0.62) * 100) / 100
		};
	});
}

// ── Sessionens val ──
// Valet sparas i sessionStorage, samma livslängd som besökets seed: det
// överlever navigation inom fliken men försvinner när fliken stängs. Värdet är
// bara en lista med tecken-id:n, aldrig en tidsstämpel eller ett antal dygn.

export const WORLD_RETURN_TRACES_SESSION_KEY = 'mittpsyke:world-return-traces:v1';

export interface WorldReturnTraceStorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

function parseTraceIds(raw: string): WorldReturnTraceId[] | null {
	if (raw === '') return [];
	const ids = raw.split(',');
	if (!ids.every((id): id is WorldReturnTraceId => (WORLD_RETURN_TRACE_IDS as readonly string[]).includes(id))) {
		return null;
	}
	return [...new Set(ids)];
}

/**
 * Returnerar sessionens tecken. Finns ett val redan i sessionen återanvänds
 * det, annars räknas det fram ur `input` och sparas. Avstängd lagring ger
 * ett nytt, lika deterministiskt val vid nästa montering.
 */
export function resolveSessionWorldReturnTraces(
	storage: WorldReturnTraceStorageLike | null | undefined,
	input: WorldReturnTraceInput
): WorldReturnTraceId[] {
	try {
		const stored = storage?.getItem(WORLD_RETURN_TRACES_SESSION_KEY);
		if (typeof stored === 'string') {
			const parsed = parseTraceIds(stored);
			if (parsed) return parsed;
		}
	} catch {
		// Läsning som kastar behandlas som att inget val finns.
	}

	const traces = getWorldReturnTraces(input);
	try {
		storage?.setItem(WORLD_RETURN_TRACES_SESSION_KEY, traces.join(','));
	} catch {
		// Avstängd lagring betyder bara att valet räknas fram igen.
	}
	return traces;
}
