// Världens långsamma utveckling på Framsteg.
//
// Modulen översätter användarens verkliga närvaro till diskreta miljöstadier och
// till de små spår som får finnas i scenen. Tre regler bär hela filen:
//
// 1. Ingenting här får spegla hur användaren mår. Underlaget är tid, återkomst,
//    aktivitet och reflektion — aldrig humörvärden. Det finns därför medvetet
//    ingen mood-parameter att skicka in.
// 2. Allt är additivt. Varje ingång är en kumulativ räknare, så stadiet och
//    spåren kan bara stå still eller växa. Ett uppehåll kostar ingenting, och
//    det finns ingen streak att bryta.
// 3. Stadiet är internt. Det avgör vilka detaljer som renderas och exponeras
//    aldrig som nivå, poäng eller mätare i gränssnittet.
//
// Se docs/NORTH_STAR.md, "Lager 5: Din resa" och "Inga belöningar".

import type { ProgressCompanionDayState } from '$lib/progressCompanion';

/** Internt miljöstadie. Visas aldrig för användaren. */
export type WorldStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface WorldPresenceInput {
	/** Sparade dagbokstexter, hela historiken. */
	entryCount?: unknown;
	/** Måenderegistreringar, hela historiken. */
	moodEntryCount?: unknown;
	/** Besvarade följeslagarfrågor. */
	reflectionCount?: unknown;
	/** Unika dagar med någon aktivitet. */
	activeDays?: unknown;
	/** Unika kalenderveckor med någon aktivitet. */
	activeWeeks?: unknown;
	/** Unika kalendermånader med någon aktivitet. */
	activeMonths?: unknown;
	/** Dygn sedan kontot skapades. */
	accountAgeDays?: unknown;
}

export interface WorldPresence {
	entryCount: number;
	moodEntryCount: number;
	reflectionCount: number;
	activeDays: number;
	activeWeeks: number;
	activeMonths: number;
	accountAgeDays: number;
	/** Summan av allt användaren faktiskt lämnat efter sig. */
	registrationCount: number;
}

export const EMPTY_WORLD_PRESENCE: WorldPresence = {
	entryCount: 0,
	moodEntryCount: 0,
	reflectionCount: 0,
	activeDays: 0,
	activeWeeks: 0,
	activeMonths: 0,
	accountAgeDays: 0,
	registrationCount: 0
};

function toCount(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0;
	return Math.floor(value);
}

export function normalizeWorldPresence(input: WorldPresenceInput | null | undefined): WorldPresence {
	const entryCount = toCount(input?.entryCount);
	const moodEntryCount = toCount(input?.moodEntryCount);
	const reflectionCount = toCount(input?.reflectionCount);
	return {
		entryCount,
		moodEntryCount,
		reflectionCount,
		activeDays: toCount(input?.activeDays),
		activeWeeks: toCount(input?.activeWeeks),
		activeMonths: toCount(input?.activeMonths),
		accountAgeDays: toCount(input?.accountAgeDays),
		registrationCount: entryCount + moodEntryCount + reflectionCount
	};
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO-vecka med måndag som första dag, samma nyckelform som resten av världen. */
function isoWeekKey(dateKey: string): string | null {
	if (!DATE_PATTERN.test(dateKey)) return null;
	const date = new Date(`${dateKey}T12:00:00`);
	if (Number.isNaN(date.getTime())) return null;
	const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dayOfWeek = (target.getDay() + 6) % 7;
	target.setDate(target.getDate() - dayOfWeek + 3);
	const isoYear = target.getFullYear();
	const firstThursday = new Date(isoYear, 0, 4);
	const firstDayOfWeek = (firstThursday.getDay() + 6) % 7;
	firstThursday.setDate(firstThursday.getDate() - firstDayOfWeek + 3);
	const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
	return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/**
 * Slår ihop de datakällor Framsteg redan har till ett närvarounderlag. Dagar,
 * veckor och månader räknas på unionen av skrivdagar och måendedagar, så en dag
 * med bara en registrering räknas lika mycket som en dag med en lång text.
 */
export function buildWorldPresence(input: {
	heatmapData?: Record<string, number> | null;
	moodDates?: readonly string[] | null;
	entryCount?: unknown;
	moodEntryCount?: unknown;
	reflectionCount?: unknown;
	accountCreatedAt?: string | Date | null;
	now?: Date;
}): WorldPresence {
	const now = input.now ?? new Date();
	const days = new Set<string>();

	for (const [dateKey, count] of Object.entries(input.heatmapData ?? {})) {
		if (!DATE_PATTERN.test(dateKey)) continue;
		if (!Number.isFinite(count) || count <= 0) continue;
		days.add(dateKey);
	}
	for (const dateKey of input.moodDates ?? []) {
		if (typeof dateKey === 'string' && DATE_PATTERN.test(dateKey)) days.add(dateKey);
	}

	const weeks = new Set<string>();
	const months = new Set<string>();
	for (const dateKey of days) {
		const week = isoWeekKey(dateKey);
		if (week) weeks.add(week);
		months.add(dateKey.slice(0, 7));
	}

	return normalizeWorldPresence({
		entryCount: input.entryCount,
		moodEntryCount: input.moodEntryCount,
		reflectionCount: input.reflectionCount,
		activeDays: days.size,
		activeWeeks: weeks.size,
		activeMonths: months.size,
		accountAgeDays: getAccountAgeDays(input.accountCreatedAt, now)
	});
}

export function getAccountAgeDays(
	accountCreatedAt: string | Date | null | undefined,
	now: Date = new Date()
): number {
	if (!accountCreatedAt) return 0;
	const created = accountCreatedAt instanceof Date ? accountCreatedAt : new Date(accountCreatedAt);
	if (Number.isNaN(created.getTime())) return 0;
	return Math.max(0, Math.floor((now.getTime() - created.getTime()) / DAY_MS));
}

/**
 * Stadiet. Varje steg kan nås på flera sätt, så någon som skriver mycket sällan
 * men länge kommer lika långt som någon som skriver ofta under en kort tid.
 * Villkoren är rena OR:er över kumulativa räknare — därför kan resultatet aldrig
 * sjunka, oavsett hur långt uppehållet varit.
 */
export function getWorldStage(presence: WorldPresence): WorldStage {
	const { activeDays, activeWeeks, activeMonths, registrationCount, accountAgeDays } = presence;

	if (activeMonths >= 3 || registrationCount >= 50 || activeWeeks >= 8) return 5;
	if (activeWeeks >= 4 || registrationCount >= 25 || accountAgeDays >= 120) return 4;
	if (activeDays >= 7 || activeWeeks >= 2) return 3;
	if (activeDays >= 3) return 2;
	if (activeDays >= 1 || registrationCount >= 1) return 1;
	return 0;
}

/**
 * Broar över till världens befintliga växtnivå (0-4), som styr hur rik den
 * beständiga växtligheten är. Anropas tillsammans med den nuvarande nivån och
 * får bara höja den: kontinuitet ska kunna göra platsen rikare, men ingen
 * omräkning får någonsin ta bort något som redan vuxit fram.
 */
export function getWorldGrowthLevel(stage: WorldStage): 0 | 1 | 2 | 3 | 4 {
	return Math.min(stage, 4) as 0 | 1 | 2 | 3 | 4;
}

// ── Spåren i scenen ──

export type WorldMarkId =
	| 'shore-stone'
	| 'shore-path'
	| 'lantern'
	| 'resting-seat'
	| 'mushrooms'
	| 'still-birds'
	| 'old-tree'
	| 'night-glow'
	| 'first-bloom'
	| 'hearth-stones'
	| 'companion';

export interface WorldMark {
	id: WorldMarkId;
	/** Kort namn för knappen. Beskriver föremålet, aldrig varför det finns där. */
	label: string;
	/** Den korta raden som visas när användaren rör vid spåret. */
	revealText: string;
	/** Placering i procent av scenen, samma koordinatsystem som världseffekterna. */
	x: number;
	y: number;
	width: number;
	height: number;
	/** Parallaxdjup, 0 = längst bort. Delas med $lib/world/effectStyle. */
	depth: number;
	/** Sant för spår som bara hör hemma i mörkret. */
	nightOnly?: boolean;
	/** Faller bort på smala vyer, där scenen redan är hårt beskuren. */
	hideOnNarrow?: boolean;
	/**
	 * Alternativ placering på smala vyer. Scenens textblock täcker en mycket
	 * större andel av bilden där, så ett spår som annars hamnat bakom texten
	 * flyttas i stället för att försvinna.
	 */
	narrowX?: number;
	narrowY?: number;
	narrowWidth?: number;
	narrowHeight?: number;
	/**
	 * Sant för spår som redan finns i scenen och bara behöver en träffyta.
	 * Spårlagret ritar då ingen egen form.
	 */
	invisible?: boolean;
}

type WorldMarkDefinition = WorldMark & {
	appears: (presence: WorldPresence) => boolean;
};

/**
 * Ordningen är den ordning spåren renderas i, dvs bakifrån och fram. Texterna
 * är korta och konstaterande. De förklarar aldrig villkoret som gjorde att
 * föremålet dök upp — upptäckten är hela poängen.
 *
 * Koordinaterna är kalibrerade mot scenens FAKTISKA beskärning, inte mot
 * källbilden: .companion-media visar bilden med object-fit: cover och
 * object-position: 50% 72%, så bara mittbandet syns. Marken finns därför i tre
 * användbara band — trädlinjen överst, den vänstra strandkanten ovanför scenens
 * text, och den högra banken utanför textblocket.
 */
const WORLD_MARK_DEFINITIONS: readonly WorldMarkDefinition[] = [
	{
		id: 'old-tree',
		label: 'Trädet',
		revealText: 'Mycket förändras långsamt.',
		x: 0,
		y: 0,
		width: 13,
		height: 24,
		depth: 0.92,
		// Den smala beskärningen visar mycket mer himmel, och den vänstra
		// trädridån krymper bort. Träddetaljen flyttas där till skogen på
		// höger sida, som fortfarande fyller bildkanten.
		narrowX: 88,
		narrowY: 32,
		narrowWidth: 11,
		narrowHeight: 16,
		appears: (presence) => presence.activeMonths >= 3 || presence.accountAgeDays >= 120
	},
	{
		id: 'still-birds',
		label: 'Fåglarna',
		revealText: 'De håller till här numera.',
		x: 17,
		y: 7,
		width: 6,
		height: 3,
		depth: 0.24,
		hideOnNarrow: true,
		appears: (presence) => presence.activeMonths >= 2 || presence.activeWeeks >= 6
	},
	{
		id: 'night-glow',
		label: 'Ljusen över vattnet',
		revealText: 'De syns bara vissa kvällar.',
		x: 34,
		y: 44,
		width: 26,
		height: 8,
		depth: 0.34,
		nightOnly: true,
		hideOnNarrow: true,
		appears: (presence) => presence.registrationCount >= 50 || presence.activeMonths >= 4
	},
	{
		id: 'lantern',
		label: 'Lyktan',
		revealText: 'Den här dök upp någon gång längs vägen.',
		x: 31,
		y: 37,
		width: 2.2,
		height: 4.6,
		depth: 0.62,
		narrowX: 84,
		narrowY: 52,
		appears: (presence) => presence.activeWeeks >= 1
	},
	{
		id: 'resting-seat',
		label: 'Sittplatsen',
		revealText: 'Någon har suttit här och tittat ut över vattnet.',
		x: 76,
		y: 51,
		width: 7.5,
		height: 3.6,
		depth: 0.68,
		hideOnNarrow: true,
		appears: (presence) => presence.reflectionCount >= 3 || presence.entryCount >= 8
	},
	{
		id: 'first-bloom',
		label: 'Blommorna',
		revealText: 'De små sakerna kom först.',
		x: 82,
		y: 68,
		width: 4.5,
		height: 2.4,
		depth: 0.75,
		hideOnNarrow: true,
		appears: (presence) => presence.reflectionCount >= 1
	},
	{
		id: 'hearth-stones',
		label: 'Stenarna vid elden',
		revealText: 'Någon har lagt dem i en ring, en och en.',
		x: 88,
		y: 88,
		width: 9,
		height: 6,
		depth: 0.9,
		hideOnNarrow: true,
		appears: (presence) => presence.registrationCount >= 100
	},
	{
		id: 'mushrooms',
		label: 'Svampen',
		revealText: 'Sådant här kommer när marken får vara ifred.',
		x: 85,
		y: 57,
		width: 3.6,
		height: 2.2,
		depth: 0.76,
		hideOnNarrow: true,
		appears: (presence) => presence.registrationCount >= 25
	},
	{
		id: 'shore-stone',
		label: 'Stenen',
		revealText: 'Den har legat här sedan första gången.',
		x: 92,
		y: 66,
		width: 4.2,
		height: 2.1,
		depth: 0.8,
		appears: (presence) => presence.activeDays >= 1 || presence.registrationCount >= 1
	},
	{
		id: 'shore-path',
		label: 'Stigen',
		revealText: 'Den syns tydligare för varje gång.',
		x: 83,
		y: 79,
		width: 16,
		height: 3,
		depth: 0.86,
		appears: (presence) => presence.activeDays >= 3
	}
];

export interface WorldMarkOptions {
	timeOfDay?: ProgressCompanionDayState;
	/** Seed för besökets små variationer. Utelämnad = inga förskjutningar alls. */
	visitSeed?: string | null;
	narrow?: boolean;
}

function hash(value: string): number {
	let result = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		result ^= value.charCodeAt(index);
		result = Math.imul(result, 16777619);
	}
	return (result >>> 0) / 2 ** 32;
}

/**
 * Små, deterministiska förskjutningar per besök. De är medvetet mindre än
 * spåret självt, så platsen förblir igenkännbar: ett föremål flyttar sig aldrig
 * så mycket att användaren tvekar på om det är samma sak som sist.
 */
export function getWorldMarkVariation(
	mark: WorldMark,
	visitSeed: string | null | undefined
): { x: number; y: number; opacityScale: number } {
	// Ett spår som redan finns i scenen är förankrat i sin egen bild. Att
	// förskjuta träffytan skulle bara flytta den bort från motivet.
	if (!visitSeed || mark.invisible) return { x: mark.x, y: mark.y, opacityScale: 1 };
	const seed = `${visitSeed}:${mark.id}`;
	return {
		x: Math.round((mark.x + (hash(`${seed}:x`) - 0.5) * 1.8) * 100) / 100,
		y: Math.round((mark.y + (hash(`${seed}:y`) - 0.5) * 1.1) * 100) / 100,
		opacityScale: 0.88 + hash(`${seed}:opacity`) * 0.24
	};
}

/**
 * Spåren som ska renderas. Rent urval — ingen slump utöver den deterministiska
 * variationen ovan, och inget spår kan tas bort av att användaren varit borta.
 */
export function getWorldMarks(
	presence: WorldPresence,
	options: WorldMarkOptions = {}
): WorldMark[] {
	return WORLD_MARK_DEFINITIONS.filter((mark) => {
		if (!mark.appears(presence)) return false;
		if (mark.nightOnly && options.timeOfDay !== 'night') return false;
		if (mark.hideOnNarrow && options.narrow) return false;
		return true;
	}).map(({ appears: _appears, ...mark }) => {
		if (!options.narrow) return mark;
		return {
			...mark,
			x: mark.narrowX ?? mark.x,
			y: mark.narrowY ?? mark.y,
			width: mark.narrowWidth ?? mark.width,
			height: mark.narrowHeight ?? mark.height
		};
	});
}

/** Följeslagarens plats i scenen, mätt i procent av scenrutan. */
export interface CompanionMarkBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Så mycket historik krävs innan följeslagaren får säga att den känner igen
 * återkomsten. Utan det vore raden en artighet, inte en observation.
 */
const COMPANION_MARK_MIN_ACTIVE_DAYS = 3;

/**
 * Följeslagaren som ett spår att röra vid. Den ritas inte av spårlagret — djuret
 * finns redan i scenen — så det här är enbart en träffyta ovanpå den, med samma
 * beröring och samma rad som övriga spår.
 *
 * Rutan mäts i vyn i stället för att skrivas här: följeslagarens placering
 * varierar med djur, pose och brytpunkt, och en kopierad koordinat skulle
 * hamna fel för björnen och vargen.
 */
export function getCompanionMark(
	presence: WorldPresence,
	box: CompanionMarkBox | null
): WorldMark | null {
	if (!box) return null;
	if (box.width <= 0 || box.height <= 0) return null;
	if (presence.activeDays < COMPANION_MARK_MIN_ACTIVE_DAYS) return null;

	return {
		id: 'companion',
		label: 'Följeslagaren',
		revealText: 'Den verkar ha vant sig vid att du kommer tillbaka.',
		x: box.x,
		y: box.y,
		width: box.width,
		height: box.height,
		depth: 0.9,
		// Ritas aldrig av spårlagret; djuret självt är formen.
		invisible: true
	};
}

// ── Återkomst ──
// Besöket lagras lokalt hos användaren. Det finns ingen serversignal för
// "senast sedd" på Framsteg, och en lokal nyckel räcker: den svarar på exakt
// den fråga vi ställer, utan att spara besökshistorik någonstans.

export const WORLD_LAST_VISIT_STORAGE_KEY = 'mittpsyke:world-last-visit:v1';

/** Under så här många dygns frånvaro sägs ingenting alls. */
export const RETURN_COPY_MIN_DAYS = 21;

/** Så mycket historik krävs innan en återkomst är en återkomst. */
const RETURN_COPY_MIN_ACTIVE_DAYS = 3;

export const WORLD_RETURN_COPY = 'Det var ett tag sedan. Du behöver inte börja om.';

export interface WorldVisitStorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export function readLastVisit(storage: WorldVisitStorageLike | null | undefined): Date | null {
	if (!storage) return null;
	try {
		const raw = storage.getItem(WORLD_LAST_VISIT_STORAGE_KEY);
		if (!raw) return null;
		const parsed = new Date(raw);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	} catch {
		return null;
	}
}

export function recordVisit(
	storage: WorldVisitStorageLike | null | undefined,
	now: Date = new Date()
): void {
	if (!storage) return;
	try {
		storage.setItem(WORLD_LAST_VISIT_STORAGE_KEY, now.toISOString());
	} catch {
		// Avstängd lagring betyder bara att nästa besök inte känns igen.
	}
}

export function getDaysSinceLastVisit(lastVisit: Date | null, now: Date = new Date()): number | null {
	if (!lastVisit) return null;
	const elapsed = now.getTime() - lastVisit.getTime();
	if (elapsed < 0) return null;
	return Math.floor(elapsed / DAY_MS);
}

/**
 * Raden vid en längre frånvaro, eller null. Den säger aldrig hur länge det var,
 * och visas bara för någon som faktiskt har en plats att komma tillbaka till.
 * Utan en tidigare besöksstämpel sägs ingenting — en ny enhet ska inte hälsas
 * som en återvändare.
 */
export function getWorldReturnCopy(
	presence: WorldPresence,
	daysSinceLastVisit: number | null
): string | null {
	if (daysSinceLastVisit === null) return null;
	if (daysSinceLastVisit < RETURN_COPY_MIN_DAYS) return null;
	if (presence.activeDays < RETURN_COPY_MIN_ACTIVE_DAYS) return null;
	return WORLD_RETURN_COPY;
}
