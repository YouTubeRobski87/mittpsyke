import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
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

function toDate(value: string | null): string | null {
	if (!value) return null;
	const date = value.slice(0, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
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

	const { data, error } = await supabase
		.from('diary')
		.select('created_at, mood')
		.eq('user_id', user.id)
		.not('mood', 'is', null)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Failed to load mood timeline:', error);
		if (error.code === '42501') {
			return errorResponse('Not allowed to read diary statistics.', 403);
		}
		return errorResponse(error.message ?? 'Could not load diary statistics.', 500);
	}

	const rows = (data ?? []) as DiaryTimelineRow[];
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
