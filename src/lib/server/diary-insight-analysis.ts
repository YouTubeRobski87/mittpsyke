// Temadetektering och tema/humör-samband ur dagboksinlägg.
//
// Delas av Framstegs återblick (progress-analysis, progress-lighter-days) och
// förslagen i "Kanske värt att prova" (diary-support-suggestions). Allt här är
// deterministiskt. Den äldre berättande analysen, som skrev om texten med en
// språkmodell utan att användaren bett om det, är borttagen: AI körs nu bara
// efter ett aktivt val (se /api/diary/insights/summary).

export type DiaryInsightRow = {
	created_at: string | null;
	mood: string | number | null;
	text: string | null;
	tags?: string[] | null;
};

export type PreparedEntry = {
	date: Date;
	dateKey: string;
	weekday: number;
	mood: number | null;
	text: string;
	wordCount: number;
	topicHits: Map<string, number>;
};

type TopicDefinition = {
	label: string;
	keywords: string[];
};

export const MIN_ASSOCIATION_ENTRIES = 3;
const MIN_ASSOCIATION_COMPARISON_ENTRIES = 3;
export const MOOD_ASSOCIATION_THRESHOLD = 0.75;

export const TOPICS: TopicDefinition[] = [
	{ label: 'Barnen', keywords: ['barn', 'barnen', 'barnet', 'son', 'sonen', 'dotter', 'dottern', 'familj', 'familjen', 'förälder', 'föräldrar', 'föräldraskap'] },
	{ label: 'Stress', keywords: ['stress', 'stressen', 'stressad', 'stressigt', 'stressande', 'pressad', 'pressat', 'pressande', 'under press', 'överväldigad', 'överväldigande'] },
	{ label: 'Sömn', keywords: ['sömn', 'sömnen', 'sömnproblem', 'sover', 'sovit', 'sova', 'trött', 'trötthet', 'vaken', 'vaknade', 'somna', 'somnade'] },
	{ label: 'Arbete', keywords: ['jobb', 'jobbet', 'jobba', 'jobbar', 'arbete', 'arbetet', 'arbetsdag', 'kollega', 'kollegor', 'chef', 'chefen'] },
	{ label: 'Motion', keywords: ['motion', 'träning', 'tränar', 'tränade', 'promenad', 'promenaden', 'promenader', 'promenerar', 'promenerade', 'springa', 'sprang', 'jogga', 'joggade', 'gym', 'gymmet'] },
	{ label: 'Relationer', keywords: ['relation', 'relationen', 'relationer', 'partner', 'vän', 'vännen', 'vänner', 'mamma', 'pappa', 'sambo'] },
	{ label: 'Framtiden', keywords: ['framtid', 'framtiden', 'plan', 'planer', 'planera', 'planerat', 'hoppas'] },
	{ label: 'Oro', keywords: ['oro', 'orolig', 'oroligt', 'ångest', 'rädd', 'nervös', 'grubblar', 'grubblade'] },
	{ label: 'Återhämtning', keywords: ['vila', 'vilade', 'vilar', 'återhämtning', 'återhämtade', 'paus', 'lugn', 'lugnt'] },
	{ label: 'Självmedkänsla', keywords: ['snäll mot mig själv', 'vara snäll mot mig', 'det får räcka', 'förlåta mig själv', 'mildare mot mig själv'] },
	{ label: 'Tacksamhet', keywords: ['tacksam', 'tacksamhet', 'glad för'] },
	{ label: 'Ekonomi', keywords: ['ekonomi', 'ekonomin', 'pengar', 'räkningar', 'betala räkning', 'betala räkningar', 'skulder', 'lön', 'lönen'] },
	{ label: 'Ensamhet', keywords: ['ensam', 'ensamhet', 'isolerad', 'isolation'] },
	{ label: 'Konflikter', keywords: ['bråk', 'konflikt', 'konflikter', 'gräl', 'osams', 'tjafs'] },
	{ label: 'Natur', keywords: ['natur', 'naturen', 'skog', 'skogen', 'sjö', 'sjön', 'utomhus', 'park', 'parken'] },
	{ label: 'Struktur', keywords: ['rutin', 'rutinen', 'rutiner', 'struktur', 'planering', 'planerat'] },
	{ label: 'Social kontakt', keywords: ['umgås', 'umgänge', 'träffa en vän', 'träffa vänner'] },
	{ label: 'Kreativitet', keywords: ['kreativ', 'kreativitet', 'skapande', 'måla', 'målar', 'målade', 'sjunga', 'pyssel', 'fotografera'] },
	{ label: 'MittPsyke', keywords: ['mittpsyke', 'dagbok', 'dagboken'] }
];

const NEGATION_WORDS = new Set(['inte', 'ingen', 'inget', 'inga', 'aldrig', 'varken', 'utan', 'knappast']);

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matchar hela svenska ord/fraser och avstår vid en närliggande tydlig negation. */
export function hasTopicKeyword(text: string, keywords: readonly string[]): boolean {
	const normalized = text.toLocaleLowerCase('sv-SE');
	for (const keyword of keywords) {
		const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${escapeRegExp(keyword.toLocaleLowerCase('sv-SE'))})(?=$|[^\\p{L}\\p{N}])`, 'gu');
		for (const match of normalized.matchAll(pattern)) {
			const matchStart = (match.index ?? 0) + match[0].length - match[1].length;
			const precedingText = normalized.slice(0, matchStart).split(/[.!?;:\n]/).at(-1) ?? '';
			const precedingWords = precedingText.match(/[\p{L}\p{N}]+/gu)?.slice(-5) ?? [];
			if (!precedingWords.some((word) => NEGATION_WORDS.has(word))) return true;
		}
	}
	return false;
}

export function detectTopicHits(text: string): Map<string, number> {
	const hits = new Map<string, number>();
	for (const topic of TOPICS) {
		if (hasTopicKeyword(text, topic.keywords)) hits.set(topic.label, 1);
	}
	return hits;
}

export function detectTopicLabels(text: string): string[] {
	return [...detectTopicHits(text).keys()];
}

function parseMood(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number.parseFloat(value.replace(',', '.'));
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function dateKey(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function formatDate(date: Date | null) {
	if (!date) return null;
	return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

export function prepareEntries(rows: DiaryInsightRow[]): PreparedEntry[] {
	return rows
		.map((row) => {
			const date = row.created_at ? new Date(row.created_at) : null;
			const text = typeof row.text === 'string' ? row.text.trim() : '';
			if (!date || Number.isNaN(date.getTime()) || !text) return null;
			return {
				date,
				dateKey: dateKey(date),
				weekday: date.getDay(),
				mood: parseMood(row.mood),
				text,
				wordCount: text.split(/\s+/).filter(Boolean).length,
				topicHits: detectTopicHits(text)
			};
		})
		.filter((entry): entry is PreparedEntry => entry !== null)
		.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function average(values: number[]) {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatMood(value: number) {
	return value.toFixed(1).replace('.', ',');
}

export type TopicMoodAssociation = {
	label: string;
	/** Antal texter med humörvärde där temat nämns. */
	matchingCount: number;
	/** Antal övriga texter med humörvärde, dvs jämförelsegruppen. */
	otherCount: number;
	totalCount: number;
	matchingAverage: number;
	otherAverage: number;
	/** Positiv skillnad = temat nämns oftare i texter med högre humörvärde. */
	difference: number;
	evidence: string;
};

/**
 * Sambanden mellan tema och humör som förslagen i "Kanske värt att prova"
 * vilar på. Ett tema kräver minst tre texter med humörvärde och en
 * jämförelsegrupp av samma storlek.
 */
export function buildTopicMoodAssociations(entries: PreparedEntry[]): TopicMoodAssociation[] {
	const associations: TopicMoodAssociation[] = [];

	for (const topic of TOPICS) {
		const matching = entries.filter((entry) => entry.topicHits.has(topic.label) && entry.mood !== null);
		const other = entries.filter((entry) => !entry.topicHits.has(topic.label) && entry.mood !== null);
		if (matching.length < MIN_ASSOCIATION_ENTRIES || other.length < MIN_ASSOCIATION_COMPARISON_ENTRIES) continue;

		const matchingAverage = average(matching.map((entry) => entry.mood as number));
		const otherAverage = average(other.map((entry) => entry.mood as number));
		if (matchingAverage === null || otherAverage === null) continue;

		associations.push({
			label: topic.label,
			matchingCount: matching.length,
			otherCount: other.length,
			totalCount: entries.length,
			matchingAverage,
			otherAverage,
			difference: matchingAverage - otherAverage,
			evidence: `${matching.length} av ${entries.length} texter nämner ${topic.label.toLowerCase()}, med humörsnitt ${formatMood(matchingAverage)} jämfört med ${formatMood(otherAverage)} i ${other.length} övriga texter.`
		});
	}

	return associations;
}
