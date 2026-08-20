import {
	aggregateSamples,
	filterByPeriod,
	getPeriodLongLabel,
	getPeriodStartKey,
	getResolution,
	MIN_MOOD_POINTS,
	type ChartPoint,
	type MoodSample,
	type PeriodDays,
	type ThemeLike
} from '$lib/progress-recent-period';

export type MoodTimelineView = {
	points: ChartPoint[];
	hasChart: boolean;
	sampleCount: number;
	textAlternative: string;
};

export type ChangeObservation = {
	hasComparison: boolean;
	text: string;
};

export type PeriodAnalysis = {
	sampleCount: number;
	insufficientData: boolean;
	summary: string;
	observations: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const COMPARISON_DAYS = 14;
const MIN_SAMPLES_PER_PERIOD = 4;
const MOOD_CHANGE_THRESHOLD = 0.75;
const MIN_SAMPLES_PER_HALF = 3;
const LATEST_DEVIATION_THRESHOLD = 1.5;
const MONTHLY_DIFFERENCE_THRESHOLD = 1.5;
const RECENT_WINDOW_DAYS = 30;

const ANALYSIS_OBSERVATION_LIMIT: Record<PeriodDays, number> = {
	7: 2,
	30: 4,
	90: 5,
	180: 7
};

const EMPTY_MOOD_COPY =
	'När du sätter ord på hur du har det börjar mönster kunna synas här.';
const INSUFFICIENT_CHANGE_COPY =
	'Det finns ännu för lite underlag för att jämföra perioder.';

function dateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function average(samples: MoodSample[]): number {
	return samples.reduce((sum, sample) => sum + sample.mood, 0) / samples.length;
}

function periodLabel(periodDays: PeriodDays): string {
	return getPeriodLongLabel(periodDays).replace(/^senaste /, 'de senaste ');
}

function countLabel(count: number): string {
	return `${count} ${count === 1 ? 'registrering' : 'registreringar'}`;
}

function formatMood(value: number): string {
	return value.toFixed(1).replace('.', ',');
}

function buildOverallObservation(samples: MoodSample[]): string {
	const values = samples.map((sample) => sample.mood);
	const low = Math.min(...values);
	const high = Math.max(...values);
	const mean = formatMood(average(samples));
	if (low === high) return `Snittet är ${mean} av 10 och alla registreringar ligger på nivå ${low}.`;
	return `Snittet är ${mean} av 10, med registreringar mellan ${low} och ${high}.`;
}

function splitPeriodHalves(samples: MoodSample[], periodDays: PeriodDays, now: Date) {
	const start = new Date(`${getPeriodStartKey(periodDays, now)}T12:00:00`);
	start.setDate(start.getDate() + Math.ceil(periodDays / 2));
	const splitKey = dateKey(start);
	return {
		first: samples.filter((sample) => sample.date < splitKey),
		latter: samples.filter((sample) => sample.date >= splitKey)
	};
}

function buildDirectionObservation(samples: MoodSample[], periodDays: PeriodDays, now: Date): string | null {
	const { first, latter } = splitPeriodHalves(samples, periodDays, now);
	if (first.length < MIN_SAMPLES_PER_HALF || latter.length < MIN_SAMPLES_PER_HALF) return null;

	const difference = average(latter) - average(first);
	if (difference >= MOOD_CHANGE_THRESHOLD) {
		return 'Den senare delen av perioden ligger något högre på skalan än den första.';
	}
	if (difference <= -MOOD_CHANGE_THRESHOLD) {
		return 'Den senare delen av perioden ligger något lägre på skalan än den första.';
	}
	return null;
}

function buildNoMeaningfulChangeObservation(samples: MoodSample[], periodDays: PeriodDays, now: Date): string | null {
	const { first, latter } = splitPeriodHalves(samples, periodDays, now);
	if (first.length < MIN_SAMPLES_PER_HALF || latter.length < MIN_SAMPLES_PER_HALF) return null;
	if (Math.abs(average(latter) - average(first)) >= MOOD_CHANGE_THRESHOLD) return null;
	return 'Den senare delen av perioden ligger på ungefär samma nivå som den första.';
}

function buildVariationObservation(samples: MoodSample[], hasDirection: boolean): string | null {
	const values = samples.map((sample) => sample.mood);
	const spread = Math.max(...values) - Math.min(...values);
	if (spread <= 2) return 'Registreringarna har legat ganska jämnt under perioden.';
	if (spread >= 5) {
		return hasDirection
			? 'Registreringarna har varierat en del under perioden.'
			: 'Registreringarna har varierat en del, utan en enda tydlig riktning.';
	}
	return 'Det finns både högre och lägre registreringar i perioden.';
}

function buildRecurringLevelObservation(samples: MoodSample[]): string | null {
	const counts = new Map<number, number>();
	for (const sample of samples) counts.set(sample.mood, (counts.get(sample.mood) ?? 0) + 1);
	const recurring = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
	if (!recurring || recurring[1] < 3) return null;
	return `Flera registreringar återkommer kring nivå ${recurring[0]} på skalan.`;
}

function buildLatestObservation(samples: MoodSample[]): string | null {
	if (samples.length < MIN_MOOD_POINTS) return null;
	const latest = samples.at(-1);
	const earlier = samples.slice(0, -1);
	if (!latest || earlier.length < MIN_SAMPLES_PER_HALF) return null;
	const difference = latest.mood - average(earlier);
	if (difference >= LATEST_DEVIATION_THRESHOLD) {
		return 'Den senaste registreringen ligger högre på skalan än flera av de tidigare.';
	}
	if (difference <= -LATEST_DEVIATION_THRESHOLD) {
		return 'Den senaste registreringen ligger lägre på skalan än flera av de tidigare.';
	}
	return null;
}

function buildRecentWindowObservation(samples: MoodSample[], periodDays: PeriodDays, now: Date): string | null {
	if (periodDays < 90) return null;
	const end = dateKey(now);
	const recentStart = dateKey(new Date(now.getTime() - (RECENT_WINDOW_DAYS - 1) * DAY_MS));
	const previousStart = dateKey(new Date(now.getTime() - (RECENT_WINDOW_DAYS * 2 - 1) * DAY_MS));
	const recent = samples.filter((sample) => sample.date >= recentStart && sample.date <= end);
	const previous = samples.filter((sample) => sample.date >= previousStart && sample.date < recentStart);
	if (recent.length < MIN_SAMPLES_PER_PERIOD || previous.length < MIN_SAMPLES_PER_PERIOD) return null;
	const difference = average(recent) - average(previous);
	if (difference >= MOOD_CHANGE_THRESHOLD) return 'De senaste 30 dagarna ligger högre på skalan än de 30 dagarna före.';
	if (difference <= -MOOD_CHANGE_THRESHOLD) return 'De senaste 30 dagarna ligger lägre på skalan än de 30 dagarna före.';
	return null;
}

function buildMonthlyRangeObservation(samples: MoodSample[], periodDays: PeriodDays): string | null {
	if (periodDays < 90) return null;
	const months = new Map<string, MoodSample[]>();
	for (const sample of samples) {
		const key = sample.date.slice(0, 7);
		months.set(key, [...(months.get(key) ?? []), sample]);
	}
	const eligible = [...months.entries()]
		.filter(([, monthSamples]) => monthSamples.length >= MIN_SAMPLES_PER_HALF)
		.map(([key, monthSamples]) => ({ key, average: average(monthSamples) }));
	if (eligible.length < 3) return null;
	const highest = [...eligible].sort((a, b) => b.average - a.average)[0];
	const lowest = [...eligible].sort((a, b) => a.average - b.average)[0];
	if (!highest || !lowest || highest.average - lowest.average < MONTHLY_DIFFERENCE_THRESHOLD) return null;
	const formatter = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' });
	const formatMonth = (key: string) => formatter.format(new Date(`${key}-01T12:00:00`));
	return `Bland månader med minst tre registreringar låg ${formatMonth(highest.key)} högst och ${formatMonth(lowest.key)} lägst.`;
}

/**
 * Kort, regelbaserad periodanalys för Framsteg. Varje mening är direkt härledd
 * ur humörvärden inom det valda spannet; den gör inga medicinska eller
 * diagnostiska tolkningar och hävdar ingen riktning utan tröskelvärde.
 */
export function buildPeriodAnalysis(
	samples: MoodSample[],
	periodDays: PeriodDays,
	now: Date = new Date()
): PeriodAnalysis {
	const periodSamples = filterByPeriod(samples, periodDays, now).sort((a, b) =>
		a.date.localeCompare(b.date)
	);
	const sampleCount = periodSamples.length;
	const label = periodLabel(periodDays);

	if (sampleCount < MIN_MOOD_POINTS) {
		return {
			sampleCount,
			insufficientData: true,
			summary: `Det här bygger på ${countLabel(sampleCount)} under ${label}. Det är lite för tidigt för att se ett tydligt mönster, men bilden blir tydligare när fler stunder läggs till.`,
			observations: []
		};
	}

	const overview = buildOverallObservation(periodSamples);
	const direction = buildDirectionObservation(periodSamples, periodDays, now);
	const noMeaningfulChange = buildNoMeaningfulChangeObservation(periodSamples, periodDays, now);
	const variation = buildVariationObservation(periodSamples, direction !== null);
	const recurring = buildRecurringLevelObservation(periodSamples);
	const latest = buildLatestObservation(periodSamples);
	const recentWindow = buildRecentWindowObservation(periodSamples, periodDays, now);
	const monthlyRange = buildMonthlyRangeObservation(periodSamples, periodDays);
	const candidates =
		periodDays === 30
			? [overview, direction, noMeaningfulChange, latest, variation, recurring]
			: [overview, direction, noMeaningfulChange, recentWindow, monthlyRange, variation, recurring, latest];

	return {
		sampleCount,
		insufficientData: false,
		summary: `Det här bygger på ${countLabel(sampleCount)} under ${label}.`,
		observations: candidates
			.filter((observation): observation is string => observation !== null)
			.slice(0, ANALYSIS_OBSERVATION_LIMIT[periodDays])
	};
}

/**
 * Ritar enbart punkter som användaren själv har satt i dagboken. Tomt
 * underlag ger alltid tom graf, aldrig en interpolerad reservkurva.
 */
export function buildMoodTimelineView(
	samples: MoodSample[],
	periodDays: PeriodDays,
	now: Date = new Date()
): MoodTimelineView {
	const periodSamples = filterByPeriod(samples, periodDays, now);
	const hasChart = periodSamples.length >= MIN_MOOD_POINTS;
	const points = hasChart ? aggregateSamples(periodSamples, getResolution(periodDays)) : [];
	const periodLabel = getPeriodLongLabel(periodDays);
	const textAlternative = hasChart
		? `Humör ${periodLabel}. ${points
				.map((point) => `${point.fullLabel}: ${point.value} av 10`)
				.join('. ')}.`
		: EMPTY_MOOD_COPY;

	return { points, hasChart, sampleCount: periodSamples.length, textAlternative };
}

/** Visar bara teman med upprepat, verkligt underlag från sparade texter. */
export function buildRecurringThemes(themes: ThemeLike[] | null | undefined): string[] {
	if (!Array.isArray(themes)) return [];

	return [...themes]
		.filter((theme) => typeof theme?.label === 'string' && theme.label.trim().length > 0)
		.filter((theme) => Number.isFinite(theme?.count) && theme.count >= 2)
		.sort((a, b) => b.count - a.count)
		.slice(0, 4)
		.map((theme) => `Du har ofta skrivit om ${theme.label.trim().toLocaleLowerCase('sv-SE')}.`);
}

/**
 * Jämför två lika långa, avslutade 14-dagarsperioder. En riktning visas
 * bara när båda har minst fyra verkliga humörvärden och skillnaden är tydlig.
 */
export function buildMoodChangeObservation(
	samples: MoodSample[],
	now: Date = new Date()
): ChangeObservation {
	const end = dateKey(now);
	const recentStart = dateKey(new Date(now.getTime() - (COMPARISON_DAYS - 1) * DAY_MS));
	const previousStart = dateKey(new Date(now.getTime() - (COMPARISON_DAYS * 2 - 1) * DAY_MS));
	const recent = samples.filter((sample) => sample.date >= recentStart && sample.date <= end);
	const previous = samples.filter((sample) => sample.date >= previousStart && sample.date < recentStart);

	if (recent.length < MIN_SAMPLES_PER_PERIOD || previous.length < MIN_SAMPLES_PER_PERIOD) {
		return { hasComparison: false, text: INSUFFICIENT_CHANGE_COPY };
	}

	const difference = average(recent) - average(previous);
	if (difference >= MOOD_CHANGE_THRESHOLD) {
		return {
			hasComparison: true,
			text: 'Du har satt ett ljusare humör oftare de senaste två veckorna.'
		};
	}
	if (difference <= -MOOD_CHANGE_THRESHOLD) {
		return {
			hasComparison: true,
			text: 'Du har satt ett tyngre humör oftare de senaste två veckorna.'
		};
	}

	return {
		hasComparison: true,
		text: 'Dina humörvärden ligger ungefär lika de senaste två veckorna som veckorna innan.'
	};
}

export { EMPTY_MOOD_COPY, INSUFFICIENT_CHANGE_COPY };
