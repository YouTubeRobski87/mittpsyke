import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { toStockholmDateKey } from '$lib/stockholm-date';
import type { RequestHandler } from './$types';
import type {
	DiaryStatsTimelineErrorResponse,
	DiaryStatsTimelinePoint,
	DiaryStatsTimelineSuccessResponse
} from '$lib/types';

type DiaryTimelineRow = {
	created_at: string | null;
	mood: string | null;
};

// Utan gräns läser den här frågan hela användarens dagbokshistorik vid varje
// anrop - obegränsat i tid, till skillnad från streak/heatmap som redan är
// begränsade. 2000 punkter räcker gott för en tidslinjegraf och matchar samma
// storleksordning som t.ex. diary/heatmap.
const STATS_TIMELINE_ROW_LIMIT = 2000;

function errorResponse(message: string, status: number) {
	const body: DiaryStatsTimelineErrorResponse = { success: false, error: message };
	return json(body, { status });
}

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;

	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) {
		return null;
	}

	return token.trim();
}

// Dygnet räknas i svensk tid, samma som diary/streak och diary/heatmap. Att
// klippa ISO-strängen gav UTC-dygn, vilket la inlägg strax efter midnatt på
// föregående dag och gjorde talen olika mellan sidorna.
function toDate(value: string | null): string | null {
	return toStockholmDateKey(value);
}

export const GET: RequestHandler = async ({ request }) => {
	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return errorResponse('Missing or invalid Authorization header.', 401);
	}

	const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY.');
		return errorResponse('Server configuration error.', 500);
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});

	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return errorResponse('Unauthorized.', 401);
	}

	// Hämtas nyast-först med gräns, sedan vänds ordningen - annars skulle en
	// gräns på en äldst-först-fråga tysta bort de senaste inläggen för
	// användare med väldigt många humörloggade dagar.
	const { data, error } = await supabase
		.from('diary')
		.select('created_at, mood')
		.eq('user_id', user.id)
		.not('mood', 'is', null)
		.order('created_at', { ascending: false })
		.limit(STATS_TIMELINE_ROW_LIMIT);

	if (error) {
		console.error('Failed to load mood timeline:', error);
		if (error.code === '42501') {
			return errorResponse('Not allowed to read diary statistics.', 403);
		}
		return errorResponse(error.message ?? 'Could not load diary statistics.', 500);
	}

	const rows = ((data ?? []) as DiaryTimelineRow[]).slice().reverse();
	const timeline: DiaryStatsTimelinePoint[] = rows
		.map((row) => {
			const date = toDate(row.created_at);
			const mood = typeof row.mood === 'string' ? row.mood.trim() : '';
			if (!date || !mood) return null;
			return { date, mood };
		})
		.filter((item): item is DiaryStatsTimelinePoint => item !== null);

	const response: DiaryStatsTimelineSuccessResponse = {
		success: true,
		data: timeline
	};

	return json(response, { status: 200 });
};
