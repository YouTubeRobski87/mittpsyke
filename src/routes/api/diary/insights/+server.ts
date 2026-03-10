// src/routes/api/diary/insights/+server.ts
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
const WEEKDAY_EMOJIS: { [key: string]: string } = {
	Söndag: 'Natt', Måndag: 'Måndag', Tisdag: 'Tisdag', Onsdag: 'Onsdag',
	Torsdag: 'Torsdag', Fredag: 'Fredag', Lördag: 'Lördag'
};
const EMOTION_KEYWORDS: { [key: string]: string[] } = {
	anxiety: ['orolig', 'angest', 'nervos', 'radd', 'panik', 'stressad'],
	sadness: ['ledsen', 'sorgsen', 'deprimerad', 'tom', 'hopplös', 'ensam'],
	joy: ['glad', 'lycklig', 'bra', 'fantastisk', 'positiv', 'energisk'],
	anger: ['arg', 'frustrerad', 'irriterad', 'rasande', 'upprörd'],
	calm: ['lugn', 'avslappnad', 'fridfull', 'harmonisk', 'trygg']
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

		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const startDate = thirtyDaysAgo.toISOString().split('T')[0];

		const { data: entries, error } = await supabase
			.from('diary')
			.select('date, mood, content')
			.eq('user_id', user.id)
			.gte('date', startDate)
			.order('date', { ascending: true });

		if (error) return json({ error: error.message }, { status: 500 });
		if (!entries || entries.length < 3) {
			return json({ insights: [], bestDay: null, worstDay: null, emotionDistribution: {}, aiSummary: null });
		}

		const weekdayMoods: { [key: string]: number[] } = {};
		WEEKDAYS.forEach((day) => { weekdayMoods[day] = []; });

		const emotionCounts: { [key: string]: number } = {};
		Object.keys(EMOTION_KEYWORDS).forEach((e) => { emotionCounts[e] = 0; });

		for (const entry of entries) {
			const date = new Date(entry.date);
			const dayName = WEEKDAYS[date.getDay()];
			if (entry.mood) weekdayMoods[dayName].push(entry.mood);

			if (entry.content) {
				const contentLower = entry.content.toLowerCase();
				for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
					if (keywords.some((k) => contentLower.includes(k))) emotionCounts[emotion]++;
				}
			}
		}

		const weekdayAverages = Object.entries(weekdayMoods)
			.filter(([, moods]) => moods.length > 0)
			.map(([day, moods]) => ({
				day,
				average: Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10,
				count: moods.length
			}))
			.sort((a, b) => b.average - a.average);

		const bestDay = weekdayAverages[0] || null;
		const worstDay = weekdayAverages[weekdayAverages.length - 1] || null;

		const insights = [];
		if (bestDay && worstDay && bestDay.day !== worstDay.day) {
			insights.push({
				type: 'weekday_pattern',
				title: 'Veckans mönster',
				description: `Du mår bäst på ${bestDay.day} (snitt ${bestDay.average}/10) och har det tuffast på ${worstDay.day} (snitt ${worstDay.average}/10).`,
				icon: 'calendar'
			});
		}

		const moods = entries.map((e) => e.mood).filter(Boolean);
		if (moods.length >= 5) {
			const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
			const secondHalf = moods.slice(Math.floor(moods.length / 2));
			const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
			const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
			const trend = secondAvg - firstAvg;
			if (Math.abs(trend) > 0.5) {
				insights.push({
					type: 'mood_trend',
					title: trend > 0 ? 'Positiv trend' : 'Utmanande period',
					description: trend > 0
						? `Ditt humör har förbättrats med ${Math.abs(trend).toFixed(1)} poäng de senaste 30 dagarna.`
						: `Det har varit lite tuffare på sistone. Kom ihåg att det är okej att ha svåra perioder.`,
					icon: trend > 0 ? 'trending-up' : 'trending-down'
				});
			}
		}

		const dominantEmotion = Object.entries(emotionCounts)
			.filter(([, count]) => count > 0)
			.sort(([, a], [, b]) => b - a)[0];

		if (dominantEmotion) {
			const emotionLabels: { [key: string]: string } = {
				anxiety: 'oro och ångest',
				sadness: 'ledsenhet',
				joy: 'gladje och positivitet',
				anger: 'frustration',
				calm: 'lugn och harmoni'
			};
			insights.push({
				type: 'emotion_pattern',
				title: 'Vanligaste känslan',
				description: `Dina inlägg handlar ofta om ${emotionLabels[dominantEmotion[0]] || dominantEmotion[0]}. Det är viktigt att känna igen sina känslomönster.`,
				icon: 'heart'
			});
		}

		const recentEntries = entries.slice(-7);
		const recentText = recentEntries.map((e) => `[${e.date}] Humör: ${e.mood}/10\n${e.content || ''}`).join('\n\n');

		let aiSummary = null;
		try {
			const completion = await openai.chat.completions.create({
				model: 'gpt-4-turbo',
				messages: [{
					role: 'user',
					content: `Du är en empatisk psykolog. Analysera dessa dagboksinlägg och ge EN kort insikt (max 2 meningar) om ett intressant mönster du ser. Var specifik och uppmuntrande. Skriv på svenska:\n\n${recentText}`
				}],
				max_tokens: 150,
				temperature: 0.7
			});
			aiSummary = completion.choices[0]?.message?.content?.trim() || null;
		} catch {
			aiSummary = null;
		}

		return json({
			insights,
			bestDay,
			worstDay,
			emotionDistribution: emotionCounts,
			aiSummary
		});
	} catch (err) {
		console.error('Insights error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

