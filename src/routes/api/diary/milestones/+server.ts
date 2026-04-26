// src/routes/api/diary/milestones/+server.ts
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
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
const MILESTONES_CACHE_TTL_MS = 60 * 1000;
const MILESTONES_LOOKBACK_DAYS = 365;
const MILESTONES_ROW_LIMIT = 500;

type MilestoneCategory = 'entries' | 'streak' | 'time' | 'quality';
type MilestoneMetric =
	| 'totalEntries'
	| 'longestStreak'
	| 'daysSinceJoined'
	| 'maxWordsInEntry'
	| 'maxWordsInDay';
type MilestoneUnit = 'inlägg' | 'dagar' | 'ord';

type MilestoneDefinition = {
	id: string;
	category: MilestoneCategory;
	metric: MilestoneMetric;
	threshold: number;
	emoji: string;
	text: string;
	unit: MilestoneUnit;
};

type MilestoneMetrics = {
	totalEntries: number;
	longestStreak: number;
	daysSinceJoined: number;
	maxWordsInEntry: number;
	maxWordsInDay: number;
};

type DiaryRow = {
	created_at: string | null;
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

const milestonesCache = new Map<string, { expiresAt: number; value: MilestonesResponse }>();

const CATEGORY_TITLES: Record<MilestoneCategory, string> = {
	entries: 'Antal inlägg',
	streak: 'Streak i följd',
	time: 'Tid med MittPsyke',
	quality: 'Skrivdjup'
};

const CATEGORY_ORDER: MilestoneCategory[] = ['entries', 'streak', 'time', 'quality'];

const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
	{ id: 'entries-1', category: 'entries', metric: 'totalEntries', threshold: 1, emoji: '📝', text: 'Din första dagboksanteckning', unit: 'inlägg' },
	{ id: 'entries-3', category: 'entries', metric: 'totalEntries', threshold: 3, emoji: '🎵', text: 'Du börjar hitta en rytm', unit: 'inlägg' },
	{ id: 'entries-5', category: 'entries', metric: 'totalEntries', threshold: 5, emoji: '🚀', text: '5 inlägg – Du är på vägen!', unit: 'inlägg' },
	{ id: 'entries-10', category: 'entries', metric: 'totalEntries', threshold: 10, emoji: '💪', text: '10 inlägg – Stark början', unit: 'inlägg' },
	{ id: 'entries-25', category: 'entries', metric: 'totalEntries', threshold: 25, emoji: '📖', text: '25 inlägg – En vanlig journalist!', unit: 'inlägg' },
	{ id: 'entries-50', category: 'entries', metric: 'totalEntries', threshold: 50, emoji: '🔥', text: '50 inlägg – Hälften till 100!', unit: 'inlägg' },
	{ id: 'entries-100', category: 'entries', metric: 'totalEntries', threshold: 100, emoji: '🌟', text: '100 inlägg – Miljon tankar sparade', unit: 'inlägg' },
	{ id: 'entries-150', category: 'entries', metric: 'totalEntries', threshold: 150, emoji: '📚', text: '150 inlägg – Du skriver på riktigt', unit: 'inlägg' },
	{ id: 'entries-200', category: 'entries', metric: 'totalEntries', threshold: 200, emoji: '🏅', text: '200 inlägg – Dedikerad dagboksskrivare', unit: 'inlägg' },
	{ id: 'entries-365', category: 'entries', metric: 'totalEntries', threshold: 365, emoji: '🗓️', text: '365 inlägg – Ett inlägg för varje dag', unit: 'inlägg' },
	{ id: 'entries-500', category: 'entries', metric: 'totalEntries', threshold: 500, emoji: '💎', text: '500 inlägg – Halvvägs till tusen', unit: 'inlägg' },
	{ id: 'entries-1000', category: 'entries', metric: 'totalEntries', threshold: 1000, emoji: '🏆', text: '1000 inlägg – Legendarisk', unit: 'inlägg' },
	{ id: 'streak-7', category: 'streak', metric: 'longestStreak', threshold: 7, emoji: '🔥', text: '7 dagar i rad – En veckas styrka', unit: 'dagar' },
	{ id: 'streak-30', category: 'streak', metric: 'longestStreak', threshold: 30, emoji: '⚡', text: '30 dagar i rad – En månads momentum', unit: 'dagar' },
	{ id: 'streak-100', category: 'streak', metric: 'longestStreak', threshold: 100, emoji: '🌟', text: '100 dagar i rad – Oövervinnerlig', unit: 'dagar' },
	{ id: 'time-90', category: 'time', metric: 'daysSinceJoined', threshold: 90, emoji: '🌱', text: '3 månader – Du har slagit rot', unit: 'dagar' },
	{ id: 'time-180', category: 'time', metric: 'daysSinceJoined', threshold: 180, emoji: '🌿', text: '6 månader – Du blommar ut', unit: 'dagar' },
	{ id: 'time-365', category: 'time', metric: 'daysSinceJoined', threshold: 365, emoji: '🌳', text: '1 år – Ett helt år med MittPsyke', unit: 'dagar' },
	{ id: 'quality-500', category: 'quality', metric: 'maxWordsInEntry', threshold: 500, emoji: '📖', text: 'Djupdykning – Över 500 ord i ett inlägg', unit: 'ord' },
	{ id: 'quality-1000', category: 'quality', metric: 'maxWordsInEntry', threshold: 1000, emoji: '🖊️', text: 'Romanförfattaren – Över 1000 ord', unit: 'ord' },
	{ id: 'quality-1500-day', category: 'quality', metric: 'maxWordsInDay', threshold: 1500, emoji: '🎯', text: 'Ordflödet – 1500 ord på en dag', unit: 'ord' }
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
		const cached = milestonesCache.get(user.id);
		if (cached && cached.expiresAt > Date.now()) {
			return json(cached.value);
		}

		const since = new Date(Date.now() - MILESTONES_LOOKBACK_DAYS * DAY_MS).toISOString();
		const [totalEntriesQuery, entriesQuery] = await Promise.all([
			supabase.from('diary').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
			supabase
				.from('diary')
				.select('created_at, text')
				.eq('user_id', user.id)
				.gte('created_at', since)
				.order('created_at', { ascending: false })
				.limit(MILESTONES_ROW_LIMIT)
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
			maxWordsInDay
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
		milestonesCache.set(user.id, { expiresAt: Date.now() + MILESTONES_CACHE_TTL_MS, value });
		return json(value);
	} catch (err) {
		console.error('Milestones error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
