// src/routes/api/diary/insights/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface MoodByWeekday {
	[day: string]: {
		average: number;
		count: number;
	};
}

interface RecurringPattern {
	pattern: string;
	frequency: number;
	type: 'emotion' | 'weekday' | 'context';
}

interface InsightsResponse {
	bestDayOfWeek: {
		day: string;
		emoji: string;
		average: number;
		count: number;
	};
	worstDayOfWeek: {
		day: string;
		emoji: string;
		average: number;
		count: number;
	};
	moodByWeekday: MoodByWeekday;
	recurringPatterns: RecurringPattern[];
	dataPoints: number;
}

const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
const WEEKDAY_EMOJIS: { [key: string]: string } = {
	Söndag: '🌙',
	Måndag: '📚',
	Tisdag: '⚡',
	Onsdag: '🎯',
	Torsdag: '🌤️',
	Fredag: '🎉',
	Lördag: '🌳'
};

// Vanliga känslor och uttryck att söka efter
const EMOTION_KEYWORDS: { [key: string]: string[] } = {
	Oro: ['oro', 'oroad', 'nervös', 'spänd', 'rädd', 'ängslig'],
	Glädje: ['glad', 'glad', 'lugn', 'lycklig', 'nöjd', 'bra'],
	Ledsenhet: ['ledsen', 'bedrövad', 'deprimerad', 'olycklig', 'trist'],
	Trötthet: ['trött', 'uttråkad', 'energilös', 'drained'],
	Fokus: ['fokus', 'produktiv', 'effektiv', 'concentrate'],
	Träning: ['träning', 'gym', 'motion', 'jogging', 'löpning']
};

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

		// Hämta alla inlägg
		const { data: entries, error } = await supabase
			.from('diary')
			.select('date, mood, content')
			.eq('user_id', userId)
			.order('date', { ascending: true });

		if (error) {
			console.error('Supabase error:', error);
			return json({ error: error.message }, { status: 500 });
		}

		if (!entries || entries.length === 0) {
			return json({
				bestDayOfWeek: { day: '-', emoji: '-', average: 0, count: 0 },
				worstDayOfWeek: { day: '-', emoji: '-', average: 0, count: 0 },
				moodByWeekday: {},
				recurringPatterns: [],
				dataPoints: 0
			});
		}

		// ============ BERÄKNA BÄSTA/SÄMSTA DAG ============
		const moodByWeekday: MoodByWeekday = {};

		entries.forEach((entry) => {
			const date = new Date(entry.date);
			const dayOfWeek = WEEKDAYS[date.getDay()];

			if (!moodByWeekday[dayOfWeek]) {
				moodByWeekday[dayOfWeek] = { average: 0, count: 0 };
			}

			moodByWeekday[dayOfWeek].average += entry.mood;
			moodByWeekday[dayOfWeek].count += 1;
		});

		// Beräkna medelvärden
		Object.keys(moodByWeekday).forEach((day) => {
			moodByWeekday[day].average = Math.round(
				(moodByWeekday[day].average / moodByWeekday[day].count) * 10
			) / 10;
		});

		// Hitta bästa och sämsta dag
		const daysWithData = Object.entries(moodByWeekday).sort((a, b) => {
			return b[1].average - a[1].average;
		});

		const bestDay = daysWithData[0];
		const worstDay = daysWithData[daysWithData.length - 1];

		// ============ HITTA ÅTERKOMMANDE MÖNSTER ============
		const patterns: { [key: string]: number } = {};

		entries.forEach((entry) => {
			const date = new Date(entry.date);
			const dayOfWeek = WEEKDAYS[date.getDay()];
			const content = entry.content.toLowerCase();

			// Leta efter emotionsmönster kombinerat med veckodagar
			Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
				const hasEmotion = keywords.some((keyword) => content.includes(keyword));
				if (hasEmotion) {
					const pattern = `${emotion} på ${dayOfWeek}`;
					patterns[pattern] = (patterns[pattern] || 0) + 1;
				}
			});
		});

		// Sortera mönster efter frekvens och ta top 5
		const recurringPatterns: RecurringPattern[] = Object.entries(patterns)
			.filter(([_, frequency]) => frequency >= 2) // Minst 2 förekomster
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([pattern, frequency]) => ({
				pattern,
				frequency,
				type: 'emotion'
			}));

		const response: InsightsResponse = {
			bestDayOfWeek: {
				day: bestDay ? bestDay[0] : '-',
				emoji: bestDay ? WEEKDAY_EMOJIS[bestDay[0]] || '📅' : '-',
				average: bestDay ? bestDay[1].average : 0,
				count: bestDay ? bestDay[1].count : 0
			},
			worstDayOfWeek: {
				day: worstDay ? worstDay[0] : '-',
				emoji: worstDay ? WEEKDAY_EMOJIS[worstDay[0]] || '📅' : '-',
				average: worstDay ? worstDay[1].average : 0,
				count: worstDay ? worstDay[1].count : 0
			},
			moodByWeekday,
			recurringPatterns,
			dataPoints: entries.length
		};

		return json(response);
	} catch (err) {
		console.error('Insights calculation error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
