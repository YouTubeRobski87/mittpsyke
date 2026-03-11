// src/routes/api/diary/weekly-summary/+server.ts
import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!hasSensitiveConsentHeader(request)) {
			return json({ error: 'Consent required for sensitive AI features.' }, { status: 403 });
		}

		const authHeader = request.headers.get('Authorization');
		if (!authHeader) return json({ error: 'Unauthorized' }, { status: 401 });

		const token = authHeader.replace('Bearer ', '');
		const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data, error: authError } = await supabase.auth.getUser(token);
		if (authError || !data?.user) return json({ error: 'Unauthorized' }, { status: 401 });
		const user = data.user;

		const body = await request.json();
		const { startDate, endDate } = body;
		if (!startDate || !endDate) return json({ error: 'Missing startDate or endDate' }, { status: 400 });

		const { data: entries, error } = await supabase
			.from('diary')
			.select('date, mood, content')
			.eq('user_id', user.id)
			.gte('date', startDate)
			.lte('date', endDate)
			.order('date', { ascending: true });

		if (error) return json({ error: error.message }, { status: 500 });

		if (!entries || entries.length === 0) {
			return json({
				week: 0,
				year: new Date().getFullYear(),
				startDate,
				endDate,
				summary: 'Inga inlägg denna vecka.',
				moodTrend: { trend: 'stable', average_mood: 0, start_mood: 0, end_mood: 0 },
				entryCount: 0
			});
		}

		const moods = entries.map((e) => e.mood);
		const averageMood = Math.round(moods.reduce((a, b) => a + b) / moods.length);
		const startMood = moods[0];
		const endMood = moods[moods.length - 1];
		let trend: 'improving' | 'declining' | 'stable' = 'stable';
		if (endMood > startMood + 1) trend = 'improving';
		else if (endMood < startMood - 1) trend = 'declining';

		const startDateObj = new Date(startDate);
		const weekNumber = getWeekNumber(startDateObj);
		const year = startDateObj.getFullYear();

		const entriesText = entries
			.map((e) => `[${e.date}] Humör: ${e.mood}/10\n${e.content}`)
			.join('\n\n');

		const completion = await openai.chat.completions.create({
			model: 'gpt-4-turbo',
			messages: [
				{
					role: 'user',
					content: `Du är en empatisk psykolog som läser dagboksinlägg.\n\nAnalysera dessa dagboksinlägg från vecka ${weekNumber} år ${year}:\n\n${entriesText}\n\nSkriv en kort, känslig sammanfattning (2-3 meningar) om användarens mentala tillstånd denna vecka.\nFokusera på känslotrender och övergripande mönster, inte specifika fakta.\nVar uppmuntrande men ärlig. Skriv på svenska. Börja INTE med "Denna vecka".`
				}
			],
			max_tokens: 200,
			temperature: 0.7
		});

		return json({
			week: weekNumber,
			year,
			startDate,
			endDate,
			summary: (completion.choices[0]?.message?.content || 'Kunde inte generera sammanfattning.').trim(),
			moodTrend: { trend, average_mood: averageMood, start_mood: startMood, end_mood: endMood },
			entryCount: entries.length
		});
	} catch (err) {
		console.error('Weekly summary error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

