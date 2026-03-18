import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';
import type {
	CommunityMySharesErrorResponse,
	CommunityMySharesSuccessResponse
} from '$lib/types';

function errorResponse(message: string, status: number) {
	const body: CommunityMySharesErrorResponse = { success: false, error: message };
	return json(body, { status });
}

function successResponse(diaryEntryIds: string[]) {
	const body: CommunityMySharesSuccessResponse = {
		success: true,
		diaryEntryIds
	};
	return json(body, { status: 200 });
}

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;

	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) {
		return null;
	}

	return token.trim();
}

function isMissingTableError(
	error: { code?: string | null; message?: string | null } | null | undefined,
	tableName: string
) {
	if (!error) return false;
	return (
		error.code === 'PGRST205' ||
		error.code === '42P01' ||
		(error.message ?? '').includes(`Could not find the table 'public.${tableName}'`)
	);
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
		.from('community_posts')
		.select('diary_entry_id')
		.eq('user_id', user.id)
		.is('deleted_at', null);

	if (isMissingTableError(error, 'community_posts')) {
		// Safe fallback before migration is applied.
		return successResponse([]);
	}

	if (error) {
		console.error('Failed to load user community shares:', error);
		return errorResponse(error.message ?? 'Kunde inte läsa delningsstatus just nu.', 500);
	}

	const diaryEntryIds = (data ?? [])
		.map((row) => (typeof row.diary_entry_id === 'string' ? row.diary_entry_id : ''))
		.filter(Boolean);

	return successResponse(diaryEntryIds);
};
