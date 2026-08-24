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
export type MonthRelative = 'higher' | 'lower' | 'near';
export type HalfYearDirection = 'higher' | 'lower' | 'level';
export type HalfYearVariation = 'steadier' | 'more-varied' | 'unchanged' | 'insufficient';

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
	higher: 'Över ditt halvårssnitt',
	lower: 'Under ditt halvårssnitt',
	near: 'Nära ditt halvårssnitt'
};

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

	const monthViews: HalfYearMonthView[] = months.map((month) => {
		const hasValue = month.status === 'sufficient' && typeof month.mean === 'number';
		const relative: MonthRelative | null =
			hasValue && overallAverage !== null
				? Math.abs(month.mean! - overallAverage) < MONTH_RELATIVE_THRESHOLD
					? 'near'
					: month.mean! > overallAverage
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
		stats: buildStats(shape),
		basis: buildBasis({ ...shape, edges }, truncated)
	};
}
