// src/routes/api/diary/milestones/+server.ts
import { json } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { RequestHandler } from '@sveltejs/kit';

const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';
const DAY_MS = 24 * 60 * 60 * 1000;
const stockholmDateFormatter = new Intl.DateTimeFormat('sv-CA', {
	timeZone: STOCKHOLM_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});
const MILESTONES_LOOKBACK_DAYS = 365;
const MILESTONES_ROW_LIMIT = 500;
const TOTAL_WORDS_PAGE_SIZE = 1000;
const HIGHEST_TOTAL_WORDS_THRESHOLD = 50000;

type MilestoneCategory = 'firstSteps' | 'diary' | 'consistency' | 'time' | 'writingDepth';
type MilestoneMetric =
	| 'totalEntries'
	| 'longestStreak'
	| 'daysSinceJoined'
	| 'maxWordsInEntry'
	| 'maxWordsInDay'
	| 'totalWords';
type MilestoneUnit = 'inlägg' | 'dagar' | 'ord';

type MilestoneDefinition = {
	id: string;
	category: MilestoneCategory;
	metric: MilestoneMetric;
	threshold: number;
	emoji: string;
	title: string;
	description: string;
	text: string;
	unit: MilestoneUnit;
};

type MilestoneMetrics = {
	totalEntries: number;
	longestStreak: number;
	daysSinceJoined: number;
	maxWordsInEntry: number;
	maxWordsInDay: number;
	totalWords: number;
};

type DiaryRow = {
	created_at: string | null;
	text: string | null;
};

type DiaryTextRow = {
	text: string | null;
};

type MilestonesResponse = {
	achieved: ReturnType<typeof resolveMilestones>;
	sections: Array<{
		id: MilestoneCategory;
		title: string;
		milestones: ReturnType<typeof resolveMilestones>;
	}>;
	nextMilestone: ReturnType<typeof resolveMilestones>[number] | null;
	totalEntries: number;
};

const CATEGORY_TITLES: Record<MilestoneCategory, string> = {
	firstSteps: 'Första steg',
	diary: 'Dagbokens milstolpar',
	consistency: 'Närvaro över tid',
	time: 'Tid med MittPsyke',
	writingDepth: 'Skrivdjup'
};

const CATEGORY_ORDER: MilestoneCategory[] = ['firstSteps', 'consistency', 'writingDepth', 'time', 'diary'];

const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
	{
		id: 'first-word',
		category: 'firstSteps',
		metric: 'totalEntries',
		threshold: 1,
		emoji: '✍️',
		title: 'Första ordet',
		description: 'Du lät något få en plats utanför huvudet. Det kan vara litet och ändå betyda mycket.',
		text: 'Första ordet – du lät något få en plats utanför huvudet.',
		unit: 'inlägg'
	},
	{
		id: 'entries-1',
		category: 'firstSteps',
		metric: 'totalEntries',
		threshold: 1,
		emoji: '📝',
		title: 'Första anteckningen',
		description: 'Din första sparade reflektion finns här när du vill återvända till den.',
		text: 'Första anteckningen – din första sparade reflektion.',
		unit: 'inlägg'
	},
	{
		id: 'entries-3',
		category: 'firstSteps',
		metric: 'totalEntries',
		threshold: 3,
		emoji: '🌤️',
		title: 'Du började',
		description: 'Du har kommit tillbaka mer än en gång. Det säger något om att du gör plats för dig själv.',
		text: 'Du började – du har kommit tillbaka mer än en gång.',
		unit: 'inlägg'
	},
	{
		id: 'entries-5',
		category: 'firstSteps',
		metric: 'totalEntries',
		threshold: 5,
		emoji: '👣',
		title: 'Fem steg framåt',
		description: 'Fem tillfällen där du stannade upp och skrev ner något från insidan.',
		text: 'Fem steg framåt – fem tillfällen där du stannade upp.',
		unit: 'inlägg'
	},
	{
		id: 'entries-10',
		category: 'firstSteps',
		metric: 'totalEntries',
		threshold: 10,
		emoji: '💛',
		title: 'Stark början',
		description: 'Du har börjat bygga en vana som får vara mjuk, ojämn och din egen.',
		text: 'Stark början – du har börjat bygga en egen skrivplats.',
		unit: 'inlägg'
	},
	{
		id: 'entries-25',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 25,
		emoji: '📖',
		title: 'Du fortsätter',
		description: '25 inlägg. Du har återvänt till dina tankar även när dagarna sett olika ut.',
		text: '25 inlägg – Du fortsätter.',
		unit: 'inlägg'
	},
	{
		id: 'entries-50',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 50,
		emoji: '🌿',
		title: 'Femtio stunder sparade',
		description: 'En samling små och stora ögonblick som tillsammans visar att du varit här.',
		text: 'Femtio stunder sparade – små och stora ögonblick har fått plats.',
		unit: 'inlägg'
	},
	{
		id: 'entries-100',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 100,
		emoji: '🌟',
		title: 'Hundra tankar sparade',
		description: '100 inlägg. Du har gett många tankar en trygg plats att landa på.',
		text: '100 inlägg – Hundra tankar sparade.',
		unit: 'inlägg'
	},
	{
		id: 'entries-150',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 150,
		emoji: '📚',
		title: 'En stadig skrivplats',
		description: 'Skrivandet har blivit något du kan återvända till, utan att behöva prestera.',
		text: 'En stadig skrivplats – du kan återvända hit utan krav.',
		unit: 'inlägg'
	},
	{
		id: 'entries-200',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 200,
		emoji: '🧭',
		title: 'Många sidor av dig',
		description: 'Fler dagar har fått nyanser, minnen och ord. Det gör din resa lättare att se.',
		text: 'Många sidor av dig – fler dagar har fått nyanser och ord.',
		unit: 'inlägg'
	},
	{
		id: 'entries-250',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 250,
		emoji: '🌱',
		title: 'Din berättelse växer',
		description: '250 inlägg. Det du skriver börjar bilda en tydligare bild av vad du burit och behövt.',
		text: '250 inlägg – Din berättelse växer.',
		unit: 'inlägg'
	},
	{
		id: 'entries-365',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 365,
		emoji: '🗓️',
		title: 'Många dagar fick plats',
		description: 'Du har sparat ett helt års värde av avtryck, i den takt som varit möjlig för dig.',
		text: 'Många dagar fick plats – ett helt års värde av avtryck.',
		unit: 'inlägg'
	},
	{
		id: 'entries-500',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 500,
		emoji: '💎',
		title: 'En del av MittPsyke',
		description: '500 inlägg. Din plats här har blivit något återkommande och betydelsefullt.',
		text: '500 inlägg – En del av MittPsyke.',
		unit: 'inlägg'
	},
	{
		id: 'entries-1000',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 1000,
		emoji: '🏆',
		title: 'Legendarisk berättare',
		description: '1000 inlägg. En ovanligt rik berättelse om dagar, känslor och fortsättning.',
		text: '1000 inlägg – Legendarisk berättare.',
		unit: 'inlägg'
	},
	{
		id: 'streak-7',
		category: 'consistency',
		metric: 'longestStreak',
		threshold: 7,
		emoji: '🕯️',
		title: 'En vecka av närvaro',
		description: '7 dagar i rad. Du har gett dig själv en liten stund av uppmärksamhet varje dag.',
		text: '7 dagar i rad – En vecka av närvaro.',
		unit: 'dagar'
	},
	{
		id: 'streak-30',
		category: 'consistency',
		metric: 'longestStreak',
		threshold: 30,
		emoji: '🌙',
		title: 'Du fortsatte',
		description: '30 dagar i rad. Det handlar inte om perfektion, utan om att du återvände.',
		text: '30 dagar i rad – Du fortsatte.',
		unit: 'dagar'
	},
	{
		id: 'streak-100',
		category: 'consistency',
		metric: 'longestStreak',
		threshold: 100,
		emoji: '🌟',
		title: 'Ovanligt uthållig',
		description: '100 dagar i rad. Du har visat en varsam uthållighet som förtjänar att få synas.',
		text: '100 dagar i rad – Ovanligt uthållig.',
		unit: 'dagar'
	},
	{
		id: 'streak-365',
		category: 'consistency',
		metric: 'longestStreak',
		threshold: 365,
		emoji: '🌳',
		title: 'Ett år av närvaro',
		description: '365 dagar i rad. Ett helt år där du återkommit till dig själv, dag för dag.',
		text: '365 dagar i rad – Ett år av närvaro.',
		unit: 'dagar'
	},
	{
		id: 'quality-500',
		category: 'writingDepth',
		metric: 'maxWordsInEntry',
		threshold: 500,
		emoji: '📖',
		title: 'Djupdykning',
		description: 'Över 500 ord i ett inlägg. Du stannade kvar länge nog för att låta tankarna veckla ut sig.',
		text: 'Djupdykning – Över 500 ord i ett inlägg.',
		unit: 'ord'
	},
	{
		id: 'quality-1000',
		category: 'writingDepth',
		metric: 'maxWordsInEntry',
		threshold: 1000,
		emoji: '🖊️',
		title: 'Långt in i tanken',
		description: 'Över 1000 ord i ett inlägg. Du gav en tanke tid att bli tydligare.',
		text: 'Långt in i tanken – Över 1000 ord i ett inlägg.',
		unit: 'ord'
	},
	{
		id: 'quality-1500-day',
		category: 'writingDepth',
		metric: 'maxWordsInDay',
		threshold: 1500,
		emoji: '🌊',
		title: 'Ordflödet',
		description: '1500 ord på en dag. Mycket fick röra sig från insidan och ut i text.',
		text: 'Ordflödet – 1500 ord på en dag.',
		unit: 'ord'
	},
	{
		id: 'quality-10000-total',
		category: 'writingDepth',
		metric: 'totalWords',
		threshold: 10000,
		emoji: '🧺',
		title: 'Tankesamlaren',
		description: '10 000 skrivna ord. Du har samlat många skiftningar, frågor och små insikter över tid.',
		text: 'Tankesamlaren – 10 000 skrivna ord.',
		unit: 'ord'
	},
	{
		id: 'quality-50000-total',
		category: 'writingDepth',
		metric: 'totalWords',
		threshold: 50000,
		emoji: '✨',
		title: 'Berättaren',
		description: '50 000 skrivna ord. Din dagbok rymmer en stor och levande berättelse.',
		text: 'Berättaren – 50 000 skrivna ord.',
		unit: 'ord'
	},
	{
		id: 'time-90',
		category: 'time',
		metric: 'daysSinceJoined',
		threshold: 90,
		emoji: '🌱',
		title: 'Du har slagit rot',
		description: 'Tre månader med MittPsyke. Du har låtit platsen finnas kvar över tid.',
		text: 'Du har slagit rot – tre månader med MittPsyke.',
		unit: 'dagar'
	},
	{
		id: 'time-180',
		category: 'time',
		metric: 'daysSinceJoined',
		threshold: 180,
		emoji: '🌿',
		title: 'Du blommar ut',
		description: 'Sex månader med MittPsyke. Ditt sätt att återvända hit har fått växa i sin egen takt.',
		text: 'Du blommar ut – sex månader med MittPsyke.',
		unit: 'dagar'
	},
	{
		id: 'time-365',
		category: 'time',
		metric: 'daysSinceJoined',
		threshold: 365,
		emoji: '🌳',
		title: 'Ett helt år tillsammans',
		description: 'Ett år med MittPsyke. Mycket kan förändras på ett år, och du har haft en plats att återvända till.',
		text: 'Ett helt år tillsammans – ett år med MittPsyke.',
		unit: 'dagar'
	}
];

function toStockholmDateKey(value: string): string {
	return stockholmDateFormatter.format(new Date(value));
}

function dateKeyToUtcMs(dateKey: string): number {
	const [year, month, day] = dateKey.split('-').map(Number);
	return Date.UTC(year, month - 1, day);
}

function countWords(text: string | null): number {
	if (!text) return 0;
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/u).filter(Boolean).length;
}

function calculateLongestStreak(dateKeys: string[]): number {
	if (dateKeys.length === 0) return 0;
	const sorted = [...dateKeys].sort();
	let longest = 1;
	let current = 1;

	for (let i = 1; i < sorted.length; i += 1) {
		const prevMs = dateKeyToUtcMs(sorted[i - 1]);
		const currentMs = dateKeyToUtcMs(sorted[i]);
		if (currentMs - prevMs === DAY_MS) {
			current += 1;
		} else {
			current = 1;
		}
		longest = Math.max(longest, current);
	}

	return longest;
}

function calculateDaysSinceJoined(createdAt: string | null): number {
	if (!createdAt) return 0;
	const createdKey = toStockholmDateKey(createdAt);
	const todayKey = toStockholmDateKey(new Date().toISOString());
	const diff = dateKeyToUtcMs(todayKey) - dateKeyToUtcMs(createdKey);
	return Math.max(0, Math.floor(diff / DAY_MS));
}

function resolveMilestones(metrics: MilestoneMetrics) {
	return MILESTONE_DEFINITIONS.map((definition) => {
		const current = metrics[definition.metric];
		const achieved = current >= definition.threshold;
		const remaining = Math.max(0, definition.threshold - current);
		const progressPercent =
			definition.threshold > 0
				? Math.min(100, Math.round((current / definition.threshold) * 100))
				: 100;

		return {
			...definition,
			current,
			achieved,
			remaining,
			progressPercent
		};
	});
}

async function calculateTotalWords(supabase: SupabaseClient, userId: string): Promise<number> {
	let totalWords = 0;
	let from = 0;

	while (totalWords < HIGHEST_TOTAL_WORDS_THRESHOLD) {
		const to = from + TOTAL_WORDS_PAGE_SIZE - 1;
		const { data, error } = await supabase
			.from('diary')
			.select('text')
			.eq('user_id', userId)
			.range(from, to);

		if (error) throw error;

		const rows = (data ?? []) as DiaryTextRow[];
		for (const row of rows) {
			totalWords += countWords(row.text);
			if (totalWords >= HIGHEST_TOTAL_WORDS_THRESHOLD) {
				return totalWords;
			}
		}

		if (rows.length < TOTAL_WORDS_PAGE_SIZE) {
			return totalWords;
		}

		from += TOTAL_WORDS_PAGE_SIZE;
	}

	return totalWords;
}

export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader) return json({ error: 'Unauthorized' }, { status: 401 });

		const token = authHeader.replace('Bearer ', '');
		const supabase = createClient(env.PUBLIC_SUPABASE_URL ?? '', env.PUBLIC_SUPABASE_ANON_KEY ?? '', {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data, error: authError } = await supabase.auth.getUser(token);
		if (authError || !data?.user) return json({ error: 'Unauthorized' }, { status: 401 });
		const user = data.user;

		const since = new Date(Date.now() - MILESTONES_LOOKBACK_DAYS * DAY_MS).toISOString();
		const [totalEntriesQuery, entriesQuery, totalWords] = await Promise.all([
			supabase.from('diary').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
			supabase
				.from('diary')
				.select('created_at, text')
				.eq('user_id', user.id)
				.gte('created_at', since)
				.order('created_at', { ascending: false })
				.limit(MILESTONES_ROW_LIMIT),
			calculateTotalWords(supabase, user.id)
		]);

		if (totalEntriesQuery.error) return json({ error: totalEntriesQuery.error.message }, { status: 500 });
		if (entriesQuery.error) return json({ error: entriesQuery.error.message }, { status: 500 });

		const rows = (entriesQuery.data ?? []) as DiaryRow[];
		const totalEntries = totalEntriesQuery.count ?? 0;
		const uniqueDateKeys = Array.from(
			new Set(
				rows
					.filter((entry) => typeof entry.created_at === 'string' && entry.created_at.length > 0)
					.map((entry) => toStockholmDateKey(entry.created_at as string))
			)
		);

		let maxWordsInEntry = 0;
		const wordsPerDay = new Map<string, number>();
		for (const row of rows) {
			const words = countWords(row.text);
			maxWordsInEntry = Math.max(maxWordsInEntry, words);

			if (!row.created_at) continue;
			const dayKey = toStockholmDateKey(row.created_at);
			wordsPerDay.set(dayKey, (wordsPerDay.get(dayKey) ?? 0) + words);
		}
		const maxWordsInDay = wordsPerDay.size > 0 ? Math.max(...wordsPerDay.values()) : 0;

		const metrics: MilestoneMetrics = {
			totalEntries,
			longestStreak: calculateLongestStreak(uniqueDateKeys),
			daysSinceJoined: calculateDaysSinceJoined(user.created_at ?? null),
			maxWordsInEntry,
			maxWordsInDay,
			totalWords
		};

		const milestones = resolveMilestones(metrics);
		const achieved = milestones.filter((milestone) => milestone.achieved);
		const nextMilestone =
			milestones
				.filter((milestone) => !milestone.achieved)
				.sort((a, b) => {
					if (b.progressPercent !== a.progressPercent) {
						return b.progressPercent - a.progressPercent;
					}
					if (a.remaining !== b.remaining) {
						return a.remaining - b.remaining;
					}
					return a.threshold - b.threshold;
				})[0] ?? null;

		const sections = CATEGORY_ORDER.map((category) => ({
			id: category,
			title: CATEGORY_TITLES[category],
			milestones: milestones.filter((milestone) => milestone.category === category)
		}));

		const value = {
			achieved,
			sections,
			nextMilestone,
			totalEntries
		};
		return json(value);
	} catch (err) {
		console.error('Milestones error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
