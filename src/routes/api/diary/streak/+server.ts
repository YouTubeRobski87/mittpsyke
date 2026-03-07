// src/routes/api/diary/streak/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface StreakData {
	currentStreak: number;
	longestStreak: number;
	lastEntryDate: string | null;
	lastEntryDaysAgo: number;
}

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Hämta user_id från session
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;

		// Hämta alla dagboksinlägg sorterade efter datum (senaste först)
		const { data: entries, error } = await supabase
			.from('diary')
			.select('date')
			.eq('user_id', userId)
			.order('date', { ascending: false });

		if (error) {
			console.error('Supabase error:', error);
			return json({ error: error.message }, { status: 500 });
		}

		if (!entries || entries.length === 0) {
			return json({
				currentStreak: 0,
				longestStreak: 0,
				lastEntryDate: null,
				lastEntryDaysAgo: 0
			});
		}

		// Konvertera alla datum till Date-objekt
		const entryDates = entries
			.map((e) => new Date(e.date).toDateString())
			.filter((date, index, self) => self.indexOf(date) === index); // Deduplisera

		// Beräkna current streak
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
				// Gap found
				break;
			}
		}

		// Beräkna longest streak
		let longestStreak = 0;
		let tempStreak = 1;

		for (let i = 0; i < entryDates.length - 1; i++) {
			const date1 = new Date(entryDates[i]);
			const date2 = new Date(entryDates[i + 1]);

			const diffTime = Math.abs(date1.getTime() - date2.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays === 1) {
				tempStreak++;
			} else {
				longestStreak = Math.max(longestStreak, tempStreak);
				tempStreak = 1;
			}
		}
		longestStreak = Math.max(longestStreak, tempStreak);

		// Beräkna hur många dagar sedan sista inlägg
		const lastEntry = new Date(entryDates[0]);
		lastEntry.setHours(0, 0, 0, 0);
		const lastEntryDaysAgo = Math.floor(
			(today.getTime() - lastEntry.getTime()) / (1000 * 60 * 60 * 24)
		);

		const response: StreakData = {
			currentStreak,
			longestStreak,
			lastEntryDate: entryDates[0],
			lastEntryDaysAgo
		};

		return json(response);
	} catch (err) {
		console.error('Streak calculation error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};