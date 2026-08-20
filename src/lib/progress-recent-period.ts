// Ren logik för sektionen "Din senaste tid" på Framsteg.
//
// Modulen håller sig till data som redan finns: humörpunkter från
// /api/diary/stats-timeline, skrivdagar från /api/diary/heatmap och teman från
// narrative.themes i /api/diary/insights. Ingen ny AI-körning, ingen ny
// databasfråga. Allt som visas ska gå att härleda ur de tre källorna.
//
// Språkregel för hela modulen: observationer, inte tolkningar. Ingen text får
// påstå något som inte passerar tröskelvärdena nedan.

// 7 finns för dagbokens översikt. PERIOD_OPTIONS nedan är fortfarande Framstegs
// uppsättning, så den sidans knappar påverkas inte av att typen vidgas.
export type PeriodDays = 7 | 30 | 90 | 180;
export type Resolution = 'day' | 'week';

export interface MoodSample {
	/** ISO-datum, YYYY-MM-DD. */
	date: string;
	/** Humörvärde 1-10. */
	mood: number;
}

export interface ChartPoint {
	/** Unik nyckel för perioden (datum eller ISO-vecka). */
	key: string;
	/** Kort etikett för x-axeln, t.ex. "3 aug" eller "v. 31". */
	label: string;
	/** Längre etikett för textalternativet. */
	fullLabel: string;
	/** Medelvärde för punkten, avrundat till en decimal. */
	value: number;
	/** Antal humörnoteringar som ligger bakom värdet. */
	count: number;
	/** Första datumet i punkten, för sortering och tooltip. */
	date: string;
}

export interface ChartGeometryPoint extends ChartPoint {
	x: number;
	y: number;
}

export interface ChartGeometry {
	/** Polyline-punkter. Tom sträng när underlaget inte räcker för en linje. */
	line: string;
	points: ChartGeometryPoint[];
	width: number;
	height: number;
}

export interface Observation {
	id: 'mood' | 'theme' | 'return';
	label: string;
	text: string;
}

export interface RecentPeriodView {
	/** Punkter att rita. Tom när humörunderlaget inte räcker. */
	points: ChartPoint[];
	resolution: Resolution;
	/** Antal humörnoteringar i perioden, före aggregering. */
	sampleCount: number;
	/** Sant när kurvan kan ritas, dvs minst MIN_MOOD_POINTS humörnoteringar. */
	hasChart: boolean;
	/** Kort mening under grafen. Alltid satt. */
	summary: string;
	observations: Observation[];
	/** Textalternativ till grafen, läses av skärmläsare. */
	textAlternative: string;
}

export interface ThemeLike {
	label: string;
	count: number;
}

/** Skrivaktivitet som går att härleda direkt ur heatmapens dagliga antal. */
export interface PeriodActivity {
	/** Antal sparade texter inom det valda datumspannet. */
	entryCount: number;
	/** Antal dagar med minst en sparad text. */
	activeDays: number;
	/** Antal kalenderveckor med minst en sparad text. */
	activeWeeks: number;
	/** Längsta följd av aktiva dagar, räknad enbart inom datumspannet. */
	longestActiveStreak: number;
}

// ── Tröskelvärden ──
// Samlade här så att villkoren för varje påstående går att läsa på ett ställe.

/** Under så här många humörnoteringar i perioden ritas ingen kurva alls. */
export const MIN_MOOD_POINTS = 4;

/** Jämförelsen "jämnare/ojämnare" görs mellan två fönster om 14 dagar. */
export const STEADINESS_WINDOW_DAYS = 14;

/**
 * Båda fönstren måste ha minst så här många humörnoteringar. Med färre punkter
 * blir spridningen för känslig för en enskild dag för att säga något.
 */
export const MIN_POINTS_PER_WINDOW = 4;

/**
 * Skillnaden i genomsnittlig avvikelse måste passera det här värdet innan
 * texten får kalla något jämnare eller ojämnare. Enheten är steg på
 * humörskalan 1-10.
 */
export const STEADINESS_DELTA_THRESHOLD = 0.6;

/** Ett tema måste nämnas i minst så här många reflektioner för att visas. */
export const MIN_THEME_COUNT = 2;

/** Exakt copy när underlaget inte räcker för en jämförelse. */
export const NEUTRAL_OBSERVATION_COPY =
	'Det finns ännu för lite underlag för att se en tydlig förändring.';

/** Copy när humörkurvan inte kan ritas än. */
export const CHART_FALLBACK_COPY =
	'Kurvan växer fram när fler inlägg får ett humörvärde. Du kan lägga till det med reglaget när du skriver.';

export const PERIOD_OPTIONS: { value: PeriodDays; label: string; longLabel: string }[] = [
	{ value: 30, label: '30 dagar', longLabel: 'senaste 30 dagarna' },
	{ value: 90, label: '3 månader', longLabel: 'senaste tre månaderna' },
	{ value: 180, label: '6 månader', longLabel: 'senaste sex månaderna' }
];

/**
 * Täcker alla PeriodDays, även 7 som inte ligger i PERIOD_OPTIONS. Utan den här
 * skulle textalternativ och observationer falla tillbaka på "perioden" för 7.
 */
const PERIOD_LONG_LABELS: Record<PeriodDays, string> = {
	7: 'senaste 7 dagarna',
	30: 'senaste 30 dagarna',
	90: 'senaste tre månaderna',
	180: 'senaste sex månaderna'
};

export function getPeriodLongLabel(periodDays: PeriodDays): string {
	return PERIOD_LONG_LABELS[periodDays] ?? 'perioden';
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const dayLabelFormatter = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });
const fullDateFormatter = new Intl.DateTimeFormat('sv-SE', {
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});

/**
 * Datumsträngar tolkas mitt på dagen i lokal tid. Med midnatt kan sommartid
 * flytta punkten till föregående dygn.
 */
function toLocalDate(date: string): Date | null {
	if (!DATE_PATTERN.test(date)) return null;
	const parsed = new Date(`${date}T12:00:00`);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/** Humör lagras som sträng i databasen och kan vara tomt eller ogiltigt. */
export function parseMoodValue(value: unknown): number | null {
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) return null;
		return clampMood(value);
	}
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	const parsed = Number.parseFloat(trimmed.replace(',', '.'));
	if (!Number.isFinite(parsed)) return null;
	return clampMood(parsed);
}

function clampMood(value: number): number {
	return Math.min(10, Math.max(1, value));
}

export function toMoodSamples(rows: { date?: unknown; mood?: unknown }[] | null | undefined): MoodSample[] {
	if (!Array.isArray(rows)) return [];
	return rows
		.map((row) => {
			const date = typeof row?.date === 'string' ? row.date.slice(0, 10) : '';
			if (!DATE_PATTERN.test(date)) return null;
			const mood = parseMoodValue(row?.mood);
			if (mood === null) return null;
			return { date, mood };
		})
		.filter((sample): sample is MoodSample => sample !== null)
		.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Perioden räknas inklusive dagens datum, dvs 30 dagar = idag plus 29 dagar
 * bakåt.
 */
export function getPeriodStartKey(periodDays: PeriodDays, now: Date = new Date()): string {
	const start = new Date(now.getTime() - (periodDays - 1) * DAY_MS);
	return toDateKey(start);
}

export function filterByPeriod(
	samples: MoodSample[],
	periodDays: PeriodDays,
	now: Date = new Date()
): MoodSample[] {
	const startKey = getPeriodStartKey(periodDays, now);
	const endKey = toDateKey(now);
	return samples.filter((sample) => sample.date >= startKey && sample.date <= endKey);
}

export function getResolution(periodDays: PeriodDays): Resolution {
	return periodDays <= 30 ? 'day' : 'week';
}

/** ISO-vecka, måndag som första dag. Ger nycklar som "2026-W31". */
export function getIsoWeekKey(date: Date): string {
	const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	// Torsdagen i samma vecka avgör vilket år veckan tillhör.
	const dayOfWeek = (target.getDay() + 6) % 7;
	target.setDate(target.getDate() - dayOfWeek + 3);
	const isoYear = target.getFullYear();
	const firstThursday = new Date(isoYear, 0, 4);
	const firstDayOfWeek = (firstThursday.getDay() + 6) % 7;
	firstThursday.setDate(firstThursday.getDate() - firstDayOfWeek + 3);
	const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
	return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function roundToOneDecimal(value: number): number {
	return Math.round(value * 10) / 10;
}

export function aggregateSamples(samples: MoodSample[], resolution: Resolution): ChartPoint[] {
	const buckets = new Map<string, { moods: number[]; firstDate: string }>();

	for (const sample of samples) {
		const date = toLocalDate(sample.date);
		if (!date) continue;
		const key = resolution === 'day' ? sample.date : getIsoWeekKey(date);
		const bucket = buckets.get(key);
		if (bucket) {
			bucket.moods.push(sample.mood);
			if (sample.date < bucket.firstDate) bucket.firstDate = sample.date;
		} else {
			buckets.set(key, { moods: [sample.mood], firstDate: sample.date });
		}
	}

	return [...buckets.entries()]
		.map(([key, bucket]) => {
			const average = bucket.moods.reduce((sum, mood) => sum + mood, 0) / bucket.moods.length;
			const date = toLocalDate(bucket.firstDate);
			const weekNumber = key.includes('-W') ? Number.parseInt(key.slice(key.indexOf('-W') + 2), 10) : null;
			const label =
				resolution === 'day' && date
					? dayLabelFormatter.format(date).replace('.', '')
					: weekNumber !== null
						? `v. ${weekNumber}`
						: key;
			const fullLabel =
				resolution === 'day' && date
					? fullDateFormatter.format(date)
					: weekNumber !== null && date
						? `Vecka ${weekNumber}, från ${fullDateFormatter.format(date)}`
						: key;
			return {
				key,
				label,
				fullLabel,
				value: roundToOneDecimal(average),
				count: bucket.moods.length,
				date: bucket.firstDate
			};
		})
		.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Geometrin räknas i ett fast viewBox-koordinatsystem. Alla värden är
 * garanterat ändliga: humörvärdena är klampade till 1-10 och x fördelas jämnt,
 * med mitten som specialfall för en ensam punkt.
 */
export function buildChartGeometry(
	points: ChartPoint[],
	options: { width?: number; height?: number; paddingX?: number; paddingY?: number } = {}
): ChartGeometry {
	const width = options.width ?? 640;
	const height = options.height ?? 200;
	const paddingX = options.paddingX ?? 12;
	const paddingY = options.paddingY ?? 16;
	const innerWidth = Math.max(1, width - paddingX * 2);
	const innerHeight = Math.max(1, height - paddingY * 2);

	const geometryPoints: ChartGeometryPoint[] = points.map((point, index) => {
		const ratio = points.length <= 1 ? 0.5 : index / (points.length - 1);
		const moodRatio = (clampMood(point.value) - 1) / 9;
		return {
			...point,
			x: roundToOneDecimal(paddingX + ratio * innerWidth),
			// y vänds: högre humör hamnar högre upp.
			y: roundToOneDecimal(paddingY + (1 - moodRatio) * innerHeight)
		};
	});

	return {
		line:
			geometryPoints.length >= 2
				? geometryPoints.map((point) => `${point.x},${point.y}`).join(' ')
				: '',
		points: geometryPoints,
		width,
		height
	};
}

/** Antal kalenderveckor med minst ett inlägg inom perioden. */
export function countActiveWeeks(
	heatmapData: Record<string, number> | null | undefined,
	periodDays: PeriodDays,
	now: Date = new Date()
): number {
	if (!heatmapData) return 0;
	const startKey = getPeriodStartKey(periodDays, now);
	const endKey = toDateKey(now);
	const weeks = new Set<string>();

	for (const [dateKey, count] of Object.entries(heatmapData)) {
		if (!DATE_PATTERN.test(dateKey)) continue;
		if (dateKey < startKey || dateKey > endKey) continue;
		if (!Number.isFinite(count) || count <= 0) continue;
		const date = toLocalDate(dateKey);
		if (!date) continue;
		weeks.add(getIsoWeekKey(date));
	}

	return weeks.size;
}

/**
 * Summerar befintliga heatmapdata för den valda perioden. Värdena tolkas
 * enbart som antal sparade dagboksrader; ingen text eller känsloinnehåll
 * analyseras här.
 */
export function buildPeriodActivity(
	heatmapData: Record<string, number> | null | undefined,
	periodDays: PeriodDays,
	now: Date = new Date()
): PeriodActivity {
	if (!heatmapData) {
		return { entryCount: 0, activeDays: 0, activeWeeks: 0, longestActiveStreak: 0 };
	}

	const startKey = getPeriodStartKey(periodDays, now);
	const endKey = toDateKey(now);
	const activeDateKeys = Object.entries(heatmapData)
		.filter(([date, count]) =>
			DATE_PATTERN.test(date) && date >= startKey && date <= endKey && Number.isFinite(count) && count > 0
		)
		.map(([date]) => date)
		.sort();
	const entryCount = activeDateKeys.reduce((sum, date) => sum + (heatmapData[date] ?? 0), 0);
	let longestActiveStreak = 0;
	let currentStreak = 0;
	let previousDate: Date | null = null;

	for (const dateKey of activeDateKeys) {
		const currentDate = toLocalDate(dateKey);
		if (!currentDate) continue;
		const expectedNextDate = previousDate ? new Date(previousDate) : null;
		if (expectedNextDate) expectedNextDate.setDate(expectedNextDate.getDate() + 1);
		currentStreak = expectedNextDate && toDateKey(expectedNextDate) === dateKey ? currentStreak + 1 : 1;
		longestActiveStreak = Math.max(longestActiveStreak, currentStreak);
		previousDate = currentDate;
	}

	return {
		entryCount,
		activeDays: activeDateKeys.length,
		activeWeeks: countActiveWeeks(heatmapData, periodDays, now),
		longestActiveStreak
	};
}

/** Genomsnittlig absolut avvikelse från medelvärdet. Tåligare än varians för små underlag. */
function meanAbsoluteDeviation(values: number[]): number | null {
	if (values.length < 2) return null;
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	const deviation = values.reduce((sum, value) => sum + Math.abs(value - mean), 0) / values.length;
	return deviation;
}

export interface SteadinessResult {
	/** Sant bara när båda fönstren har tillräckligt underlag. */
	hasComparison: boolean;
	direction: 'steadier' | 'more-varied' | 'unchanged' | 'insufficient';
	text: string;
	recentCount: number;
	previousCount: number;
}

/**
 * Jämför spridningen i de senaste 14 dagarna med de 14 dagarna dessförinnan.
 * Kräver MIN_POINTS_PER_WINDOW punkter i vardera fönstret och en skillnad över
 * STEADINESS_DELTA_THRESHOLD innan någon riktning får nämnas.
 */
export function buildSteadinessObservation(
	samples: MoodSample[],
	now: Date = new Date()
): SteadinessResult {
	const recentStart = toDateKey(new Date(now.getTime() - (STEADINESS_WINDOW_DAYS - 1) * DAY_MS));
	const previousStart = toDateKey(new Date(now.getTime() - (STEADINESS_WINDOW_DAYS * 2 - 1) * DAY_MS));
	const endKey = toDateKey(now);

	const recent = samples.filter((sample) => sample.date >= recentStart && sample.date <= endKey);
	const previous = samples.filter((sample) => sample.date >= previousStart && sample.date < recentStart);

	if (recent.length < MIN_POINTS_PER_WINDOW || previous.length < MIN_POINTS_PER_WINDOW) {
		return {
			hasComparison: false,
			direction: 'insufficient',
			text: NEUTRAL_OBSERVATION_COPY,
			recentCount: recent.length,
			previousCount: previous.length
		};
	}

	const recentSpread = meanAbsoluteDeviation(recent.map((sample) => sample.mood));
	const previousSpread = meanAbsoluteDeviation(previous.map((sample) => sample.mood));

	if (recentSpread === null || previousSpread === null) {
		return {
			hasComparison: false,
			direction: 'insufficient',
			text: NEUTRAL_OBSERVATION_COPY,
			recentCount: recent.length,
			previousCount: previous.length
		};
	}

	const delta = previousSpread - recentSpread;

	if (delta >= STEADINESS_DELTA_THRESHOLD) {
		return {
			hasComparison: true,
			direction: 'steadier',
			text: 'Något jämnare de senaste två veckorna än de två veckorna innan.',
			recentCount: recent.length,
			previousCount: previous.length
		};
	}

	if (delta <= -STEADINESS_DELTA_THRESHOLD) {
		return {
			hasComparison: true,
			direction: 'more-varied',
			text: 'Något mer växlande de senaste två veckorna än de två veckorna innan.',
			recentCount: recent.length,
			previousCount: previous.length
		};
	}

	return {
		hasComparison: true,
		direction: 'unchanged',
		text: 'Ungefär lika jämnt de senaste två veckorna som de två veckorna innan.',
		recentCount: recent.length,
		previousCount: previous.length
	};
}

/**
 * Teman kommer från narrative.themes, som redan beräknas deterministiskt
 * serversidan. Utan samtycke hämtas insikterna aldrig, och då finns inget tema
 * att visa.
 */
export function buildThemeObservation(
	themes: ThemeLike[] | null | undefined,
	hasConsent: boolean
): Observation | null {
	if (!hasConsent || !Array.isArray(themes) || themes.length === 0) return null;
	const [topTheme] = [...themes]
		.filter((theme) => typeof theme?.label === 'string' && theme.label.trim().length > 0)
		.filter((theme) => Number.isFinite(theme?.count) && theme.count >= MIN_THEME_COUNT)
		.sort((a, b) => b.count - a.count);
	if (!topTheme) return null;

	return {
		id: 'theme',
		label: 'Återkommande tema',
		text: `${topTheme.label} nämns i ${topTheme.count} reflektioner.`
	};
}

/**
 * Ren räkning, ingen tolkning. Sammanfattningen under grafen bär jämförelsen,
 * så den här observationen beskriver bara underlaget den vilar på.
 */
export function buildMoodObservation(samples: MoodSample[]): Observation | null {
	if (samples.length === 0) return null;
	const moods = samples.map((item) => item.mood);
	const lowest = Math.min(...moods);
	const highest = Math.max(...moods);
	const noun = samples.length === 1 ? 'humörnotering' : 'humörnoteringar';
	return {
		id: 'mood',
		label: 'Mående',
		text:
			lowest === highest
				? `${samples.length} ${noun}, alla på ${lowest}.`
				: `${samples.length} ${noun}, mellan ${lowest} och ${highest} på skalan.`
	};
}

function buildReturnObservation(activeWeeks: number, periodDays: PeriodDays): Observation {
	const periodLabel = getPeriodLongLabel(periodDays);
	if (activeWeeks === 0) {
		return {
			id: 'return',
			label: 'Återkomst',
			text: `Inga skrivna dagar ${periodLabel}.`
		};
	}
	return {
		id: 'return',
		label: 'Återkomst',
		text: `Aktiv under ${activeWeeks} ${activeWeeks === 1 ? 'vecka' : 'olika veckor'} ${periodLabel}.`
	};
}

function buildTextAlternative(points: ChartPoint[], periodDays: PeriodDays): string {
	const periodLabel = getPeriodLongLabel(periodDays);
	if (points.length === 0) {
		return `Ingen humörkurva ${periodLabel}. ${CHART_FALLBACK_COPY}`;
	}
	const values = points.map((point) => `${point.fullLabel}: ${point.value} av 10`).join('. ');
	return `Humör ${periodLabel}, ${points.length} ${points.length === 1 ? 'mätpunkt' : 'mätpunkter'} på en skala från 1 tungt till 10 ljusare. ${values}.`;
}

/**
 * Bygger hela vyn. Anropas från Framsteg med data som redan hämtats där, så
 * inget extra anrop sker här.
 */
export function buildRecentPeriodView(input: {
	samples: MoodSample[];
	heatmapData: Record<string, number> | null | undefined;
	themes: ThemeLike[] | null | undefined;
	hasConsent: boolean;
	periodDays: PeriodDays;
	now?: Date;
}): RecentPeriodView {
	const now = input.now ?? new Date();
	const periodSamples = filterByPeriod(input.samples, input.periodDays, now);
	const resolution = getResolution(input.periodDays);
	const hasChart = periodSamples.length >= MIN_MOOD_POINTS;
	const points = hasChart ? aggregateSamples(periodSamples, resolution) : [];
	const activeWeeks = countActiveWeeks(input.heatmapData, input.periodDays, now);
	const steadiness = buildSteadinessObservation(periodSamples, now);

	const observations: Observation[] = [];
	if (hasChart) {
		const moodObservation = buildMoodObservation(periodSamples);
		if (moodObservation) observations.push(moodObservation);
	}
	const themeObservation = buildThemeObservation(input.themes, input.hasConsent);
	if (themeObservation) observations.push(themeObservation);
	observations.push(buildReturnObservation(activeWeeks, input.periodDays));

	const summary = hasChart
		? steadiness.hasComparison
			? steadiness.text
			: NEUTRAL_OBSERVATION_COPY
		: CHART_FALLBACK_COPY;

	return {
		points,
		resolution,
		sampleCount: periodSamples.length,
		hasChart,
		summary,
		observations,
		textAlternative: buildTextAlternative(points, input.periodDays)
	};
}
