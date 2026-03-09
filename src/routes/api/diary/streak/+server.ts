// src/routes/api/diary/streak/+server.ts
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader) return json({ error: 'Unauthorized' }, { status: 401 });

		const token = authHeader.replace('Bearer ', '');
		const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data, error: authError } = await supabase.auth.getUser(token);
		if (authError || !data?.user) return json({ error: 'Unauthorized' }, { status: 401 });
		const user = data.user;

		const { data: entries, error } = await supabase
			.from('diary')
			.select('created_at')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		if (error) return json({ error: error.message }, { status: 500 });

		if (!entries || entries.length === 0) {
			return json({ currentStreak: 0, longestStreak: 0, lastEntryDate: null, lastEntryDaysAgo: 0 });
		}

		const entryDates = entries
			.map((e) => new Date(e.created_at).toDateString())
			.filter((date, index, self) => self.indexOf(date) === index);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		let currentStreak = 0;
		let checkDate = new Date(today);

		for (const entryDate of entryDates) {
			const date = new Date(entryDate);
			date.setHours(0, 0, 0, 0);
			if (checkDate.getTime() === date.getTime()) {
				currentStreak++;
				checkDate.setDate(checkDate.getDate() - 1);
			} else if (checkDate.getTime() > date.getTime()) {
				break;
			}
		}

		let longestStreak = 0;
		let tempStreak = 1;
		for (let i = 0; i < entryDates.length - 1; i++) {
			const date1 = new Date(entryDates[i]);
			const date2 = new Date(entryDates[i + 1]);
			const diffDays = Math.ceil(Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
			if (diffDays === 1) {
				tempStreak++;
			} else {
				longestStreak = Math.max(longestStreak, tempStreak);
				tempStreak = 1;
			}
		}
		longestStreak = Math.max(longestStreak, tempStreak);

		const lastEntry = new Date(entryDates[0]);
		lastEntry.setHours(0, 0, 0, 0);
		const lastEntryDaysAgo = Math.floor((today.getTime() - lastEntry.getTime()) / (1000 * 60 * 60 * 24));

		return json({ currentStreak, longestStreak, lastEntryDate: entryDates[0], lastEntryDaysAgo });
	} catch (err) {
		console.error('Streak error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
