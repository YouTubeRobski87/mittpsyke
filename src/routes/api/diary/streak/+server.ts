// src/routes/api/diary/streak/+server.ts
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { RequestHandler } from '@sveltejs/kit';
import { TtlCache } from '$lib/server/search-cache';

const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';
const DAY_MS = 24 * 60 * 60 * 1000;
const stockholmDateFormatter = new Intl.DateTimeFormat('sv-CA', {
	timeZone: STOCKHOLM_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});
const STREAK_CACHE_TTL_MS = 60 * 1000;
const STREAK_LOOKBACK_DAYS = 370;
const STREAK_ROW_LIMIT = 500;

type StreakResponse = {
	currentStreak: number;
	longestStreak: number;
	lastEntryDate: string | null;
	lastEntryDaysAgo: number;
};

// TtlCache begränsar antal nycklar (till skillnad från en vanlig Map), så
// minnet inte växer obegränsat i takt med antal unika användare över tid.
const streakCache = new TtlCache<StreakResponse>(STREAK_CACHE_TTL_MS);

function toStockholmDateKey(value: string) {
	return stockholmDateFormatter.format(new Date(value));
}

function stockholmTodayKey() {
	return stockholmDateFormatter.format(new Date());
}

function dateKeyToUtcMs(dateKey: string) {
	const [year, month, day] = dateKey.split('-').map(Number);
	return Date.UTC(year, month - 1, day);
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
		const cached = streakCache.get(user.id);
		if (cached) {
			return json(cached);
		}

		const since = new Date(Date.now() - STREAK_LOOKBACK_DAYS * DAY_MS).toISOString();

		const { data: entries, error } = await supabase
			.from('diary')
			.select('created_at')
			.eq('user_id', user.id)
			.gte('created_at', since)
			.order('created_at', { ascending: false })
			.limit(STREAK_ROW_LIMIT);

		if (error) return json({ error: error.message }, { status: 500 });

		if (!entries || entries.length === 0) {
			const emptyValue = { currentStreak: 0, longestStreak: 0, lastEntryDate: null, lastEntryDaysAgo: 0 };
			streakCache.set(user.id, emptyValue);
			return json(emptyValue);
		}

		// Normalize all entry timestamps to Swedish local day before streak math.
		const entryDates = entries
			.map((e) => toStockholmDateKey(e.created_at))
			.filter((date, index, self) => self.indexOf(date) === index);

		const todayUtcMs = dateKeyToUtcMs(stockholmTodayKey());

		let currentStreak = 0;
		let checkDateUtcMs = todayUtcMs;

		for (const entryDate of entryDates) {
			const dateUtcMs = dateKeyToUtcMs(entryDate);
			if (checkDateUtcMs === dateUtcMs) {
				currentStreak++;
				checkDateUtcMs -= DAY_MS;
			} else if (checkDateUtcMs > dateUtcMs) {
				break;
			}
		}

		let longestStreak = 0;
		let tempStreak = 1;
		for (let i = 0; i < entryDates.length - 1; i++) {
			const date1UtcMs = dateKeyToUtcMs(entryDates[i]);
			const date2UtcMs = dateKeyToUtcMs(entryDates[i + 1]);
			const diffDays = Math.round(Math.abs(date1UtcMs - date2UtcMs) / DAY_MS);
			if (diffDays === 1) {
				tempStreak++;
			} else {
				longestStreak = Math.max(longestStreak, tempStreak);
				tempStreak = 1;
			}
		}
		longestStreak = Math.max(longestStreak, tempStreak);

		const lastEntryUtcMs = dateKeyToUtcMs(entryDates[0]);
		const lastEntryDaysAgo = Math.floor((todayUtcMs - lastEntryUtcMs) / DAY_MS);

		const value = { currentStreak, longestStreak, lastEntryDate: entryDates[0], lastEntryDaysAgo };
		streakCache.set(user.id, value);
		return json(value);
	} catch (err) {
		console.error('Streak error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
