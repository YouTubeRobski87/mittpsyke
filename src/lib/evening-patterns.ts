// "Kvällar över tid" på Framsteg.
//
// Modulen räknar fram några få observationer ur kvällsincheckningarna. Tre
// regler bär hela filen:
//
// 1. Enbart struktur. Underlaget är `theme_id`, `parking_bucket` och
//    `checkin_date` - aldrig fritexten. Tanken användaren skrev är hens egen
//    och läses inte här (se loadEveningPatternRows, som inte ens hämtar den).
// 2. Ingen skala. En kvällsincheckning har inget siffervärde för mående och
//    får aldrig vägas ihop med dagbokens humörvärden till en gemensam poäng.
//    Det som räknas är hur ofta något återkommit, inget annat.
// 3. Observationer, inte tolkningar. Texterna beskriver vad som gick att
//    räkna. Ingen orsak, ingen diagnos, ingen bedömning av hur det gått.
//
// Allt är deterministiskt. Ingen språkmodell är inblandad.

import {
	EVENING_CALM_PARKING_BUCKETS,
	EVENING_PARKING_BUCKETS,
	EVENING_THEMES
} from '$lib/evening-checkin';
import { shiftDateKey, STOCKHOLM_DATE_PATTERN } from '$lib/stockholm-date';

/** Samma periodval som resten av Framsteg. */
export type EveningPeriodDays = 7 | 30 | 90 | 180;

/** En rad ur evening_checkins, utan fritext. */
export interface EveningPatternRow {
	theme_id?: unknown;
	parking_bucket?: unknown;
	checkin_date?: unknown;
}

// ── Trösklar ──
//
// Alla värden är antal KVÄLLAR, aldrig antal sparningar. Skälet till att de
// ligger så här högt är att ett litet underlag annars ger ett tvärsäkert
// påstående om två eller tre tillfällen.

/** Under så här många kvällar visas bara antalet, ingen observation. */
export const MIN_EVENINGS_FOR_PATTERNS = 4;

/** Ett tema måste ha återkommit minst så här många kvällar för att nämnas. */
export const MIN_THEME_EVENINGS = 2;

/** Samma krav för kvällsvalet. Ett enda val är inget mönster. */
export const MIN_BUCKET_EVENINGS = 2;

/**
 * Så mycket måste det vanligaste ligga före tvåan för att få kallas "oftast".
 * Vid mindre marginal beskrivs det bara som något som funnits med, och vid
 * exakt lika nämns båda - annars avgör sorteringsordningen vad användaren får
 * höra, vilket är falsk precision.
 */
export const MIN_LEAD_FOR_MOST_COMMON = 2;

/** Jämförelse mot föregående period kräver så här mycket i BÅDA perioderna. */
export const MIN_EVENINGS_FOR_COMPARISON = 4;

/** Och en skillnad på minst så här många kvällar för att alls nämnas. */
export const MIN_CHANGE_FOR_COMPARISON = 2;

/** Kombinationen tema + kvällsval kräver ett tydligt större underlag. */
export const MIN_EVENINGS_FOR_COMBINATION = 6;
export const MIN_COMBINATION_EVENINGS = 3;

const THEME_LABELS = new Map<string, string>(EVENING_THEMES.map((theme) => [theme.id, theme.label]));
const BUCKET_LABELS = new Map<string, string>(
	[...EVENING_PARKING_BUCKETS, ...EVENING_CALM_PARKING_BUCKETS].map((bucket) => [
		bucket.id,
		bucket.label
	])
);

const PERIOD_LABELS: Record<EveningPeriodDays, string> = {
	7: 'den senaste veckan',
	30: 'den senaste månaden',
	90: 'de senaste tre månaderna',
	180: 'det senaste halvåret'
};

export interface EveningObservation {
	id: 'theme' | 'change' | 'bucket' | 'combination';
	text: string;
}

export interface EveningPatternsView {
	/** Antal kvällar med minst en incheckning i perioden. Aldrig antal rader. */
	eveningCount: number;
	/** Kvällar i föregående lika långa period, för jämförelsen. */
	previousEveningCount: number;
	/**
	 * `empty` = inget sparat alls, `thin` = för lite för ett mönster,
	 * `full` = observationer visas.
	 */
	level: 'empty' | 'thin' | 'full';
	/** Alltid satt. Beskriver underlaget, inte ett resultat. */
	intro: string;
	observations: EveningObservation[];
}

/** En kväll, hopslagen ur alla sparningar samma datum. */
interface Evening {
	date: string;
	themes: Set<string>;
	buckets: Set<string>;
	/** Tema+val-par som faktiskt sparats tillsammans den kvällen. */
	pairs: Set<string>;
}

function isDateKey(value: unknown): value is string {
	return typeof value === 'string' && STOCKHOLM_DATE_PATTERN.test(value);
}

/**
 * Slår ihop raderna till kvällar. Flera sparningar samma datum blir EN kväll,
 * och ett tema som sparats två gånger samma kväll räknas en gång - annars
 * skulle antalet gå att skruva upp genom att spara om.
 */
function toEvenings(rows: readonly EveningPatternRow[]): Map<string, Evening> {
	const evenings = new Map<string, Evening>();

	for (const row of rows) {
		if (!isDateKey(row?.checkin_date)) continue;
		const date = row.checkin_date;

		let evening = evenings.get(date);
		if (!evening) {
			evening = { date, themes: new Set(), buckets: new Set(), pairs: new Set() };
			evenings.set(date, evening);
		}

		const theme = typeof row.theme_id === 'string' && THEME_LABELS.has(row.theme_id) ? row.theme_id : null;
		const bucket =
			typeof row.parking_bucket === 'string' && BUCKET_LABELS.has(row.parking_bucket)
				? row.parking_bucket
				: null;

		if (theme) evening.themes.add(theme);
		if (bucket) evening.buckets.add(bucket);
		if (theme && bucket) evening.pairs.add(`${theme}|${bucket}`);
	}

	return evenings;
}

/** Kvällar inom [start, end], båda inklusive. ISO-datum sorterar som text. */
function withinWindow(evenings: Map<string, Evening>, start: string, end: string): Evening[] {
	const inside: Evening[] = [];
	for (const evening of evenings.values()) {
		if (evening.date >= start && evening.date <= end) inside.push(evening);
	}
	return inside.sort((a, b) => a.date.localeCompare(b.date));
}

function countAcrossEvenings(evenings: readonly Evening[], key: 'themes' | 'buckets' | 'pairs') {
	const counts = new Map<string, number>();
	for (const evening of evenings) {
		for (const value of evening[key]) counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	return counts;
}

interface Ranked {
	/** Alla värden som delar högsta antalet, i stabil id-ordning. */
	top: string[];
	count: number;
	/** Näst högsta antalet, 0 när det inte finns något mer. */
	runnerUp: number;
}

/**
 * Rangordnar en räkning. Delad förstaplats returneras som flera värden i
 * stället för att tystas ned till ett - vem som "vann" en oavgjord räkning är
 * inte något underlaget kan svara på.
 */
function rank(counts: Map<string, number>): Ranked | null {
	if (counts.size === 0) return null;

	const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
	const count = sorted[0][1];
	const top = sorted.filter(([, value]) => value === count).map(([id]) => id);
	const runnerUp = sorted.find(([, value]) => value < count)?.[1] ?? 0;

	return { top, count, runnerUp };
}

const evenings = (count: number) => `${count} ${count === 1 ? 'kväll' : 'kvällar'}`;

function themeLabel(id: string): string {
	return THEME_LABELS.get(id) ?? id;
}

function bucketLabel(id: string): string {
	return BUCKET_LABELS.get(id) ?? id;
}

function buildThemeObservation(ranked: Ranked, eveningCount: number): EveningObservation | null {
	if (ranked.count < MIN_THEME_EVENINGS) return null;

	const of = `under ${ranked.count} av dina ${evenings(eveningCount)}`;

	// Delad förstaplats: båda nämns, ingen utses.
	if (ranked.top.length > 1) {
		const labels = ranked.top.slice(0, 2).map((id) => `”${themeLabel(id)}”`);
		return {
			id: 'theme',
			text: `${labels.join(' och ')} har återkommit lika ofta, ${of}.`
		};
	}

	const label = `”${themeLabel(ranked.top[0])}”`;

	// "Oftast" kräver en marginal. Annars beskrivs det bara som närvarande.
	if (ranked.count - ranked.runnerUp >= MIN_LEAD_FOR_MOST_COMMON) {
		return { id: 'theme', text: `${label} är det som återkommit oftast, ${of}.` };
	}

	return { id: 'theme', text: `${label} har funnits med ${of}.` };
}

function buildChangeObservation(
	themeId: string,
	current: Map<string, number>,
	previous: Map<string, number>,
	currentEvenings: number,
	previousEvenings: number
): EveningObservation | null {
	if (currentEvenings < MIN_EVENINGS_FOR_COMPARISON) return null;
	if (previousEvenings < MIN_EVENINGS_FOR_COMPARISON) return null;

	const now = current.get(themeId) ?? 0;
	const before = previous.get(themeId) ?? 0;
	const difference = now - before;
	if (Math.abs(difference) < MIN_CHANGE_FOR_COMPARISON) return null;

	// Antal kvällar, aldrig procent. Med de här talen blir en procentsiffra
	// mest en illusion av precision.
	//
	// "Det" syftar på temat i raden ovanför. Raden visas bara direkt efter den,
	// och att upprepa temanamnet en andra gång gör kortet till en uppräkning av
	// samma sak i stället för en lugn iakttagelse.
	return {
		id: 'change',
		text:
			difference > 0
				? 'Det har funnits med oftare än under perioden innan.'
				: 'Det har funnits med mer sällan än under perioden innan.'
	};
}

function buildBucketObservation(ranked: Ranked): EveningObservation | null {
	if (ranked.count < MIN_BUCKET_EVENINGS) return null;
	// Vid delad förstaplats finns inget vanligaste val att visa.
	if (ranked.top.length > 1) return null;
	if (ranked.count - ranked.runnerUp < MIN_LEAD_FOR_MOST_COMMON) return null;

	return {
		id: 'bucket',
		text: `Du har oftast valt ”${bucketLabel(ranked.top[0])}”.`
	};
}

/**
 * Tema + kvällsval i samma kväll. Kräver ett tydligt större underlag än de
 * andra observationerna: det är den enda raden som sätter ihop två saker, och
 * blir därmed lättast att läsa som en slutsats om orsak.
 *
 * `shownBucket` är det kvällsval som redan står på egen rad. Pekar
 * kombinationen ut samma val säger raden ingenting nytt - bara samma sak en
 * gång till, med ett tema inklistrat - och utelämnas därför.
 */
function buildCombinationObservation(
	pairs: Map<string, number>,
	eveningCount: number,
	shownBucket: string | null
): EveningObservation | null {
	if (eveningCount < MIN_EVENINGS_FOR_COMBINATION) return null;

	const ranked = rank(pairs);
	if (!ranked) return null;
	if (ranked.count < MIN_COMBINATION_EVENINGS) return null;
	if (ranked.top.length > 1) return null;
	if (ranked.count - ranked.runnerUp < MIN_LEAD_FOR_MOST_COMMON) return null;

	const [themeId, bucketId] = ranked.top[0].split('|');
	if (bucketId === shownBucket) return null;

	return {
		id: 'combination',
		text: `De kvällar du valt ”${themeLabel(themeId)}” har du oftast valt ”${bucketLabel(bucketId)}”.`
	};
}

export const EVENING_EMPTY_COPY =
	'Här samlas dina kvällsincheckningar. När några kvällar har sparats kan det som återkommer börja synas.';

export const EVENING_THIN_COPY =
	'Du har börjat samla några kvällar här. Med tiden kan återkommande mönster börja synas.';

/**
 * Bygger hela sektionen. `today` är dagens svenska kalenderdag; perioden är
 * [today - (period - 1), today] och jämförelseperioden lika lång omedelbart
 * före den, så de aldrig överlappar.
 */
export function buildEveningPatterns(
	rows: readonly EveningPatternRow[] | null | undefined,
	options: { period: EveningPeriodDays; today: string }
): EveningPatternsView {
	const { period, today } = options;
	const periodLabel = PERIOD_LABELS[period] ?? PERIOD_LABELS[30];

	const all = toEvenings(rows ?? []);
	const currentStart = shiftDateKey(today, -(period - 1));
	const previousEnd = shiftDateKey(currentStart, -1);
	const previousStart = shiftDateKey(currentStart, -period);

	const current = withinWindow(all, currentStart, today);
	const previous = withinWindow(all, previousStart, previousEnd);

	const eveningCount = current.length;
	const previousEveningCount = previous.length;

	if (eveningCount === 0) {
		return {
			eveningCount: 0,
			previousEveningCount,
			level: 'empty',
			intro: EVENING_EMPTY_COPY,
			observations: []
		};
	}

	const intro = `Du har checkat in ${evenings(eveningCount)} ${periodLabel}.`;

	if (eveningCount < MIN_EVENINGS_FOR_PATTERNS) {
		return {
			eveningCount,
			previousEveningCount,
			level: 'thin',
			intro,
			observations: []
		};
	}

	const currentThemes = countAcrossEvenings(current, 'themes');
	const previousThemes = countAcrossEvenings(previous, 'themes');
	const rankedTheme = rank(currentThemes);

	const observations: EveningObservation[] = [];

	if (rankedTheme) {
		const themeObservation = buildThemeObservation(rankedTheme, eveningCount);
		if (themeObservation) observations.push(themeObservation);

		// Jämförelsen följer det tema raden ovan handlar om. Vid delad
		// förstaplats finns inget entydigt tema att följa över tid.
		if (themeObservation && rankedTheme.top.length === 1) {
			const changeObservation = buildChangeObservation(
				rankedTheme.top[0],
				currentThemes,
				previousThemes,
				eveningCount,
				previousEveningCount
			);
			if (changeObservation) observations.push(changeObservation);
		}
	}

	// Kvällsvalet som faktiskt fick en egen rad. Null när ingen rad visas, och
	// då kan kombinationen nedan inte upprepa något.
	let shownBucket: string | null = null;
	const rankedBucket = rank(countAcrossEvenings(current, 'buckets'));
	if (rankedBucket) {
		const bucketObservation = buildBucketObservation(rankedBucket);
		if (bucketObservation) {
			observations.push(bucketObservation);
			shownBucket = rankedBucket.top[0];
		}
	}

	const combinationObservation = buildCombinationObservation(
		countAcrossEvenings(current, 'pairs'),
		eveningCount,
		shownBucket
	);
	if (combinationObservation) observations.push(combinationObservation);

	return {
		eveningCount,
		previousEveningCount,
		level: observations.length > 0 ? 'full' : 'thin',
		intro,
		observations
	};
}
