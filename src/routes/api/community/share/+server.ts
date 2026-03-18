import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';
import type {
	CommunityPostRecord,
	CreateCommunityShareErrorResponse,
	CreateCommunityShareRequestBody,
	CreateCommunityShareSuccessResponse
} from '$lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorResponse(
	message: string,
	status: number,
	options: { alreadyShared?: boolean } = {}
) {
	const body: CreateCommunityShareErrorResponse = {
		success: false,
		error: message,
		...(options.alreadyShared ? { alreadyShared: true } : {})
	};
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

function validateBody(
	input: unknown
): { ok: true; data: CreateCommunityShareRequestBody } | { ok: false; error: string } {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return { ok: false, error: 'Invalid request body.' };
	}

	const body = input as Partial<CreateCommunityShareRequestBody>;
	const diaryEntryId = typeof body.diaryEntryId === 'string' ? body.diaryEntryId.trim() : '';

	if (!diaryEntryId || !UUID_REGEX.test(diaryEntryId)) {
		return { ok: false, error: 'Field "diaryEntryId" is required and must be a valid UUID.' };
	}

	return {
		ok: true,
		data: { diaryEntryId }
	};
}

export const POST: RequestHandler = async ({ request }) => {
	let parsedBody: unknown;
	try {
		parsedBody = await request.json();
	} catch {
		return errorResponse('Invalid JSON body.', 400);
	}

	const validated = validateBody(parsedBody);
	if (!validated.ok) {
		return errorResponse(validated.error, 400);
	}

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

	const { data: diaryEntry, error: diaryError } = await supabase
		.from('diary')
		.select('id, text, mood')
		.eq('id', validated.data.diaryEntryId)
		.eq('user_id', user.id)
		.maybeSingle();

	if (isMissingTableError(diaryError, 'diary')) {
		return errorResponse(
			'Databastabell saknas. Kontrollera att supabase/diary.sql är körd i ditt Supabase-projekt.',
			500
		);
	}

	if (diaryError) {
		console.error('Failed to load diary entry for community sharing:', diaryError);
		return errorResponse(diaryError.message ?? 'Kunde inte läsa dagboksinlägget.', 500);
	}

	if (!diaryEntry) {
		return errorResponse('Dagboksinlägget kunde inte hittas.', 404);
	}

	const { data: existingShare, error: existingShareError } = await supabase
		.from('community_posts')
		.select('id')
		.eq('diary_entry_id', validated.data.diaryEntryId)
		.is('deleted_at', null)
		.maybeSingle();

	if (isMissingTableError(existingShareError, 'community_posts')) {
		return errorResponse(
			'Gemenskapstabellen saknas. Kör supabase/community_posts.sql i Supabase innan du delar.',
			500
		);
	}

	if (existingShareError) {
		console.error('Failed to check existing community share:', existingShareError);
		return errorResponse(existingShareError.message ?? 'Kunde inte kontrollera tidigare delning.', 500);
	}

	if (existingShare) {
		return errorResponse('Det här inlägget är redan delat i Gemenskap.', 409, {
			alreadyShared: true
		});
	}

	const sharedContent = typeof diaryEntry.text === 'string' ? diaryEntry.text.trim() : '';
	if (!sharedContent) {
		return errorResponse('Inlägget är tomt och kan inte delas.', 400);
	}

	const { data: insertedShare, error: insertError } = await supabase
		.from('community_posts')
		.insert({
			user_id: user.id,
			diary_entry_id: diaryEntry.id,
			content: sharedContent,
			mood: typeof diaryEntry.mood === 'string' ? diaryEntry.mood : null
		})
		.select('id, user_id, diary_entry_id, content, mood, created_at, deleted_at')
		.single();

	if (isMissingTableError(insertError, 'community_posts')) {
		return errorResponse(
			'Gemenskapstabellen saknas. Kör supabase/community_posts.sql i Supabase innan du delar.',
			500
		);
	}

	if (insertError) {
		if (insertError.code === '23505') {
			return errorResponse('Det här inlägget är redan delat i Gemenskap.', 409, {
				alreadyShared: true
			});
		}
		if (insertError.code === '42501') {
			return errorResponse('Du har inte behörighet att dela det här inlägget.', 403);
		}
		console.error('Failed to create community share:', insertError);
		return errorResponse(insertError.message ?? 'Kunde inte dela inlägget just nu.', 500);
	}

	const response: CreateCommunityShareSuccessResponse = {
		success: true,
		share: insertedShare as CommunityPostRecord
	};
	return json(response, { status: 200 });
};
