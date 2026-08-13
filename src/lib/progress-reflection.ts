import {
	aggregateSamples,
	filterByPeriod,
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

const DAY_MS = 24 * 60 * 60 * 1000;
const COMPARISON_DAYS = 14;
const MIN_SAMPLES_PER_PERIOD = 4;
const MOOD_CHANGE_THRESHOLD = 0.75;

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
	const periodLabel = periodDays === 30 ? 'senaste 30 dagarna' : periodDays === 90 ? 'senaste tre månaderna' : 'senaste sex månaderna';
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
