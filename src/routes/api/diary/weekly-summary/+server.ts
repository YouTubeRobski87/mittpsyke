// src/routes/api/diary/weekly-summary/+server.ts
import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { RequestHandler } from '@sveltejs/kit';
import { generateAIText } from '$lib/server/ai/text-generation';
import { buildWeeklySummarySafetyInstructions } from '$lib/server/ai/safety-instructions';

const FALLBACK_SUMMARY = 'Det gick inte att skapa en AI-sammanfattning just nu. Försök gärna igen om en liten stund.';

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
		const supabase = createClient(env.PUBLIC_SUPABASE_URL ?? '', env.PUBLIC_SUPABASE_ANON_KEY ?? '', {
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

		// AI-sammanfattningen är en extra krydda ovanpå humörstatistiken, som
		// redan är klar här. Om AI-tjänsten hänger/timar ut ska hela veckosvaret
		// (inklusive humörtrenden) fortfarande nå användaren, bara utan text.
		let summaryText = FALLBACK_SUMMARY;
		try {
			const result = await generateAIText({
				purpose: 'weekly-summary',
				systemInstructions: buildWeeklySummarySafetyInstructions(),
				messages: [
					{
						role: 'user',
						content: `Sammanfatta dagboksinlägg från vecka ${weekNumber} år ${year}.\n\n${entriesText}\n\nSkriv 2–3 meningar på svenska. Fokusera på känslotrender och övergripande mönster, inte specifika fakta. Var uppmuntrande men ärlig. Börja inte med "Denna vecka".`
					}
				],
				temperature: 0.7
			});
			summaryText = `AI-genererad reflektion: ${result.text}`;
		} catch {
			console.error('Weekly summary AI call failed');
		}

		return json({
			week: weekNumber,
			year,
			startDate,
			endDate,
			summary: summaryText,
			moodTrend: { trend, average_mood: averageMood, start_mood: startMood, end_mood: endMood },
			entryCount: entries.length
		});
	} catch (err) {
		console.error('Weekly summary error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

