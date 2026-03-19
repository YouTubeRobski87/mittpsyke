import type { PageServerLoad } from './$types';

type MoodRow = {
	created_at: string | null;
	mood: string | null;
};

type MoodPoint = {
	date: string;
	mood: number;
};

const DAYS_WINDOW = 7;

function formatDateKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function getLastDateKeys(days: number): string[] {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const keys: string[] = [];

	for (let i = days - 1; i >= 0; i -= 1) {
		const current = new Date(today);
		current.setDate(today.getDate() - i);
		keys.push(formatDateKey(current));
	}

	return keys;
}

function toMoodNumber(value: string | null): number | null {
	if (!value) return null;
	const numeric = Number(value);
	if (!Number.isFinite(numeric)) return null;
	if (numeric < 1 || numeric > 10) return null;
	return numeric;
}

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		return { moodSeries: [] as MoodPoint[] };
	}

	const dateKeys = getLastDateKeys(DAYS_WINDOW);
	const startDate = dateKeys[0];

	const { data, error } = await locals.supabase
		.from('diary')
		.select('created_at, mood')
		.eq('user_id', user.id)
		.gte('created_at', `${startDate}T00:00:00.000Z`)
		.not('mood', 'is', null)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Dashboard mood chart load error:', error);
		return { moodSeries: [] as MoodPoint[] };
	}

	const rows = (data ?? []) as MoodRow[];
	const grouped = new Map<string, { sum: number; count: number }>();

	for (const row of rows) {
		if (!row.created_at) continue;
		const date = row.created_at.slice(0, 10);
		if (!dateKeys.includes(date)) continue;

		const mood = toMoodNumber(row.mood);
		if (mood === null) continue;

		const existing = grouped.get(date);
		if (existing) {
			existing.sum += mood;
			existing.count += 1;
		} else {
			grouped.set(date, { sum: mood, count: 1 });
		}
	}

	const moodSeries: MoodPoint[] = [];
	for (const date of dateKeys) {
		const bucket = grouped.get(date);
		if (!bucket || bucket.count === 0) continue;
		moodSeries.push({
			date,
			mood: Math.round(bucket.sum / bucket.count)
		});
	}

	return { moodSeries };
};
