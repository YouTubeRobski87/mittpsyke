import { shiftDateKey, stockholmTodayKey, toStockholmDateKey } from '$lib/stockholm-date';
import { TOPICS, type DiaryInsightRow } from '$lib/server/diary-insight-analysis';

export type ProgressPeriodDays = 30 | 90 | 180;
export type AnalysisConfidence = 'strong' | 'moderate' | 'weak' | 'insufficient';
export type TrendDirection = 'clearly-higher' | 'somewhat-higher' | 'unchanged' | 'somewhat-lower' | 'clearly-lower' | 'insufficient';

export const MIN_TREND_SAMPLES_PER_SEGMENT = 4;
export const MIN_MONTH_SAMPLES = 4;
export const MIN_MONTH_ACTIVE_DAYS = 3;
export const MIN_THEME_COUNT = 3;
export const MIN_THEME_ASSOCIATION_DAYS = 4;
export const MIN_ASSOCIATION_COMPARISON_DAYS = 6;
export const MIN_WEEKDAY_SAMPLES = 5;
export const MEANINGFUL_MOOD_DIFFERENCE = 0.6;

type MoodRecord = { date: string; mood: number };
type TextRecord = { date: string; themes: string[] };

export type ProgressInsight = {

	id: string;
	category: 'development' | 'stability' | 'period' | 'recurring' | 'association' | 'recovery' | 'time' | 'positive';
	title: string;
	description: string;
	evidence: string;
	confidence: Exclude<AnalysisConfidence, 'insufficient'>;
	rank: number;
};

export type MoodSummary = {
	entryCount: number;
	activeDays: number;
	activeWeeks: number;
	mean: number | null;
	median: number | null;
	min: number | null;
	max: number | null;
	standardDeviation: number | null;
	lowShare: number | null;
	middleShare: number | null;
	highShare: number | null;
};

export type TrendAnalysis = {
	direction: TrendDirection;
	firstAverage: number | null;
	lastAverage: number | null;
	difference: number | null;
	confidence: AnalysisConfidence;
};

export type MonthlyMood = {
	month: string;
	label: string;
	entryCount: number;
	activeDays: number;
	mean: number;
	median: number;
	standardDeviation: number | null;
};

export type ThemeMoodAssociation = {
	theme: string;
	themeDays: number;
	comparisonDays: number;
	themeAverage: number;
	baselineAverage: number;
	difference: number;
	direction: 'higher' | 'lower';
	confidence: Exclude<AnalysisConfidence, 'insufficient'>;
};

export type ProgressAnalysis = {
	periodDays: ProgressPeriodDays;
	periodLabel: string;
	coverage: { firstDate: string | null; latestDate: string | null; textEntryCount: number; activeDays: number; activeWeeks: number };
	moodSummary: MoodSummary;
	trend: TrendAnalysis;
	variability: { direction: 'steadier' | 'more-varied' | 'unchanged' | 'insufficient'; first: number | null; last: number | null; confidence: AnalysisConfidence };
	recentComparison: { difference: number | null; recentCount: number; previousCount: number; confidence: AnalysisConfidence };
	monthly: MonthlyMood[];
	periods: { best: { start: string; end: string; mean: number; count: number } | null; worst: { start: string; end: string; mean: number; count: number } | null };
	themes: { label: string; count: number; firstHalfCount: number; secondHalfCount: number }[];
	themeMoodAssociations: ThemeMoodAssociation[];
	recovery: { lowCount: number; followedCount: number; recoveredCount: number; confidence: AnalysisConfidence };
	weekdayPattern: { weekday: string; difference: number; count: number; confidence: Exclude<AnalysisConfidence, 'insufficient'> } | null;
	insights: ProgressInsight[];
	halfYearSummary: ProgressInsight[];
};

const DAY_MS = 86_400_000;
const WEEKDAY_NAMES = ['söndagar', 'måndagar', 'tisdagar', 'onsdagar', 'torsdagar', 'fredagar', 'lördagar'];

function clampMood(value: unknown): number | null {
	const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value.replace(',', '.')) : Number.NaN;
	return Number.isFinite(numeric) ? Math.min(10, Math.max(1, numeric)) : null;
}

function periodLabel(days: ProgressPeriodDays): string {
	return days === 30 ? 'den senaste månaden' : days === 90 ? 'de senaste tre månaderna' : 'det senaste halvåret';
}

function format(value: number): string { return value.toFixed(1).replace('.', ','); }
function average(values: number[]): number | null { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function median(values: number[]): number | null {
	if (!values.length) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
function standardDeviation(values: number[]): number | null {
	if (values.length < 2) return null;
	const mean = average(values)!;
	return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}
function isoWeek(date: string): string {
	const [year, month, day] = date.split('-').map(Number);
	const current = new Date(Date.UTC(year, month - 1, day));
	const weekday = current.getUTCDay() || 7;
	current.setUTCDate(current.getUTCDate() + 4 - weekday);
	const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
	return `${current.getUTCFullYear()}-W${String(Math.ceil((((current.getTime() - yearStart.getTime()) / DAY_MS) + 1) / 7)).padStart(2, '0')}`;
}
function weekday(date: string): number {
	const [year, month, day] = date.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
function monthLabel(month: string): string { return new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00Z`)); }
function dateLabel(date: string): string { return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00Z`)); }
function confidence(count: number, difference: number): Exclude<AnalysisConfidence, 'insufficient'> {
	return count >= 8 && Math.abs(difference) >= 1 ? 'strong' : 'moderate';
}

/** Only exact, known tag labels supplement the existing conservative keyword themes. */
function detectThemes(text: string, tags: string[] | null | undefined): string[] {
	const normalizedText = text.toLocaleLowerCase('sv-SE');
	const normalizedTags = new Set((tags ?? []).filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim().toLocaleLowerCase('sv-SE')));
	return TOPICS.filter((topic) => {
		const label = topic.label.toLocaleLowerCase('sv-SE');
		return topic.keywords.some((keyword) => normalizedText.includes(keyword)) || normalizedTags.has(label);
	}).map((topic) => topic.label);
}

export function filterProgressRows(rows: DiaryInsightRow[], periodDays: ProgressPeriodDays, now: Date = new Date()): DiaryInsightRow[] {
	const start = shiftDateKey(stockholmTodayKey(now), -(periodDays - 1));
	const end = stockholmTodayKey(now);
	return rows.filter((row) => {
		const date = toStockholmDateKey(row.created_at);
		return date !== null && date >= start && date <= end;
	});
}

function prepare(rows: DiaryInsightRow[]) {
	const moods: MoodRecord[] = [];
	const texts: TextRecord[] = [];
	const activeDays = new Set<string>();
	for (const row of rows) {
		const date = toStockholmDateKey(row.created_at);
		if (!date) continue;
		activeDays.add(date);
		const mood = clampMood(row.mood);
		if (mood !== null) moods.push({ date, mood });
		const text = typeof row.text === 'string' ? row.text.trim() : '';
		if (text) texts.push({ date, themes: detectThemes(text, row.tags) });
	}
	return { moods: moods.sort((a, b) => a.date.localeCompare(b.date)), texts: texts.sort((a, b) => a.date.localeCompare(b.date)), activeDays };
}

function trendFrom(moods: MoodRecord[]): TrendAnalysis {
	const segmentSize = Math.floor(moods.length * 0.25);
	if (segmentSize < MIN_TREND_SAMPLES_PER_SEGMENT) return { direction: 'insufficient', firstAverage: null, lastAverage: null, difference: null, confidence: 'insufficient' };
	const firstAverage = average(moods.slice(0, segmentSize).map((item) => item.mood))!;
	const lastAverage = average(moods.slice(-segmentSize).map((item) => item.mood))!;
	const difference = lastAverage - firstAverage;
	const direction: TrendDirection = difference >= 0.9 ? 'clearly-higher' : difference >= 0.35 ? 'somewhat-higher' : difference <= -0.9 ? 'clearly-lower' : difference <= -0.35 ? 'somewhat-lower' : 'unchanged';
	return { direction, firstAverage, lastAverage, difference, confidence: confidence(segmentSize, difference) };
}

function variabilityFrom(moods: MoodRecord[]) {
	const segmentSize = Math.floor(moods.length * 0.25);
	if (segmentSize < MIN_TREND_SAMPLES_PER_SEGMENT) return { direction: 'insufficient' as const, first: null, last: null, confidence: 'insufficient' as const };
	const first = standardDeviation(moods.slice(0, segmentSize).map((item) => item.mood));
	const last = standardDeviation(moods.slice(-segmentSize).map((item) => item.mood));
	if (first === null || last === null) return { direction: 'insufficient' as const, first, last, confidence: 'insufficient' as const };
	const difference = last - first;
	return { direction: difference >= 0.45 ? 'more-varied' as const : difference <= -0.45 ? 'steadier' as const : 'unchanged' as const, first, last, confidence: confidence(segmentSize, difference) };
}

function findNotablePeriods(moods: MoodRecord[]) {
	const windows = moods.map((anchor) => {
		const end = shiftDateKey(anchor.date, 13);
		const samples = moods.filter((item) => item.date >= anchor.date && item.date <= end);
		return samples.length >= 4
			? { start: anchor.date, end, mean: average(samples.map((item) => item.mood))!, count: samples.length }
			: null;
	}).filter((window): window is { start: string; end: string; mean: number; count: number } => window !== null);
	if (!windows.length) return { best: null, worst: null };
	return {
		best: [...windows].sort((a, b) => b.mean - a.mean)[0] ?? null,
		worst: [...windows].sort((a, b) => a.mean - b.mean)[0] ?? null
	};
}

function insight(id: string, category: ProgressInsight['category'], title: string, description: string, evidence: string, count: number, difference: number, rank: number): ProgressInsight {
	return { id, category, title, description, evidence, confidence: confidence(count, difference), rank };
}

export function buildProgressAnalysis(rows: DiaryInsightRow[], periodDays: ProgressPeriodDays, now: Date = new Date()): ProgressAnalysis {
	const filtered = filterProgressRows(rows, periodDays, now);
	const { moods, texts, activeDays } = prepare(filtered);
	const values = moods.map((item) => item.mood);
	const moodDays = new Set(moods.map((item) => item.date));
	const weeks = new Set([...activeDays].map(isoWeek));
	const mean = average(values);
	const trend = trendFrom(moods);
	const variability = variabilityFrom(moods);
	const insights: ProgressInsight[] = [];
	const activeDateKeys = [...activeDays].sort();
	const coverage = { firstDate: activeDateKeys[0] ? dateLabel(activeDateKeys[0]) : null, latestDate: activeDateKeys.at(-1) ? dateLabel(activeDateKeys.at(-1)!) : null, textEntryCount: texts.length, activeDays: activeDays.size, activeWeeks: weeks.size };
	const moodSummary: MoodSummary = {
		entryCount: moods.length, activeDays: moodDays.size, activeWeeks: new Set([...moodDays].map(isoWeek)).size,
		mean, median: median(values), min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null,
		standardDeviation: standardDeviation(values),
		lowShare: values.length ? values.filter((value) => value <= 4).length / values.length : null,
		middleShare: values.length ? values.filter((value) => value > 4 && value < 7).length / values.length : null,
		highShare: values.length ? values.filter((value) => value >= 7).length / values.length : null
	};
	const periods = findNotablePeriods(moods);

	if (trend.direction !== 'insufficient') {
		const directionCopy: Record<Exclude<TrendDirection, 'insufficient'>, string> = {
			'clearly-higher': 'tydligt högre', 'somewhat-higher': 'något högre', unchanged: 'ungefär på samma nivå', 'somewhat-lower': 'något lägre', 'clearly-lower': 'tydligt lägre'
		};
		const title = trend.direction === 'unchanged' ? 'Ingen tydlig långsiktig riktning' : `Senare delen ligger ${directionCopy[trend.direction]}`;
		const description = trend.direction === 'unchanged'
			? `Måendet har varierat, men början och slutet av ${periodLabel(periodDays)} ligger ungefär på samma nivå.`
			: `Den senare delen av ${periodLabel(periodDays)} ligger ${directionCopy[trend.direction]} än början i dina registreringar.`;
		insights.push(insight('trend', 'development', title, description, `Jämförelsen bygger på de första och sista ${Math.floor(moods.length * 0.25)} registreringarna: ${format(trend.firstAverage!)} respektive ${format(trend.lastAverage!)} av 10.`, Math.floor(moods.length * 0.25), trend.difference!, trend.direction === 'unchanged' ? 84 : 100));
	}

	if (variability.direction !== 'insufficient' && variability.direction !== 'unchanged') {
		const steadier = variability.direction === 'steadier';
		insights.push(insight('variability', 'stability', steadier ? 'Registreringarna har blivit jämnare' : 'Registreringarna har blivit mer växlande', steadier ? 'Den senare delen av perioden ligger närmare sin egen nivå än början.' : 'Den senare delen av perioden svänger mer runt sin egen nivå än början.', `Spridningen i början är ${format(variability.first!)} och i slutet ${format(variability.last!)} på skalan.`, Math.floor(moods.length * 0.25), variability.last! - variability.first!, steadier ? 88 : 90));
	}

	const today = stockholmTodayKey(now);
	const recentStart = shiftDateKey(today, -13);
	const previousStart = shiftDateKey(today, -27);
	const recent = moods.filter((item) => item.date >= recentStart);
	const previous = moods.filter((item) => item.date >= previousStart && item.date < recentStart);
	const recentDifference = recent.length >= 4 && previous.length >= 4 ? average(recent.map((item) => item.mood))! - average(previous.map((item) => item.mood))! : null;
	const recentComparison = { difference: recentDifference, recentCount: recent.length, previousCount: previous.length, confidence: recentDifference === null ? 'insufficient' as const : confidence(Math.min(recent.length, previous.length), recentDifference) };
	if (periodDays === 30 && recentDifference !== null && Math.abs(recentDifference) >= MEANINGFUL_MOOD_DIFFERENCE) {
		const higher = recentDifference > 0;
		insights.push(insight('recent', 'development', higher ? 'De senaste två veckorna ligger högre' : 'De senaste två veckorna ligger lägre', higher ? 'Dina senaste registreringar ligger högre på skalan än de två veckorna före.' : 'Dina senaste registreringar ligger lägre på skalan än de två veckorna före.', `${recent.length} registreringar de senaste 14 dagarna har snitt ${format(average(recent.map((item) => item.mood))!)}, jämfört med ${previous.length} registreringar och ${format(average(previous.map((item) => item.mood))!)} före.`, Math.min(recent.length, previous.length), recentDifference, 98));
	}
	if (periodDays >= 90 && periods.best && periods.worst && periods.best.mean - periods.worst.mean >= MEANINGFUL_MOOD_DIFFERENCE) {
		const better = periods.best;
		const heavier = periods.worst;
		insights.push(insight('notable-period', 'period', 'Tydligare högre och lägre delar syns', `En tvåveckorsdel från ${dateLabel(better.start)} till ${dateLabel(better.end)} ligger högre än den tyngsta jämförbara delen av perioden.`, `Den högre delen bygger på ${better.count} registreringar med snitt ${format(better.mean)}, jämfört med ${format(heavier.mean)} i delen ${dateLabel(heavier.start)} till ${dateLabel(heavier.end)}.`, Math.min(better.count, heavier.count), better.mean - heavier.mean, 87));
	}

	const monthGroups = new Map<string, MoodRecord[]>();
	for (const mood of moods) monthGroups.set(mood.date.slice(0, 7), [...(monthGroups.get(mood.date.slice(0, 7)) ?? []), mood]);
	const monthly = periodDays === 180 ? [...monthGroups.entries()].map(([month, samples]) => ({ month, label: monthLabel(month), entryCount: samples.length, activeDays: new Set(samples.map((item) => item.date)).size, mean: average(samples.map((item) => item.mood))!, median: median(samples.map((item) => item.mood))!, standardDeviation: standardDeviation(samples.map((item) => item.mood)) })).filter((month) => month.entryCount >= MIN_MONTH_SAMPLES && month.activeDays >= MIN_MONTH_ACTIVE_DAYS).sort((a, b) => a.month.localeCompare(b.month)) : [];
	if (monthly.length >= 3) {
		const highest = [...monthly].sort((a, b) => b.mean - a.mean)[0];
		const lowest = [...monthly].sort((a, b) => a.mean - b.mean)[0];
		if (highest.mean - lowest.mean >= MEANINGFUL_MOOD_DIFFERENCE) insights.push(insight('months', 'period', `${highest.label[0].toLocaleUpperCase('sv-SE')}${highest.label.slice(1)} låg högst`, `${highest.label[0].toLocaleUpperCase('sv-SE')}${highest.label.slice(1)} har periodens högsta registrerade måendenivå bland månader med tillräckligt underlag.`, `${highest.entryCount} registreringar gav snitt ${format(highest.mean)}, jämfört med ${format(lowest.mean)} i ${lowest.label}.`, Math.min(highest.entryCount, lowest.entryCount), highest.mean - lowest.mean, 92));
		const variable = monthly.filter((month) => month.standardDeviation !== null).sort((a, b) => (b.standardDeviation ?? 0) - (a.standardDeviation ?? 0));
		if (variable.length >= 2 && (variable[0].standardDeviation ?? 0) - (variable[1].standardDeviation ?? 0) >= 0.45) insights.push(insight('month-variation', 'stability', `${variable[0].label[0].toLocaleUpperCase('sv-SE')}${variable[0].label.slice(1)} varierade mest`, 'Den månaden hade större spridning mellan registreringarna än övriga månader med tillräckligt underlag.', `${variable[0].entryCount} registreringar har spridning ${format(variable[0].standardDeviation!)}, jämfört med ${format(variable[1].standardDeviation!)} i nästa mest varierande månad.`, variable[0].entryCount, (variable[0].standardDeviation ?? 0) - (variable[1].standardDeviation ?? 0), 78));
	}

	const textThemeCounts = new Map<string, { count: number; first: number; second: number }>();
	const splitDate = shiftDateKey(stockholmTodayKey(now), -Math.floor(periodDays / 2));
	for (const text of texts) for (const theme of text.themes) {
		const current = textThemeCounts.get(theme) ?? { count: 0, first: 0, second: 0 };
		current.count += 1;
		if (text.date < splitDate) current.first += 1; else current.second += 1;
		textThemeCounts.set(theme, current);
	}
	const themes = [...textThemeCounts.entries()].filter(([, value]) => value.count >= MIN_THEME_COUNT).sort((a, b) => b[1].count - a[1].count).map(([label, value]) => ({ label, count: value.count, firstHalfCount: value.first, secondHalfCount: value.second }));
	if (themes[0]) insights.push(insight('theme', 'recurring', `${themes[0].label} återkommer i dina texter`, `Temat finns i ${themes[0].count} av dina sparade texter ${periodLabel(periodDays)}.`, `${themes[0].label} förekommer i ${themes[0].firstHalfCount} texter i början och ${themes[0].secondHalfCount} senare i perioden.`, themes[0].count, themes[0].count / Math.max(texts.length, 1), 82));
	if (periodDays >= 90) for (const theme of themes) {
		const firstTotal = texts.filter((item) => item.date < splitDate).length;
		const secondTotal = texts.length - firstTotal;
		if (theme.firstHalfCount < 2 || theme.secondHalfCount < 2 || firstTotal === 0 || secondTotal === 0) continue;
		const difference = theme.secondHalfCount / secondTotal - theme.firstHalfCount / firstTotal;
		if (Math.abs(difference) >= 0.15) insights.push(insight(`theme-change:${theme.label}`, difference > 0 ? 'recurring' : 'positive', difference > 0 ? `${theme.label} tar mer plats senare` : `${theme.label} tar mindre plats senare`, difference > 0 ? `Temat förekommer oftare i den senare delen av ${periodLabel(periodDays)}.` : `Temat förekommer mer sällan i den senare delen av ${periodLabel(periodDays)}.`, `${theme.secondHalfCount} av ${secondTotal} texter senare i perioden jämfört med ${theme.firstHalfCount} av ${firstTotal} i början.`, Math.min(theme.firstHalfCount, theme.secondHalfCount), difference, 74));
	}

	const moodsByDay = new Map<string, number[]>();
	for (const mood of moods) moodsByDay.set(mood.date, [...(moodsByDay.get(mood.date) ?? []), mood.mood]);
	const themeDays = new Map<string, Set<string>>();
	for (const text of texts) for (const theme of text.themes) { const days = themeDays.get(theme) ?? new Set<string>(); days.add(text.date); themeDays.set(theme, days); }
	const associations: ThemeMoodAssociation[] = [];
	for (const [theme, days] of themeDays) {
		const matchingDates = [...days].filter((date) => moodsByDay.has(date));
		const withTheme = matchingDates.map((date) => average(moodsByDay.get(date)!)!);
		const withoutTheme = [...moodsByDay.entries()].filter(([date]) => !days.has(date)).map(([, dayMoods]) => average(dayMoods)!);
		if (matchingDates.length < MIN_THEME_ASSOCIATION_DAYS || withoutTheme.length < MIN_ASSOCIATION_COMPARISON_DAYS) continue;
		const themeAverage = average(withTheme); const baselineAverage = average(withoutTheme);
		if (themeAverage === null || baselineAverage === null) continue;
		const difference = themeAverage - baselineAverage;
		if (Math.abs(difference) < MEANINGFUL_MOOD_DIFFERENCE) continue;
		associations.push({ theme, themeDays: matchingDates.length, comparisonDays: withoutTheme.length, themeAverage, baselineAverage, difference, direction: difference > 0 ? 'higher' : 'lower', confidence: confidence(matchingDates.length, difference) });
	}
	associations.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
	for (const association of associations.slice(0, 2)) {
		const higher = association.direction === 'higher';
		insights.push(insight(`association:${association.theme}`, higher ? 'positive' : 'association', `${association.theme} sammanfaller med ${higher ? 'högre' : 'lägre'} registreringar`, `När ${association.theme.toLocaleLowerCase('sv-SE')} finns i dina texter ligger registreringarna ofta ${higher ? 'högre' : 'lägre'} än i övriga dagar med mående.`, `${association.theme} förekommer på ${association.themeDays} dagar med mående: snitt ${format(association.themeAverage)} jämfört med ${format(association.baselineAverage)} på ${association.comparisonDays} andra dagar. Det visar ett samband, inte vad som orsakar skillnaden.`, association.themeDays, association.difference, higher ? 86 : 89));
	}

	const recoveryBaseline = mean;
	const lowThreshold = recoveryBaseline === null ? null : Math.min(recoveryBaseline - 1, median(values) ?? recoveryBaseline);
	let lowCount = 0; let followedCount = 0; let recoveredCount = 0;
	if (lowThreshold !== null && moods.length >= 8) for (let index = 0; index < moods.length - 1; index += 1) {
		if (moods[index].mood > lowThreshold) continue;
		lowCount += 1;
		const next = moods.slice(index + 1).find((candidate) => candidate.date > moods[index].date);
		if (!next) continue;
		const days = Math.round((Date.parse(`${next.date}T12:00:00Z`) - Date.parse(`${moods[index].date}T12:00:00Z`)) / DAY_MS);
		if (days > 7) continue;
		followedCount += 1;
		if (next.mood >= recoveryBaseline! - 0.25) recoveredCount += 1;
	}
	const recoveryConfidence: AnalysisConfidence = followedCount >= 4 ? confidence(followedCount, recoveredCount / followedCount) : 'insufficient';
	const recovery = { lowCount, followedCount, recoveredCount, confidence: recoveryConfidence };
	if (followedCount >= 4 && recoveredCount / followedCount >= 0.65) insights.push(insight('recovery', 'recovery', 'Lägre registreringar rör sig ofta tillbaka', 'Efter lägre registreringar har nästa registrering ofta rört sig tillbaka mot din vanliga nivå inom några dagar.', `${recoveredCount} av ${followedCount} lägre registreringar med en ny registrering inom sju dagar följdes av ett värde nära periodens snitt.`, followedCount, recoveredCount / followedCount, 76));

	let weekdayPattern: ProgressAnalysis['weekdayPattern'] = null;
	if (mean !== null) {
		const byWeekday = new Map<number, number[]>();
		for (const mood of moods) byWeekday.set(weekday(mood.date), [...(byWeekday.get(weekday(mood.date)) ?? []), mood.mood]);
		const overallMedian = median(values) ?? mean;
		const candidates = [...byWeekday.entries()].filter(([, values]) => values.length >= MIN_WEEKDAY_SAMPLES).map(([day, dayValues]) => ({ day, values: dayValues, difference: average(dayValues)! - mean, medianDifference: (median(dayValues) ?? mean) - overallMedian })).filter((item) => Math.abs(item.difference) >= 0.75 && Math.abs(item.medianDifference) >= 0.6).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
		if (candidates[0]) { const candidate = candidates[0]; weekdayPattern = { weekday: WEEKDAY_NAMES[candidate.day], difference: candidate.difference, count: candidate.values.length, confidence: confidence(candidate.values.length, candidate.difference) }; insights.push(insight('weekday', 'time', `Dina ${weekdayPattern.weekday} sticker ut`, `Registreringarna på ${weekdayPattern.weekday} ligger ${candidate.difference > 0 ? 'något högre' : 'något lägre'} än ditt genomsnitt under perioden.`, `${candidate.values.length} registreringar på ${weekdayPattern.weekday} har snitt ${format(average(candidate.values)!)}, jämfört med ${format(mean)} för hela perioden.`, candidate.values.length, candidate.difference, 70)); }
	}

	const ranked = insights.sort((a, b) => b.rank - a.rank || (a.confidence === 'strong' ? -1 : 1)).filter((item, index, all) => all.findIndex((other) => other.category === item.category) === index).slice(0, periodDays === 30 ? 3 : periodDays === 90 ? 4 : 5);
	return { periodDays, periodLabel: periodLabel(periodDays), coverage, moodSummary, trend, variability, recentComparison, monthly, periods, themes, themeMoodAssociations: associations, recovery, weekdayPattern, insights: ranked, halfYearSummary: periodDays === 180 ? ranked.slice(0, 5) : [] };
}
