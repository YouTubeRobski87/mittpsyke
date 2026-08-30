// Halvårsvyn i Framsteg: gör de befintliga månadsblocken jämförbara.
//
// Modulen räknar inget nytt ur databasen. Den tar `monthly[]` som servern redan
// levererar för 180 dagar och härleder det som saknades för att kunna läsa
// halvåret i ett svep: nivå, ytterligheter, spridning mellan månader, och om de
// senaste månaderna skiljer sig från de första.
//
// Fyra regler bär hela filen:
//
// 1. Bara månader med `status: 'sufficient'` får bidra med ett värde. En tunn
//    eller saknad månad kan därför aldrig se ut som en förbättring - den kan
//    bara göra att en jämförelse uteblir.
// 2. Kalendermånader, inte rullande fönster. Ett utbrott av registreringar en
//    dag får inte flytta periodens början eller slut.
// 3. Varje påstående har ett tröskelvärde. Under tröskeln skrivs "ingen tydlig
//    förändring" i stället för att en riktning uppfinns.
// 4. Allt är deterministiskt: samma indata ger alltid exakt samma utdata. Ingen
//    AI, ingen slump, ingen dagbokstext.

export type MonthStatus = 'sufficient' | 'thin' | 'missing';
export type MonthRelative = 'much-higher' | 'higher' | 'near' | 'lower' | 'much-lower';
export type HalfYearDirection = 'higher' | 'lower' | 'level';
export type HalfYearVariation = 'steadier' | 'more-varied' | 'unchanged' | 'insufficient';
export type HalfYearPattern = 'insufficient' | 'even' | 'mid-dip-return' | 'rise-stabilizes' | 'zigzag' | 'varied';

/** Exakt den form servern redan skickar i `analysis.monthly`. */
export interface HalfYearMonthInput {
	month: string;
	label: string;
	entryCount: number;
	activeDays: number;
	status: MonthStatus;
	mean: number | null;
	standardDeviation: number | null;
}

export interface HalfYearMonthView extends HalfYearMonthInput {
	/** Månadsnamn utan årtal, för de smala korten. */
	shortLabel: string;
	/** Läge mot användarens eget halvårssnitt. Null när månaden saknar värde. */
	relative: MonthRelative | null;
	/** Kort etikett för samma sak, redan formulerad. */
	relativeText: string | null;
}

export interface HalfYearEdgeComparison {
	/** Månaderna som faktiskt gick att räkna på, inte de som var tänkta. */
	firstLabel: string;
	lastLabel: string;
	firstAverage: number;
	lastAverage: number;
	difference: number;
	direction: HalfYearDirection;
	firstMonthCount: number;
	lastMonthCount: number;
}

export interface HalfYearStat {
	id: 'edges' | 'extremes' | 'spread' | 'variation';
	label: string;
	value: string;
	note: string;
}

export interface HalfYearMonthChange {
	fromLabel: string;
	toLabel: string;
	difference: number;
	direction: 'up' | 'down' | 'level';
}

export interface HalfYearReflection {
	pattern: HalfYearPattern;
	sentences: string[];
	highlights: string[];
	changes: HalfYearMonthChange[];
}

export interface HalfYearView {
	months: HalfYearMonthView[];
	monthsShown: number;
	monthsWithData: number;
	entryCount: number;
	thinMonths: string[];
	missingMonths: string[];
	/** Snittet av månadssnitten, alltså användarens egen halvårsnivå. */
	average: number | null;
	highest: { label: string; mean: number } | null;
	lowest: { label: string; mean: number } | null;
	/** Avstånd mellan högsta och lägsta månadssnitt. */
	monthSpread: number | null;
	edges: HalfYearEdgeComparison | null;
	variation: HalfYearVariation;
	/** Sant bara när en riktning faktiskt får uttalas. */
	hasDirection: boolean;
	summary: string;
	reflection: HalfYearReflection;
	stats: HalfYearStat[];
	basis: string;
}

// ── Tröskelvärden ──
// Samlade här så att villkoret för varje påstående går att läsa på ett ställe.

/** Under så här många månader med tillräckligt underlag uttalas ingen riktning. */
export const MIN_MONTHS_FOR_DIRECTION = 4;

/** Under så här många månader med underlag säger sammanfattningen bara att underlaget är ojämnt. */
export const MIN_MONTHS_FOR_SUMMARY = 3;

/**
 * Skillnaden mellan periodens första och sista månader måste passera det här
 * värdet innan texten får kalla något högre eller lägre. Samma steg på skalan
 * 1-10 som serverns MEANINGFUL_MOOD_DIFFERENCE, så de två lagren aldrig kan
 * säga emot varandra.
 */
export const EDGE_DIFFERENCE_THRESHOLD = 0.6;

/** Avvikelse mot eget halvårssnitt innan en månad kallas högre eller lägre. */
export const MONTH_RELATIVE_THRESHOLD = 0.4;

/** Avvikelse mot halvårssnittet innan en månad beskrivs som tydligt högre eller lägre. */
export const MONTH_RELATIVE_STRONG_THRESHOLD = 0.9;

/** Förändring mellan två intilliggande månader som får beskrivas som tydligare. */
export const MONTH_CHANGE_THRESHOLD = 0.4;

/** Två månader inom detta avstånd beskrivs som ungefär på samma nivå. */
export const MONTH_STABILITY_THRESHOLD = 0.2;

/** Spridningen mellan högsta och lägsta månad måste nå hit för att nämnas. */
export const MONTH_SPREAD_THRESHOLD = 0.6;

/** Skillnad i genomsnittlig månadsspridning innan variationen kallas ändrad. */
export const VARIATION_DELTA_THRESHOLD = 0.45;

/** Båda halvorna behöver så här många månader med spridningsvärde. */
export const MIN_MONTHS_PER_SIDE_FOR_VARIATION = 2;

/** Exakt copy när halvåret inte går att läsa som en riktning. */
export const UNEVEN_COVERAGE_COPY =
	'Underlaget är ojämnt fördelat över halvåret, så någon riktning går inte att läsa ut ännu.';

/** Exakt copy när skillnaden finns men är för liten att kalla en trend. */
export const NO_CLEAR_CHANGE_COPY = 'Ingen tydlig förändring syns över halvåret.';

function formatMood(value: number): string {
	return value.toFixed(1).replace('.', ',');
}

function average(values: number[]): number | null {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundToOneDecimal(value: number): number {
	return Math.round(value * 10) / 10;
}

/** "mars 2026" blir "mars". Ren strängoperation, ingen ny lokalisering. */
function toShortLabel(label: string): string {
	return label.replace(/\s+\d{4}$/, '').trim() || label;
}

function countLabel(count: number, singular: string, plural: string): string {
	return `${count} ${count === 1 ? singular : plural}`;
}

function joinLabels(labels: string[]): string {
	if (labels.length <= 1) return labels[0] ?? '';
	return `${labels.slice(0, -1).join(', ')} och ${labels.at(-1)}`;
}

/** Månadsnamn är gemena i svenska. Först i en mening behöver de versal. */
function startSentence(text: string): string {
	return text ? `${text[0].toLocaleUpperCase('sv-SE')}${text.slice(1)}` : text;
}

/** Bara månader som klarat serverns egen tröskel får bära ett värde. */
function withValue(months: HalfYearMonthInput[]): (HalfYearMonthInput & { mean: number })[] {
	return months.filter(
		(month): month is HalfYearMonthInput & { mean: number } =>
			month.status === 'sufficient' && typeof month.mean === 'number' && Number.isFinite(month.mean)
	);
}

/**
 * Jämför periodens två första kalendermånader med de två sista. Sidorna måste
 * vara åtskilda, båda måste ha minst en månad med underlag, och halvåret som
 * helhet måste ha MIN_MONTHS_FOR_DIRECTION månader med underlag. Annars
 * returneras null och vyn säger att jämförelsen inte går att göra.
 */
function buildEdgeComparison(months: HalfYearMonthInput[]): HalfYearEdgeComparison | null {
	if (months.length < 4) return null;
	if (withValue(months).length < MIN_MONTHS_FOR_DIRECTION) return null;

	const firstSide = withValue(months.slice(0, 2));
	const lastSide = withValue(months.slice(-2));
	if (firstSide.length === 0 || lastSide.length === 0) return null;

	const firstAverage = average(firstSide.map((month) => month.mean))!;
	const lastAverage = average(lastSide.map((month) => month.mean))!;
	const difference = lastAverage - firstAverage;

	return {
		firstLabel: joinLabels(firstSide.map((month) => toShortLabel(month.label))),
		lastLabel: joinLabels(lastSide.map((month) => toShortLabel(month.label))),
		firstAverage: roundToOneDecimal(firstAverage),
		lastAverage: roundToOneDecimal(lastAverage),
		difference: roundToOneDecimal(difference),
		direction:
			difference >= EDGE_DIFFERENCE_THRESHOLD
				? 'higher'
				: difference <= -EDGE_DIFFERENCE_THRESHOLD
					? 'lower'
					: 'level',
		firstMonthCount: firstSide.length,
		lastMonthCount: lastSide.length
	};
}

/**
 * Jämför den genomsnittliga spridningen inom månaderna i periodens första
 * halva med den andra halvan. Kräver MIN_MONTHS_PER_SIDE_FOR_VARIATION månader
 * med spridningsvärde per sida, så en enskild ojämn månad inte kan avgöra
 * påståendet.
 */
function buildVariation(months: HalfYearMonthInput[]): HalfYearVariation {
	const middle = Math.floor(months.length / 2);
	const deviations = (slice: HalfYearMonthInput[]) =>
		slice
			.filter((month) => month.status === 'sufficient')
			.map((month) => month.standardDeviation)
			.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

	const first = deviations(months.slice(0, middle));
	const last = deviations(months.slice(middle));
	if (
		first.length < MIN_MONTHS_PER_SIDE_FOR_VARIATION ||
		last.length < MIN_MONTHS_PER_SIDE_FOR_VARIATION
	) {
		return 'insufficient';
	}

	const difference = average(last)! - average(first)!;
	if (difference >= VARIATION_DELTA_THRESHOLD) return 'more-varied';
	if (difference <= -VARIATION_DELTA_THRESHOLD) return 'steadier';
	return 'unchanged';
}

const VARIATION_VALUE: Record<HalfYearVariation, string> = {
	steadier: 'Har minskat',
	'more-varied': 'Har ökat',
	unchanged: 'Ungefär oförändrad',
	insufficient: 'Går inte att jämföra'
};

// Måttet är den genomsnittliga spridningen *inom* en månad, inte avståndet
// mellan månadssnitten. Copyn måste säga samma sak som nyckeltalets etikett,
// annars läser de två som två olika påståenden.
const VARIATION_SENTENCE: Record<HalfYearVariation, string | null> = {
	steadier: 'Variationen inom månaderna har minskat.',
	'more-varied': 'Variationen inom månaderna har ökat.',
	unchanged: null,
	insufficient: null
};

const DIRECTION_SENTENCE: Record<HalfYearDirection, string> = {
	higher: 'De senaste månaderna ligger högre på skalan än början av halvåret.',
	lower: 'De senaste månaderna ligger lägre på skalan än början av halvåret.',
	level: NO_CLEAR_CHANGE_COPY
};

/**
 * Sammanfattningen är högst två meningar: en om riktning, en om variation eller
 * spridning. Den första meningen får aldrig påstå en riktning som edges inte
 * kunnat räkna fram.
 */
function buildSummary(
	edges: HalfYearEdgeComparison | null,
	variation: HalfYearVariation,
	monthSpread: number | null,
	monthsWithData: number,
	truncated: boolean
): string {
	if (truncated || monthsWithData < MIN_MONTHS_FOR_SUMMARY) return UNEVEN_COVERAGE_COPY;

	const first = edges
		? DIRECTION_SENTENCE[edges.direction]
		: 'Början och slutet av halvåret har inte tillräckligt underlag för att jämföras.';
	const second =
		VARIATION_SENTENCE[variation] ??
		(monthSpread !== null && monthSpread >= MONTH_SPREAD_THRESHOLD
			? `Skillnaden mellan din högsta och lägsta månad är ${formatMood(monthSpread)} steg på skalan.`
			: 'Månaderna ligger nära varandra.');

	return `${first} ${second}`;
}

/**
 * Underlagstexten bakom "Vad bygger det här på?". Den ska svara på vad som
 * jämförts, hur mycket data det bygger på, vilka månader som väger mindre och
 * varför en slutsats kan eller inte kan dras.
 */
function buildBasis(
	view: {
		edges: HalfYearEdgeComparison | null;
		monthsShown: number;
		monthsWithData: number;
		entryCount: number;
		thinMonths: string[];
		missingMonths: string[];
	},
	truncated: boolean
): string {
	const parts: string[] = [];

	parts.push(
		`Halvåret visas som ${countLabel(view.monthsShown, 'kalendermånad', 'kalendermånader')}, varav ${view.monthsWithData} har tillräckligt underlag för ett eget snitt. Tillsammans bygger de på ${countLabel(view.entryCount, 'måenderegistrering', 'måenderegistreringar')}.`
	);

	if (view.edges) {
		parts.push(
			`Riktningen jämför ${view.edges.firstLabel} (${formatMood(view.edges.firstAverage)}) med ${view.edges.lastLabel} (${formatMood(view.edges.lastAverage)}). Skillnaden måste vara minst ${formatMood(EDGE_DIFFERENCE_THRESHOLD)} steg innan den kallas högre eller lägre.`
		);
	} else {
		parts.push(
			`Ingen riktning räknas fram: det krävs minst ${MIN_MONTHS_FOR_DIRECTION} månader med tillräckligt underlag, och både periodens början och slut måste ha en sådan månad.`
		);
	}

	if (view.thinMonths.length > 0) {
		parts.push(
			startSentence(
				`${joinLabels(view.thinMonths)} har för få registreringar för ett eget snitt och bidrar därför inte till jämförelsen.`
			)
		);
	}
	if (view.missingMonths.length > 0) {
		parts.push(
			startSentence(
				`${joinLabels(view.missingMonths)} saknar måenderegistreringar helt. En månad utan registreringar räknas aldrig som en förändring.`
			)
		);
	}
	if (truncated) {
		parts.push(
			'Perioden innehåller fler registreringar än den säkra läsgränsen, så underlaget kan vara beskuret.'
		);
	}

	return parts.join(' ');
}

function buildStats(view: {
	edges: HalfYearEdgeComparison | null;
	highest: { label: string; mean: number } | null;
	lowest: { label: string; mean: number } | null;
	monthSpread: number | null;
	variation: HalfYearVariation;
	monthsWithData: number;
}): HalfYearStat[] {
	return [
		{
			id: 'edges',
			label: 'Början mot slutet',
			value: view.edges
				? `${formatMood(view.edges.firstAverage)} → ${formatMood(view.edges.lastAverage)}`
				: 'Går inte att jämföra',
			note: view.edges
				? `${view.edges.firstLabel} mot ${view.edges.lastLabel}`
				: `Kräver ${MIN_MONTHS_FOR_DIRECTION} månader med tillräckligt underlag`
		},
		{
			id: 'extremes',
			label: 'Högsta och lägsta månad',
			value:
				view.highest && view.lowest
					? `${formatMood(view.highest.mean)} / ${formatMood(view.lowest.mean)}`
					: '—',
			// Korta månadsnamn här, samma som i jämförelsen ovanför. Årtalet finns
			// kvar i månadsblocken och i underlagstexten.
			note:
				view.highest && view.lowest
					? view.highest.label === view.lowest.label
						? `Bara ${toShortLabel(view.highest.label)} har tillräckligt underlag`
						: `${toShortLabel(view.highest.label)} och ${toShortLabel(view.lowest.label)}`
					: 'Ingen månad har tillräckligt underlag ännu'
		},
		{
			id: 'spread',
			label: 'Skillnad mellan månader',
			value: view.monthSpread !== null ? `${formatMood(view.monthSpread)} steg` : '—',
			note:
				view.monthSpread === null
					? 'Behöver minst två månader med underlag'
					: view.monthSpread >= MONTH_SPREAD_THRESHOLD
						? 'Avstånd mellan högsta och lägsta månadssnitt'
						: 'Månaderna ligger nära varandra'
		},
		{
			id: 'variation',
			label: 'Variation inom månaderna',
			value: VARIATION_VALUE[view.variation],
			note:
				view.variation === 'insufficient'
					? `Kräver ${MIN_MONTHS_PER_SIDE_FOR_VARIATION} månader med underlag i varje halva`
					: 'Halvårets första hälft jämförd med den andra'
		}
	];
}

const RELATIVE_TEXT: Record<MonthRelative, string> = {
	'much-higher': 'tydligt högre än halvårssnittet',
	higher: 'något högre än halvårssnittet',
	near: 'ungefär i nivå med halvårssnittet',
	lower: 'något lägre än halvårssnittet',
	'much-lower': 'tydligt lägre än halvårssnittet'
};

type IndexedMonth = HalfYearMonthInput & { index: number; mean: number; shortLabel: string };

function indexedMonths(months: HalfYearMonthInput[]): IndexedMonth[] {
	return months.flatMap((month, index) =>
		month.status === 'sufficient' && typeof month.mean === 'number' && Number.isFinite(month.mean)
			? [{ ...month, index, mean: month.mean, shortLabel: toShortLabel(month.label) }]
			: []
	);
}

function monthAt(months: IndexedMonth[], index: number): IndexedMonth | null {
	return months.find((month) => month.index === index) ?? null;
}

function buildMonthChanges(months: IndexedMonth[]): HalfYearMonthChange[] {
	const changes: HalfYearMonthChange[] = [];
	for (const current of months) {
		const previous = monthAt(months, current.index - 1);
		if (!previous) continue;

		const difference = roundToOneDecimal(current.mean - previous.mean);
		changes.push({
			fromLabel: previous.shortLabel,
			toLabel: current.shortLabel,
			difference,
			direction:
				difference >= MONTH_STABILITY_THRESHOLD
					? 'up'
					: difference <= -MONTH_STABILITY_THRESHOLD
						? 'down'
						: 'level'
		});
	}
	return changes;
}

function stableStart(months: IndexedMonth[]): IndexedMonth[] | null {
	const first = monthAt(months, 0);
	const second = monthAt(months, 1);
	if (!first || !second || Math.abs(second.mean - first.mean) > MONTH_STABILITY_THRESHOLD) return null;
	return [first, second];
}

function stableEnd(months: IndexedMonth[]): IndexedMonth[] | null {
	const last = months.at(-1);
	const previous = last ? monthAt(months, last.index - 1) : null;
	if (!last || !previous || Math.abs(last.mean - previous.mean) > MONTH_STABILITY_THRESHOLD) return null;
	return [previous, last];
}

function findMidDipReturn(months: IndexedMonth[]) {
	for (const low of months) {
		const before = monthAt(months, low.index - 1);
		if (!before || low.index === 0 || before.mean - low.mean < MONTH_CHANGE_THRESHOLD) continue;

		const after: IndexedMonth[] = [];
		for (let index = low.index + 1; ; index += 1) {
			const next = monthAt(months, index);
			if (!next) break;
			after.push(next);
		}
		if (after.length < 2) continue;

		const recoveryDeltas = after.map((month, index) => month.mean - (index === 0 ? low.mean : after[index - 1].mean));
		const returnsGradually =
			recoveryDeltas.every((difference) => difference >= -MONTH_STABILITY_THRESHOLD) &&
			recoveryDeltas.filter((difference) => difference >= MONTH_STABILITY_THRESHOLD).length >= 2 &&
			after.at(-1)!.mean - low.mean >= MONTH_CHANGE_THRESHOLD;

		if (returnsGradually) return { before, low, after };
	}
	return null;
}

function findRiseThenStable(months: IndexedMonth[], changes: HalfYearMonthChange[]) {
	const rise = changes
		.filter((change) => change.difference >= MONTH_CHANGE_THRESHOLD)
		.sort((a, b) => b.difference - a.difference)[0];
	const ending = stableEnd(months);
	if (!rise || !ending) return null;
	const riseTarget = months.find((month) => month.shortLabel === rise.toLabel);
	if (!riseTarget || ending[0].index <= riseTarget.index) return null;
	return { rise, ending };
}

function hasZigzag(changes: HalfYearMonthChange[]) {
	const directions = changes.filter((change) => Math.abs(change.difference) >= MONTH_CHANGE_THRESHOLD).map((change) => change.direction);
	let switches = 0;
	for (let index = 1; index < directions.length; index += 1) {
		if (directions[index] !== directions[index - 1]) switches += 1;
	}
	return switches >= 2;
}

function coverageSentence(months: HalfYearMonthInput[], valued: IndexedMonth[], truncated: boolean) {
	if (truncated || valued.length < MIN_MONTHS_FOR_SUMMARY) {
		return 'Underlaget räcker ännu inte för att läsa ett säkert förlopp över halvåret.';
	}
	if (months.some((month) => month.status !== 'sufficient')) {
		return 'Några månader innehåller få eller inga registreringar, så förändringarna bör läsas försiktigt.';
	}

	const counts = valued.map((month) => month.entryCount);
	const countAverage = average(counts)!;
	return Math.max(...counts) - Math.min(...counts) <= Math.max(4, countAverage * 0.5)
		? 'Underlaget är ganska jämnt fördelat över månaderna.'
		: 'Antalet registreringar varierar mellan månaderna, så varje månad bygger på olika mycket underlag.';
}

function edgeSentence(edges: HalfYearEdgeComparison | null) {
	if (!edges) return 'Början och slutet går inte att jämföra säkert med det här underlaget.';
	if (edges.direction === 'level') return 'Skillnaden mellan början och slutet av perioden är liten.';
	return edges.direction === 'higher'
		? 'I slutet av perioden ligger värdena högre än i början.'
		: 'I slutet av perioden ligger värdena lägre än i början.';
}

function buildHighlights(input: {
	months: IndexedMonth[];
	pattern: HalfYearPattern;
	monthSpread: number | null;
	truncated: boolean;
	allMonthsSufficient: boolean;
	dipReturn: ReturnType<typeof findMidDipReturn>;
	ending: IndexedMonth[] | null;
}): string[] {
	if (input.truncated || !input.allMonthsSufficient || input.months.length < MIN_MONTHS_FOR_SUMMARY) return [];

	const highlights: string[] = [];
	if (input.dipReturn) {
		highlights.push(`${startSentence(input.dipReturn.low.shortLabel)} ligger lägst bland månaderna med tillräckligt underlag.`);
	} else if (input.monthSpread !== null && input.monthSpread >= MONTH_SPREAD_THRESHOLD) {
		const lowest = [...input.months].sort((a, b) => a.mean - b.mean)[0];
		highlights.push(`${startSentence(lowest.shortLabel)} ligger lägst bland månaderna med tillräckligt underlag.`);
	}
	if (input.ending && input.pattern !== 'even') {
		highlights.push(`${startSentence(input.ending[0].shortLabel)} och ${input.ending[1].shortLabel} ligger nästan på samma nivå.`);
	}
	if (input.pattern === 'zigzag') {
		highlights.push('Flera intilliggande månader växlar i riktning.');
	}
	return [...new Set(highlights)].slice(0, 3);
}

function buildReflection(input: {
	months: HalfYearMonthInput[];
	edges: HalfYearEdgeComparison | null;
	monthSpread: number | null;
	truncated: boolean;
}): HalfYearReflection {
	const valued = indexedMonths(input.months);
	const changes = buildMonthChanges(valued);
	const coverage = coverageSentence(input.months, valued, input.truncated);
	if (input.truncated || valued.length < MIN_MONTHS_FOR_SUMMARY) {
		return { pattern: 'insufficient', sentences: [coverage], highlights: [], changes };
	}

	const sentences: string[] = [];
	const opening = stableStart(valued);
	const ending = stableEnd(valued);
	const dipReturn = findMidDipReturn(valued);
	const riseThenStable = findRiseThenStable(valued, changes);
	const zigzag = hasZigzag(changes);
	const pattern: HalfYearPattern = dipReturn
		? 'mid-dip-return'
		: riseThenStable
			? 'rise-stabilizes'
			: zigzag
				? 'zigzag'
				: input.monthSpread !== null && input.monthSpread < MONTH_SPREAD_THRESHOLD
					? 'even'
					: 'varied';

	if (pattern === 'mid-dip-return' && dipReturn) {
		if (opening) sentences.push(`Halvåret börjar på en ganska jämn nivå under ${joinLabels(opening.map((month) => month.shortLabel))}.`);
		sentences.push(`I ${dipReturn.low.shortLabel} syns en tydligare nedgång jämfört med ${dipReturn.before.shortLabel}.`);
		sentences.push(`Efter den lägre nivån i ${dipReturn.low.shortLabel} stiger värdena gradvis under ${joinLabels(dipReturn.after.map((month) => month.shortLabel))}.`);
		if (ending) sentences.push(`${startSentence(ending[0].shortLabel)} och ${ending[1].shortLabel} ligger sedan ungefär på samma nivå.`);
	} else if (pattern === 'rise-stabilizes' && riseThenStable) {
		sentences.push(`En tydligare uppgång syns mellan ${riseThenStable.rise.fromLabel} och ${riseThenStable.rise.toLabel}.`);
		sentences.push(`Efter uppgången ligger ${riseThenStable.ending[0].shortLabel} och ${riseThenStable.ending[1].shortLabel} ungefär på samma nivå.`);
		sentences.push(edgeSentence(input.edges));
	} else if (pattern === 'zigzag') {
		const largest = [...changes].sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))[0];
		sentences.push('Värdena växlar upp och ner mellan flera månader, utan en jämn riktning genom perioden.');
		if (largest && Math.abs(largest.difference) >= MONTH_CHANGE_THRESHOLD) {
			sentences.push(`Den största förändringen syns mellan ${largest.fromLabel} och ${largest.toLabel}.`);
		}
		sentences.push(edgeSentence(input.edges));
	} else if (pattern === 'even') {
		sentences.push('Värdena ligger nära varandra under större delen av perioden.');
		sentences.push('Ingen enskild månad skiljer ut sig tydligt från de andra månaderna med underlag.');
		sentences.push(edgeSentence(input.edges));
	} else {
		const largest = [...changes].sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))[0];
		sentences.push('Det finns större skillnader mellan vissa månader i perioden.');
		if (largest && Math.abs(largest.difference) >= MONTH_CHANGE_THRESHOLD) {
			sentences.push(`Den största förändringen syns mellan ${largest.fromLabel} och ${largest.toLabel}.`);
		}
		sentences.push(edgeSentence(input.edges));
	}

	sentences.push(coverage);
	return {
		pattern,
		sentences: sentences.slice(0, 5),
		highlights: buildHighlights({
			months: valued,
			pattern,
			monthSpread: input.monthSpread,
			truncated: input.truncated,
			allMonthsSufficient: input.months.every((month) => month.status === 'sufficient'),
			dipReturn,
			ending
		}),
		changes
	};
}

/**
 * Bygger hela halvårsvyn ur månadsblocken som redan finns i analysen.
 * Returnerar null när det inte finns några månadsblock alls, vilket bara gäller
 * andra perioder än 180 dagar.
 */
export function buildHalfYearView(input: {
	months: readonly HalfYearMonthInput[] | null | undefined;
	truncated?: boolean;
}): HalfYearView | null {
	const months = [...(input.months ?? [])];
	if (months.length === 0) return null;

	const truncated = input.truncated === true;
	const valued = withValue(months);
	const means = valued.map((month) => month.mean);
	const overallAverage = average(means);
	const sorted = [...valued].sort((a, b) => b.mean - a.mean);
	const highest = sorted[0] ?? null;
	const lowest = sorted.at(-1) ?? null;
	const monthSpread =
		highest && lowest && valued.length >= 2 ? roundToOneDecimal(highest.mean - lowest.mean) : null;
	const edges = buildEdgeComparison(months);
	const variation = buildVariation(months);
	const reflection = buildReflection({ months, edges, monthSpread, truncated });

	const monthViews: HalfYearMonthView[] = months.map((month) => {
		const hasValue = month.status === 'sufficient' && typeof month.mean === 'number';
		const difference = hasValue && overallAverage !== null ? month.mean! - overallAverage : null;
		const relative: MonthRelative | null =
			difference !== null
				? Math.abs(difference) < MONTH_RELATIVE_THRESHOLD
					? 'near'
					: difference >= MONTH_RELATIVE_STRONG_THRESHOLD
						? 'much-higher'
						: difference <= -MONTH_RELATIVE_STRONG_THRESHOLD
							? 'much-lower'
							: difference > 0
								? 'higher'
								: 'lower'
				: null;
		return {
			...month,
			shortLabel: toShortLabel(month.label),
			relative,
			relativeText: relative ? RELATIVE_TEXT[relative] : null
		};
	});

	const shape = {
		monthsShown: months.length,
		monthsWithData: valued.length,
		entryCount: months.reduce(
			(sum, month) => sum + (Number.isFinite(month.entryCount) ? month.entryCount : 0),
			0
		),
		thinMonths: months.filter((month) => month.status === 'thin').map((month) => month.label),
		missingMonths: months.filter((month) => month.status === 'missing').map((month) => month.label),
		average: overallAverage === null ? null : roundToOneDecimal(overallAverage),
		highest: highest ? { label: highest.label, mean: roundToOneDecimal(highest.mean) } : null,
		lowest: lowest ? { label: lowest.label, mean: roundToOneDecimal(lowest.mean) } : null,
		monthSpread,
		edges,
		variation
	};

	return {
		months: monthViews,
		...shape,
		hasDirection:
			!truncated &&
			edges !== null &&
			edges.direction !== 'level' &&
			shape.monthsWithData >= MIN_MONTHS_FOR_DIRECTION,
		summary: buildSummary(edges, variation, monthSpread, shape.monthsWithData, truncated),
		reflection,
		stats: buildStats(shape),
		basis: buildBasis({ ...shape, edges }, truncated)
	};
}
