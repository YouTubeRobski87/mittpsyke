// Ren logik för "Ditt mående över tid" i den inloggade dagboken.
//
// Använder bara strukturerad data som redan finns:
//   - humörvärden från /api/diary/stats-timeline
//   - skrivdagar från /api/diary/heatmap
// Ingen fritext, ingen AI, ingen ny tabell.
//
// Språkregel: vi beskriver registreringarna, inte personen. Ingen text får
// påstå en riktning som inte passerar tröskelvärdena nedan.
//
// Dygnet räknas i svensk tid via $lib/stockholm-date, så perioden och talen
// stämmer med heatmap, stats-timeline och streak.

import {
	aggregateSamples,
	getResolution,
	MIN_MOOD_POINTS,
	type ChartPoint,
	type MoodSample
} from '$lib/progress-recent-period';
import { shiftDateKey, stockholmTodayKey, STOCKHOLM_DATE_PATTERN } from '$lib/stockholm-date';

export type DiaryPeriodDays = 7 | 30 | 90;

export const DIARY_PERIOD_OPTIONS: {
	value: DiaryPeriodDays;
	label: string;
	longLabel: string;
}[] = [
	{ value: 7, label: '7 dagar', longLabel: 'de senaste 7 dagarna' },
	{ value: 30, label: '30 dagar', longLabel: 'de senaste 30 dagarna' },
	{ value: 90, label: '90 dagar', longLabel: 'de senaste 90 dagarna' }
];

/**
 * Varje halva av perioden måste ha minst så här många DAGAR med humör innan en
 * riktning får nämnas.
 *
 * Enheten är dagar, inte registreringar: en enskild dag med fem inlägg ska inte
 * kunna bära en jämförelse. Tre dagar per halva är den lägsta nivån där ett
 * medelvärde inte styrs helt av en enda dag, och den matchar
 * MIN_POINTS_PER_WINDOW (4) i storleksordning utan att göra 30-dagarsperioden
 * praktiskt otillgänglig. Vid 7 dagar blir halvorna 3 dagar var, så trenden
 * kräver då humör på samtliga dessa dagar - avsiktligt strängt.
 */
export const MIN_MOOD_DAYS_PER_HALF = 3;

/**
 * Neutralzon i steg på humörskalan 1-10. Skillnaden i dagsmedelvärde mellan
 * halvorna måste passera detta innan texten får säga ljusare eller tyngre.
 * Samma värde som MOOD_CHANGE_THRESHOLD i progress-reflection, så de två
 * ytorna inte drar olika slutsatser av samma data.
 */
export const MOOD_TREND_THRESHOLD = 0.75;

export type MoodTrendDirection = 'lighter' | 'same' | 'heavier' | 'insufficient';

export interface DiaryPeriodWindow {
	/** Första dygnet i perioden, inklusive. */
	startKey: string;
	/** Sista dygnet i perioden, inklusive. Alltid dagens datum. */
	endKey: string;
}

export interface MoodTrend {
	direction: MoodTrendDirection;
	/** Null när underlaget inte räcker - då visas ingen trendrad alls. */
	text: string | null;
	recentMoodDays: number;
	earlierMoodDays: number;
}

export interface DiaryProgressView {
	period: DiaryPeriodDays;
	window: DiaryPeriodWindow;
	/** Antal dagar i perioden med minst ett inlägg. */
	entryDays: number;
	/** Antal dagar i perioden med minst ett humörvärde. */
	moodDays: number;
	points: ChartPoint[];
	hasChart: boolean;
	/** Alltid satt. Ren räkning, ingen tolkning. */
	summary: string;
	trend: MoodTrend;
	textAlternative: string;
}

export const EMPTY_PERIOD_COPY =
	'Det finns inte tillräckligt många registrerade dagar ännu för att visa en utveckling.';

export const CHART_PENDING_COPY =
	'Kurvan växer fram när fler dagar får ett humörvärde. Du kan lägga till det med reglaget när du skriver.';

/** Perioden räknas inklusive dagens datum: 7 dagar = idag plus 6 dagar bakåt. */
export function getPeriodWindow(
	period: DiaryPeriodDays,
	now: Date = new Date()
): DiaryPeriodWindow {
	const endKey = stockholmTodayKey(now);
	return { startKey: shiftDateKey(endKey, -(period - 1)), endKey };
}

function isInWindow(dateKey: string, window: DiaryPeriodWindow): boolean {
	return dateKey >= window.startKey && dateKey <= window.endKey;
}

/**
 * Antal dagar med minst ett inlägg. Framtida datum ligger utanför fönstret
 * eftersom endKey är dagens datum, så de kan aldrig räknas med.
 */
export function countEntryDays(
	heatmapData: Record<string, number> | null | undefined,
	window: DiaryPeriodWindow
): number {
	if (!heatmapData) return 0;
	let days = 0;

	for (const [dateKey, count] of Object.entries(heatmapData)) {
		if (!STOCKHOLM_DATE_PATTERN.test(dateKey)) continue;
		if (!isInWindow(dateKey, window)) continue;
		if (!Number.isFinite(count) || count <= 0) continue;
		days += 1;
	}

	return days;
}

/**
 * Ett värde per dag: medelvärdet av dagens humörnoteringar. Dagar utan humör
 * saknas helt i resultatet - de får aldrig bli ett neutralt värde.
 */
export function toMoodDayAverages(
	samples: MoodSample[],
	window: DiaryPeriodWindow
): Map<string, number> {
	const sums = new Map<string, { total: number; count: number }>();

	for (const sample of samples) {
		if (!STOCKHOLM_DATE_PATTERN.test(sample.date)) continue;
		if (!isInWindow(sample.date, window)) continue;
		const bucket = sums.get(sample.date) ?? { total: 0, count: 0 };
		bucket.total += sample.mood;
		bucket.count += 1;
		sums.set(sample.date, bucket);
	}

	const averages = new Map<string, number>();
	for (const [dateKey, bucket] of sums) {
		averages.set(dateKey, bucket.total / bucket.count);
	}

	return averages;
}

function mean(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Delar perioden i två tidsmässigt lika halvor och jämför dagsmedelvärden.
 *
 * Vid ojämnt antal dagar utesluts mittendagen från båda halvorna, så halvorna
 * alltid är exakt lika långa. Det gör gränsen deterministisk i stället för att
 * ge den ena halvan en dag mer.
 */
export function buildMoodTrend(
	moodDayAverages: Map<string, number>,
	window: DiaryPeriodWindow,
	period: DiaryPeriodDays
): MoodTrend {
	const halfLength = Math.floor(period / 2);
	const earlierEnd = shiftDateKey(window.startKey, halfLength - 1);
	const recentStart = shiftDateKey(window.endKey, -(halfLength - 1));

	const earlier: number[] = [];
	const recent: number[] = [];

	for (const [dateKey, average] of moodDayAverages) {
		if (dateKey >= window.startKey && dateKey <= earlierEnd) earlier.push(average);
		else if (dateKey >= recentStart && dateKey <= window.endKey) recent.push(average);
	}

	if (earlier.length < MIN_MOOD_DAYS_PER_HALF || recent.length < MIN_MOOD_DAYS_PER_HALF) {
		return {
			direction: 'insufficient',
			text: null,
			recentMoodDays: recent.length,
			earlierMoodDays: earlier.length
		};
	}

	const difference = mean(recent) - mean(earlier);

	if (difference >= MOOD_TREND_THRESHOLD) {
		return {
			direction: 'lighter',
			text: 'Dina senaste registreringar ligger något ljusare än de tidigare i perioden.',
			recentMoodDays: recent.length,
			earlierMoodDays: earlier.length
		};
	}

	if (difference <= -MOOD_TREND_THRESHOLD) {
		return {
			direction: 'heavier',
			text: 'Dina senaste registreringar ligger något tyngre än de tidigare i perioden.',
			recentMoodDays: recent.length,
			earlierMoodDays: earlier.length
		};
	}

	return {
		direction: 'same',
		text: 'Dina registreringar ligger ungefär på samma nivå genom perioden.',
		recentMoodDays: recent.length,
		earlierMoodDays: earlier.length
	};
}

function buildSummary(entryDays: number, period: DiaryPeriodDays): string {
	if (entryDays === 0) return EMPTY_PERIOD_COPY;
	return `Du har skrivit ${entryDays} av de senaste ${period} dagarna.`;
}

function buildTextAlternative(points: ChartPoint[], period: DiaryPeriodDays): string {
	const option = DIARY_PERIOD_OPTIONS.find((item) => item.value === period);
	const periodLabel = option ? option.longLabel : 'perioden';
	if (points.length === 0) return `Ingen humörkurva ${periodLabel}. ${CHART_PENDING_COPY}`;
	const values = points.map((point) => `${point.fullLabel}: ${point.value} av 10`).join('. ');
	return `Humör ${periodLabel}, ${points.length} ${
		points.length === 1 ? 'mätpunkt' : 'mätpunkter'
	} på en skala från 1 tungt till 10 ljusare. ${values}.`;
}

/** Bygger hela vyn från redan hämtad data. Gör inga anrop. */
export function buildDiaryProgressView(input: {
	samples: MoodSample[];
	heatmapData: Record<string, number> | null | undefined;
	period: DiaryPeriodDays;
	now?: Date;
}): DiaryProgressView {
	const now = input.now ?? new Date();
	const window = getPeriodWindow(input.period, now);
	const entryDays = countEntryDays(input.heatmapData, window);
	const moodDayAverages = toMoodDayAverages(input.samples, window);
	const periodSamples = input.samples.filter((sample) => isInWindow(sample.date, window));

	const hasChart = moodDayAverages.size >= MIN_MOOD_POINTS;
	const points = hasChart ? aggregateSamples(periodSamples, getResolution(input.period)) : [];

	return {
		period: input.period,
		window,
		entryDays,
		moodDays: moodDayAverages.size,
		points,
		hasChart,
		summary: buildSummary(entryDays, input.period),
		trend: buildMoodTrend(moodDayAverages, window, input.period),
		textAlternative: buildTextAlternative(points, input.period)
	};
}
