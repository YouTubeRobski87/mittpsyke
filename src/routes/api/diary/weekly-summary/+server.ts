// src/routes/api/diary/weekly-summary/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY
});

interface DiaryEntry {
	date: string;
	mood: number;
	content: string;
}

interface MoodTrend {
	trend: 'improving' | 'declining' | 'stable';
	average_mood: number;
	start_mood: number;
	end_mood: number;
}

interface WeeklySummaryResponse {
	week: number;
	year: number;
	startDate: string;
	endDate: string;
	summary: string;
	moodTrend: MoodTrend;
	entryCount: number;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Hämta user_id från session
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;

		// Hämta request body
		const body = await request.json();
		const { startDate, endDate } = body;

		if (!startDate || !endDate) {
			return json({ error: 'Missing startDate or endDate' }, { status: 400 });
		}

		// Hämta alla inlägg mellan dessa datum
		const { data: entries, error } = await supabase
			.from('diary')
			.select('date, mood, content')
			.eq('user_id', userId)
			.gte('date', startDate)
			.lte('date', endDate)
			.order('date', { ascending: true });

		if (error) {
			console.error('Supabase error:', error);
			return json({ error: error.message }, { status: 500 });
		}

		if (!entries || entries.length === 0) {
			return json(
				{
					week: 0,
					year: new Date().getFullYear(),
					startDate,
					endDate,
					summary: 'Inga inlägg denna vecka.',
					moodTrend: {
						trend: 'stable',
						average_mood: 0,
						start_mood: 0,
						end_mood: 0
					},
					entryCount: 0
				},
				{ status: 200 }
			);
		}

		// Beräkna mood trend
		const moods = (entries as DiaryEntry[]).map((e) => e.mood);
		const averageMood = Math.round(moods.reduce((a, b) => a + b) / moods.length);
		const startMood = moods[0];
		const endMood = moods[moods.length - 1];

		let moodTrendType: 'improving' | 'declining' | 'stable' = 'stable';
		if (endMood > startMood + 1) moodTrendType = 'improving';
		else if (endMood < startMood - 1) moodTrendType = 'declining';

		// Förbered text för OpenAI
		const entriesText = (entries as DiaryEntry[])
			.map((e) => `[${e.date}] Humör: ${e.mood}/10\n${e.content}`)
			.join('\n\n');

		// Hämta veckonummer
		const startDateObj = new Date(startDate);
		const weekNumber = getWeekNumber(startDateObj);
		const year = startDateObj.getFullYear();

		// Skapa prompt för OpenAI
		const prompt = `Du är en empatisk psykolog som läser dagboksinlägg. 

Analysera dessa dagboksinlägg från vecka ${weekNumber} år ${year}:

${entriesText}

Skriv en kort, känslig sammanfattning (2-3 meningar) om användarens mentala tillstånd denna vecka. 
Fokusera på känslotrender och övergripande mönster, inte specifika fakta från inläggen.
Var uppmuntrande men ärlig.
Skriv på svenska.
Börja INTE med "Denna vecka" eller liknande - gå direkt in i sammanfattningen.`;

		// Anropa OpenAI
		const completion = await openai.chat.completions.create({
			model: 'gpt-4-turbo',
			messages: [
				{
					role: 'user',
					content: prompt
				}
			],
			max_tokens: 200,
			temperature: 0.7
		});

		const summary =
			completion.choices[0]?.message?.content || 'Kunde inte generera sammanfattning.';

		const response: WeeklySummaryResponse = {
			week: weekNumber,
			year,
			startDate,
			endDate,
			summary: summary.trim(),
			moodTrend: {
				trend: moodTrendType,
				average_mood: averageMood,
				start_mood: startMood,
				end_mood: endMood
			},
			entryCount: entries.length
		};

		return json(response);
	} catch (err) {
		console.error('Weekly summary error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

/**
 * Beräkna veckonummer från ett datum
 */
function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
