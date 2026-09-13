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
	{ label: 'Barnen', keywords: ['barn', 'son', 'dotter', 'familj', 'förälder', 'föräldra'] },
	{ label: 'Stress', keywords: ['stress', 'stressad', 'press', 'mycket', 'överväldig', 'hinner', 'måste'] },
	{ label: 'Sömn', keywords: ['sömn', 'sover', 'sova', 'trött', 'vaken', 'natt', 'somna'] },
	{ label: 'Arbete', keywords: ['jobb', 'jobbet', 'arbete', 'kollega', 'möte', 'chef'] },
	{ label: 'Motion', keywords: ['motion', 'träning', 'promenad', 'spring', 'gym', 'rörelse'] },
	{ label: 'Relationer', keywords: ['relation', 'partner', 'vän', 'vänner', 'mamma', 'pappa', 'sambo'] },
	{ label: 'Framtiden', keywords: ['framtid', 'senare', 'projekt', 'plan', 'hoppas', 'vill', 'dröm'] },
	{ label: 'Oro', keywords: ['oro', 'orolig', 'ångest', 'rädd', 'nervös', 'grubblar'] },
	{ label: 'Återhämtning', keywords: ['vila', 'återhämt', 'paus', 'lugn', 'andas', 'landat'] },
	{ label: 'Självmedkänsla', keywords: ['snäll mot mig', 'okej', 'räcker', 'förlåta', 'mildare'] },
	{ label: 'Tacksamhet', keywords: ['tacksam', 'glad för', 'fint', 'värme', 'lättnad'] },
	{ label: 'Ekonomi', keywords: ['ekonomi', 'pengar', 'räkning', 'räkningar', 'skuld', 'lön'] },
	{ label: 'Ensamhet', keywords: ['ensam', 'ensamhet', 'isolerad', 'isolation'] },
	{ label: 'Konflikter', keywords: ['bråk', 'konflikt', 'gräl', 'osams', 'tjafs'] },
	{ label: 'Natur', keywords: ['natur', 'skog', 'sjö', 'ute', 'utomhus', 'park'] },
	{ label: 'Struktur', keywords: ['rutin', 'rutiner', 'struktur', 'planering', 'planerat'] },
	{ label: 'Social kontakt', keywords: ['umgås', 'umgänge', 'träffa', 'sällskap', 'prata med'] },
	{ label: 'Kreativitet', keywords: ['kreativ', 'skapande', 'måla', 'målar', 'målade', 'musik', 'sjunga', 'pyssel', 'fotografera'] },
	{ label: 'MittPsyke', keywords: ['mittpsyke', 'dagbok', 'skriva', 'reflektion'] }
];

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

function countTopicHits(text: string) {
	const hits = new Map<string, number>();
	for (const topic of TOPICS) {
		const count = topic.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
		if (count > 0) hits.set(topic.label, count);
	}
	return hits;
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
				topicHits: countTopicHits(text.toLowerCase())
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
