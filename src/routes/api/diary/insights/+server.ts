// src/routes/api/diary/insights/+server.ts
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';

const WEEKDAYS = ['SÃ¶ndag', 'MÃ¥ndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'LÃ¶rdag'];
const WEEKDAY_EMOJIS: { [key: string]: string } = {
	SÃ¶ndag: 'ðŸŒ™', MÃ¥ndag: 'ðŸ“š', Tisdag: 'âš¡', Onsdag: 'ðŸŽ¯', Torsdag: 'ðŸŒ¤ï¸', Fredag: 'ðŸŽ‰', LÃ¶rdag: 'ðŸŒ³'
};
const EMOTION_KEYWORDS: { [key: string]: string[] } = {
	Oro: ['oro', 'oroad', 'nervÃ¶s', 'spÃ¤nd', 'rÃ¤dd', 'Ã¤ngslig'],
	GlÃ¤dje: ['glad', 'lugn', 'lycklig', 'nÃ¶jd', 'bra'],
	Ledsenhet: ['ledsen', 'bedrÃ¶vad', 'deprimerad', 'olycklig', 'trist'],
	TrÃ¶tthet: ['trÃ¶tt', 'uttrÃ¥kad', 'energilÃ¶s'],
	Fokus: ['fokus', 'produktiv', 'effektiv'],
	TrÃ¤ning: ['trÃ¤ning', 'gym', 'motion', 'jogging', 'lÃ¶pning']
};

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
			.select('date, mood, content')
			.eq('user_id', user.id)
			.order('date', { ascending: true });

		if (error) return json({ error: error.message }, { status: 500 });

		if (!entries || entries.length === 0) {
			return json({ bestDayOfWeek: { day: '-', emoji: '-', average: 0, count: 0 }, worstDayOfWeek: { day: '-', emoji: '-', average: 0, count: 0 }, moodByWeekday: {}, recurringPatterns: [], dataPoints: 0 });
		}

		const moodByWeekday: { [day: string]: { average: number; count: number } } = {};
		entries.forEach((entry) => {
			const day = WEEKDAYS[new Date(entry.date).getDay()];
			if (!moodByWeekday[day]) moodByWeekday[day] = { average: 0, count: 0 };
			moodByWeekday[day].average += entry.mood;
			moodByWeekday[day].count += 1;
		});
		Object.keys(moodByWeekday).forEach((day) => {
			moodByWeekday[day].average = Math.round((moodByWeekday[day].average / moodByWeekday[day].count) * 10) / 10;
		});

		const sorted = Object.entries(moodByWeekday).sort((a, b) => b[1].average - a[1].average);
		const bestDay = sorted[0];
		const worstDay = sorted[sorted.length - 1];

		const patterns: { [key: string]: number } = {};
		entries.forEach((entry) => {
			const day = WEEKDAYS[new Date(entry.date).getDay()];
			const content = entry.content.toLowerCase();
			Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
				if (keywords.some((kw) => content.includes(kw))) {
					const pattern = `${emotion} pÃ¥ ${day}`;
					patterns[pattern] = (patterns[pattern] || 0) + 1;
				}
			});
		});

		const recurringPatterns = Object.entries(patterns)
			.filter(([, f]) => f >= 2)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([pattern, frequency]) => ({ pattern, frequency, type: 'emotion' }));

		return json({
			bestDayOfWeek: { day: bestDay?.[0] || '-', emoji: WEEKDAY_EMOJIS[bestDay?.[0]] || 'ðŸ“…', average: bestDay?.[1].average || 0, count: bestDay?.[1].count || 0 },
			worstDayOfWeek: { day: worstDay?.[0] || '-', emoji: WEEKDAY_EMOJIS[worstDay?.[0]] || 'ðŸ“…', average: worstDay?.[1].average || 0, count: worstDay?.[1].count || 0 },
			moodByWeekday,
			recurringPatterns,
			dataPoints: entries.length
		});
	} catch (err) {
		console.error('Insights error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
