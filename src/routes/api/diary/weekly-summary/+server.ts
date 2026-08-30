// src/routes/api/diary/weekly-summary/+server.ts
//
// Skickar flera sparade dagboksinlägg till AI och har därför ett EGET serverägt
// samtycke: scope diary_ai_weekly_summary, policyversion diary-weekly-summary-v1.
//
// Det är avsiktligt inte samma scope som /api/diary/reflect och
// /api/diary/checkin-reflection. Deras copy beskriver en reflektion på en
// enskild incheckning; den här routen behandlar en hel period. Ett granted
// diary_ai_reflection ger noll access här.
//
// Tidigare räckte den klientstyrda headern x-mittpsyke-sensitive-consent, som
// vem som helst kan sätta på en request. Den auktoriserar inte längre den här
// routen. Ordningen nedan är avsiktlig: användare, sedan samtycke, och först
// därefter läses dagboksinnehåll eller anropas någon AI-leverantör.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';
import { hasWeeklySummaryAiConsent } from '$lib/server/weekly-summary-ai-consent';
import { generateAIText } from '$lib/server/ai/text-generation';
import { buildWeeklySummaryRequest } from '$lib/server/ai/weekly-summary';

const FALLBACK_SUMMARY = 'Det gick inte att skapa en AI-sammanfattning just nu. Försök gärna igen om en liten stund.';

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const token = getAccessToken(request.headers.get('authorization'));
		if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

		const supabase = createTokenClient(token);
		if (!supabase) return json({ error: 'Server configuration error.' }, { status: 500 });

		const { data, error: authError } = await supabase.auth.getUser();
		if (authError || !data?.user) return json({ error: 'Unauthorized' }, { status: 401 });
		const user = data.user;

		// Samtycket läses med service-role, aldrig ur headers eller
		// user_metadata. Saknas nyckeln stängs routen, inte öppnas.
		const serviceClient = createServiceClient();
		if (!serviceClient) return json({ error: 'Server configuration error.' }, { status: 500 });

		if (!(await hasWeeklySummaryAiConsent(serviceClient, user.id))) {
			return json(
				{ error: 'Consent required for sensitive diary AI features.' },
				{ status: 403 }
			);
		}

		// Allt nedanför den här punkten rör användarens dagboksinnehåll.
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

		// AI-sammanfattningen är en extra krydda ovanpå humörstatistiken, som
		// redan är klar här. Om AI-tjänsten hänger/timar ut ska hela veckosvaret
		// (inklusive humörtrenden) fortfarande nå användaren, bara utan text.
		let summaryText = FALLBACK_SUMMARY;
		try {
			const result = await generateAIText(buildWeeklySummaryRequest(entries, weekNumber, year));
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

