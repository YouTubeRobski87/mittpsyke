// Bygger underlaget för sektionen "Kanske värt att prova" på Framsteg.
//
// Regel för hela modulen: ett förslag får bara skapas när det finns ett
// verkligt underlag i användarens egen historik. Ingen låtsaspersonalisering,
// inga generiska självhjälpsråd, ingen språkmodell. Copyn är fast och ligger i
// $lib/progress-support; här räknas bara fram vilket förslag som har täckning.
//
// Sambanden hämtas från buildTopicMoodAssociations, samma källa som
// "Vad verkar hjälpa?". Ett förslag kan därför aldrig vila på ett svagare
// underlag än den observation användaren redan ser längre upp på sidan.

import { containsAcuteCrisisPhrase, containsThirdPartyRiskPhrase } from '$lib/ai/crisis-keywords';
import {
	MOOD_ASSOCIATION_THRESHOLD,
	TOPICS,
	buildTopicMoodAssociations,
	formatDate,
	prepareEntries,
	type DiaryInsightRow,
	type PreparedEntry
} from '$lib/server/diary-insight-analysis';
import {
	buildSupportCopy,
	EMPTY_SUPPORT_VIEW,
	type SupportExample,
	type SupportSuggestion,
	type SupportSuggestionKind,
	type SupportTone,
	type SupportView
} from '$lib/progress-support';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Under så här många texter finns inget att personalisera på. */
const MIN_ENTRIES_FOR_SUPPORT = 8;

/** Fönstret som avgör om den senaste tiden ska räknas som tyngre. */
const HEAVY_WINDOW_DAYS = 14;
const MIN_HEAVY_WINDOW_SAMPLES = 3;
const HEAVY_AVERAGE_THRESHOLD = 4.5;

/** En text räknas som låg vid det här värdet eller lägre. */
const LOW_MOOD_LEVEL = 4;

/** Så många belastningsteman i samma text innan den räknas som "flera samtidigt". */
const MIN_LOAD_TOPICS_PER_ENTRY = 2;
const MIN_MULTI_LOAD_ENTRIES = 2;

/** Skrivförslaget kräver flera korta rader som faktiskt bär ett humörvärde. */
const SHORT_ENTRY_WORDS = 40;
const MIN_SHORT_ENTRIES_WITH_MOOD = 4;

/** Ett exempel visas bara från en dag som låg högre än snittet för temat. */
const MIN_EXAMPLE_MOOD = 6;
const MAX_EXAMPLES_PER_TOPIC = 4;
const MAX_QUOTE_LENGTH = 160;
const MIN_QUOTE_LENGTH = 20;

/** Säkerhetsfönstret. Krisord i den här delen av historiken stänger av förslagen. */
const SAFETY_WINDOW_DAYS = 14;
const SAFETY_RECENT_ENTRIES = 3;

/** Teman som räknas som belastning när de förekommer samtidigt. */
const LOAD_TOPICS = ['Stress', 'Oro', 'Sömn', 'Ekonomi', 'Konflikter', 'Ensamhet', 'Arbete'];

/**
 * Bara teman i den här kartan kan bli förslag. Ett tema utan vardaglig,
 * liten motsvarighet får stanna som observation.
 */
const TOPIC_SUGGESTION_KINDS: Record<string, SupportSuggestionKind> = {
	Motion: 'walk',
	Natur: 'walk',
	'Social kontakt': 'contact',
	Relationer: 'contact',
	Barnen: 'contact',
	Återhämtning: 'rest',
	Kreativitet: 'creative'
};

function average(values: number[]): number | null {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatMood(value: number): string {
	return value.toFixed(1).replace('.', ',');
}

/**
 * Tyngre period mäts på de senaste två veckorna. Utan tillräckligt många
 * registreringar i fönstret räknas perioden aldrig som tyngre — då vore
 * bedömningen en gissning på en enstaka dag.
 */
export function isHeavyPeriod(entries: PreparedEntry[], now: Date): boolean {
	const windowStart = now.getTime() - HEAVY_WINDOW_DAYS * DAY_MS;
	const recent = entries.filter((entry) => entry.date.getTime() >= windowStart && entry.mood !== null);
	if (recent.length < MIN_HEAVY_WINDOW_SAMPLES) return false;
	const recentAverage = average(recent.map((entry) => entry.mood as number));
	return recentAverage !== null && recentAverage <= HEAVY_AVERAGE_THRESHOLD;
}

/**
 * Säkerhetsspärren. Vardagsförslag ska aldrig möta ett akut läge, så när
 * krisord finns i de senaste texterna byggs inga förslag alls. Den här
 * kontrollen ersätter ingenting i chattens auktoritativa flöde; den avgör bara
 * om den här sektionen får visas.
 */
export function hasRecentRiskSignal(entries: PreparedEntry[], now: Date): boolean {
	const windowStart = now.getTime() - SAFETY_WINDOW_DAYS * DAY_MS;
	const recent = entries.filter((entry) => entry.date.getTime() >= windowStart);
	const latest = entries.slice(-SAFETY_RECENT_ENTRIES);
	const candidates = new Set([...recent, ...latest]);
	for (const entry of candidates) {
		if (containsAcuteCrisisPhrase(entry.text) || containsThirdPartyRiskPhrase(entry.text)) return true;
	}
	return false;
}

/** Ett citat får aldrig bära krisinnehåll vidare till en förslagsruta. */
function isQuoteSafe(sentence: string): boolean {
	return !containsAcuteCrisisPhrase(sentence) && !containsThirdPartyRiskPhrase(sentence);
}

function findTopicKeywords(topicLabel: string, topics: { label: string; keywords: string[] }[]): string[] {
	return topics.find((topic) => topic.label === topicLabel)?.keywords ?? [];
}

/**
 * Plockar den mening där temat faktiskt nämns. Returnerar null när meningen är
 * för kort, för lång att korta ned snyggt, eller innehåller krisinnehåll — då
 * visar gränssnittet den neutrala sammanfattningen i stället.
 */
export function extractTopicSentence(text: string, keywords: string[]): string | null {
	const sentences = text
		.split(/(?<=[.!?])\s+|\n+/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);
	const lowered = keywords.map((keyword) => keyword.toLowerCase());

	for (const sentence of sentences) {
		const normalized = sentence.toLowerCase();
		if (!lowered.some((keyword) => normalized.includes(keyword))) continue;
		if (sentence.length < MIN_QUOTE_LENGTH) continue;
		if (sentence.length > MAX_QUOTE_LENGTH) continue;
		if (!isQuoteSafe(sentence)) continue;
		return sentence;
	}

	return null;
}

function buildExamples(
	entries: PreparedEntry[],
	topicLabels: string[],
	topics: { label: string; keywords: string[] }[]
): SupportExample[] {
	const examples: SupportExample[] = [];

	for (const topicLabel of topicLabels) {
		const keywords = findTopicKeywords(topicLabel, topics);
		const candidates = entries
			.filter((entry) => entry.topicHits.has(topicLabel) && entry.mood !== null && entry.mood >= MIN_EXAMPLE_MOOD)
			.sort((first, second) => second.date.getTime() - first.date.getTime())
			.slice(0, MAX_EXAMPLES_PER_TOPIC);

		for (const entry of candidates) {
			const date = formatDate(entry.date) ?? '';
			examples.push({
				topicLabel,
				date,
				quote: extractTopicSentence(entry.text, keywords),
				summary: `${date} · humör ${formatMood(entry.mood as number)} av 10, en text som nämner ${topicLabel.toLocaleLowerCase('sv-SE')}.`
			});
		}
	}

	return examples;
}

/**
 * Skrivförslaget vilar inte på ett tema utan på hur läsbar historiken blivit.
 * Det påstår därför bara att måendet gått att följa, inte att skrivandet
 * förändrade något.
 */
function buildWriteSuggestion(entries: PreparedEntry[], tone: SupportTone): SupportSuggestion | null {
	const shortWithMood = entries.filter(
		(entry) => entry.wordCount > 0 && entry.wordCount <= SHORT_ENTRY_WORDS && entry.mood !== null
	);
	if (shortWithMood.length < MIN_SHORT_ENTRIES_WITH_MOOD) return null;

	const copy = buildSupportCopy('write', tone);
	return {
		id: 'write',
		kind: 'write',
		tone,
		title: copy.title,
		body: copy.body,
		evidence: `${shortWithMood.length} av dina ${entries.length} texter är korta rader med ett humörvärde, vilket är det som gör perioden möjlig att följa i kurvan.`,
		topicLabel: null
	};
}

/**
 * Förslaget om att göra dagen mindre kräver att tyngden syns i data: flera
 * belastningsteman i samma låga text, eller ett tydligt lågt fönster.
 */
function buildSmallerDaySuggestion(
	entries: PreparedEntry[],
	heavyPeriod: boolean,
	now: Date
): SupportSuggestion | null {
	const lowEntries = entries.filter((entry) => entry.mood !== null && entry.mood <= LOW_MOOD_LEVEL);
	const multiLoadEntries = lowEntries.filter(
		(entry) => LOAD_TOPICS.filter((topic) => entry.topicHits.has(topic)).length >= MIN_LOAD_TOPICS_PER_ENTRY
	);
	const tone: SupportTone = heavyPeriod ? 'gentle' : 'everyday';

	if (multiLoadEntries.length >= MIN_MULTI_LOAD_ENTRIES) {
		const copy = buildSupportCopy('smaller-day', tone);
		return {
			id: 'smaller-day',
			kind: 'smaller-day',
			tone,
			title: copy.title,
			body: copy.body,
			evidence: `${multiLoadEntries.length} av dina ${lowEntries.length} texter med humör ${LOW_MOOD_LEVEL} eller lägre nämner minst två belastningar samtidigt.`,
			topicLabel: null
		};
	}

	if (!heavyPeriod) return null;

	const windowStart = now.getTime() - HEAVY_WINDOW_DAYS * DAY_MS;
	const recent = entries.filter((entry) => entry.date.getTime() >= windowStart && entry.mood !== null);
	const recentAverage = average(recent.map((entry) => entry.mood as number));
	if (recentAverage === null) return null;

	const copy = buildSupportCopy('smaller-day', tone);
	return {
		id: 'smaller-day',
		kind: 'smaller-day',
		tone,
		title: copy.title,
		body: copy.body,
		evidence: `De senaste ${HEAVY_WINDOW_DAYS} dagarna bygger på ${recent.length} registreringar med snitt ${formatMood(recentAverage)} av 10.`,
		topicLabel: null
	};
}

/**
 * Bygger hela vyn. Anropas från /api/diary/insights med samma rader som den
 * övriga analysen, så sektionen aldrig läser mer data än sidan redan visar.
 */
export function buildSupportView(
	rows: DiaryInsightRow[],
	options: { now?: Date; topics?: { label: string; keywords: string[] }[] } = {}
): SupportView {
	const now = options.now ?? new Date();
	const entries = prepareEntries(rows);

	if (hasRecentRiskSignal(entries, now)) {
		return { ...EMPTY_SUPPORT_VIEW, learning: false, withheldForSafety: true };
	}

	if (entries.length < MIN_ENTRIES_FOR_SUPPORT) return { ...EMPTY_SUPPORT_VIEW };

	const heavyPeriod = isHeavyPeriod(entries, now);
	const tone: SupportTone = heavyPeriod ? 'gentle' : 'everyday';
	const associations = buildTopicMoodAssociations(entries);
	const helpful = associations
		.filter((association) => association.difference >= MOOD_ASSOCIATION_THRESHOLD)
		.sort((first, second) => second.difference - first.difference);

	const suggestions: SupportSuggestion[] = [];
	const usedKinds = new Set<SupportSuggestionKind>();
	const breathingRoom: string[] = [];

	for (const association of helpful) {
		breathingRoom.push(association.label);
		const kind = TOPIC_SUGGESTION_KINDS[association.label];
		// Ett tema utan vardaglig motsvarighet stannar som andrum, utan förslag.
		if (!kind || usedKinds.has(kind)) continue;
		usedKinds.add(kind);
		const copy = buildSupportCopy(kind, tone);
		suggestions.push({
			id: `${kind}:${association.label}`,
			kind,
			tone,
			title: copy.title,
			body: copy.body,
			evidence: association.evidence,
			topicLabel: association.label
		});
	}

	const smallerDay = buildSmallerDaySuggestion(entries, heavyPeriod, now);
	// Vid en tyngre period ska det minsta förslaget ligga först.
	if (smallerDay && heavyPeriod) suggestions.unshift(smallerDay);

	const write = buildWriteSuggestion(entries, tone);
	if (write) suggestions.push(write);
	if (smallerDay && !heavyPeriod) suggestions.push(smallerDay);

	if (suggestions.length === 0) return { ...EMPTY_SUPPORT_VIEW, heavyPeriod };

	const topics = options.topics ?? TOPICS;
	const visibleBreathingRoom = breathingRoom.slice(0, 4);
	// Varje tema som går att klicka på ska ha egna exempel att visa, även när
	// temat inte blev ett eget förslag.
	const exampleTopics = [
		...new Set([
			...visibleBreathingRoom,
			...suggestions.map((item) => item.topicLabel).filter((label): label is string => label !== null)
		])
	];

	return {
		learning: false,
		withheldForSafety: false,
		heavyPeriod,
		suggestions,
		breathingRoom: visibleBreathingRoom,
		examples: buildExamples(entries, exampleTopics, topics)
	};
}
