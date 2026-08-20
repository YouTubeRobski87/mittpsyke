import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { buildDiaryNarrativeInsight, type DiaryInsightRow } from '$lib/server/diary-insight-analysis';
import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';

const INSIGHTS_ROW_LIMIT = 500;
const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

function parseMood(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number.parseFloat(value.replace(',', '.'));
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function getWeekdayExtremes(entries: DiaryInsightRow[]) {
	const byDay = new Map<string, number[]>();
	for (const day of WEEKDAYS) byDay.set(day, []);

	for (const entry of entries) {
		if (!entry.created_at) continue;
		const date = new Date(entry.created_at);
		if (Number.isNaN(date.getTime())) continue;
		const mood = parseMood(entry.mood);
		if (mood === null) continue;
		byDay.get(WEEKDAYS[date.getDay()])?.push(mood);
	}

	const averages = [...byDay.entries()]
		.filter(([, moods]) => moods.length > 0)
		.map(([day, moods]) => ({
			day,
			average: Math.round((moods.reduce((sum, mood) => sum + mood, 0) / moods.length) * 10) / 10,
			count: moods.length
		}))
		.sort((a, b) => b.average - a.average);

	return {
		bestDay: averages[0] ?? null,
		worstDay: averages.at(-1) ?? null
	};
}

export const GET: RequestHandler = async ({ request }) => {
	try {
		if (!hasSensitiveConsentHeader(request)) {
			return json({ error: 'Consent required for sensitive AI features.' }, { status: 403 });
		}

		const token = getAccessToken(request.headers.get('authorization'));
		if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

		const supabaseUrl = privateEnv.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = privateEnv.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
		if (!supabaseUrl || !supabaseAnonKey) {
			console.error('Missing Supabase configuration for diary insights.');
			return json({ error: 'Server configuration error.' }, { status: 500 });
		}

		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { autoRefreshToken: false, persistSession: false },
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();
		if (authError || !user) return json({ error: 'Unauthorized' }, { status: 401 });

		const { data: entries, error } = await supabase
			.from('diary')
			.select('created_at, mood, text, tags')
			.eq('user_id', user.id)
			// Begränsningen ska alltid prioritera det användaren nyligen lagt till.
			// Analysen sorterar tillbaka raderna kronologiskt innan den jämför
			// perioder, så den läser aldrig äldre data på bekostnad av nya mönster.
			.order('created_at', { ascending: false })
			.limit(INSIGHTS_ROW_LIMIT);

		if (error) return json({ error: error.message }, { status: 500 });

		const rows = ((entries ?? []) as DiaryInsightRow[])
			.slice()
			.sort((first, second) => (first.created_at ?? '').localeCompare(second.created_at ?? ''));
		// Den här vyn visar enbart deterministiska påståenden med synligt
		// underlag. Ingen språkmodell får formulera eller utvidga personliga
		// samband från dagbokstexten.
		const narrative = await buildDiaryNarrativeInsight(rows, { generateWithAi: false });
		const { bestDay, worstDay } = getWeekdayExtremes(rows);

		const legacyInsights = [...narrative.overview, ...narrative.patterns].slice(0, 6).map((item) => ({
			type: 'narrative_observation',
			title: item.title,
			description: item.description,
			icon: 'lightbulb'
		}));

		return json({
			insights: legacyInsights,
			bestDay,
			worstDay,
			emotionDistribution: {},
			aiSummary: narrative.storyParagraphs[0] ?? null,
			narrative
		});
	} catch (err) {
		console.error('Insights error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

