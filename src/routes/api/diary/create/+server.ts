import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';
import type {
	CreateDiaryErrorResponse,
	CreateDiaryRequestBody,
	CreateDiarySuccessResponse,
	DiaryRecord
} from '$lib/types';

function errorResponse(message: string, status: number) {
	const body: CreateDiaryErrorResponse = { success: false, error: message };
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

function validateBody(input: unknown): { ok: true; data: CreateDiaryRequestBody } | { ok: false; error: string } {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return { ok: false, error: 'Invalid request body.' };
	}

	const body = input as Partial<CreateDiaryRequestBody>;

	if (typeof body.text !== 'string' || body.text.trim().length === 0) {
		return { ok: false, error: 'Field "text" is required and must be a non-empty string.' };
	}

	if (body.mood !== undefined && body.mood !== null && typeof body.mood !== 'string') {
		return { ok: false, error: 'Field "mood" must be a string or null.' };
	}

	if (body.tags !== undefined && body.tags !== null) {
		if (!Array.isArray(body.tags) || body.tags.some((tag) => typeof tag !== 'string')) {
			return { ok: false, error: 'Field "tags" must be an array of strings or null.' };
		}
	}

	return {
		ok: true,
		data: {
			text: body.text.trim(),
			mood: body.mood ?? null,
			tags: body.tags ?? null
		}
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

	const { data: inserted, error: insertError } = await supabase
		.from('diary')
		.insert({
			user_id: user.id,
			text: validated.data.text,
			mood: validated.data.mood,
			tags: validated.data.tags
		})
		.select('id, user_id, text, mood, tags, created_at')
		.single();

	if (insertError || !inserted) {
		console.error('Failed to save diary entry:', insertError);
		if (insertError?.code === '42P01') {
			return errorResponse('Table "diary" does not exist.', 500);
		}
		if (insertError?.code === '42501') {
			return errorResponse('Not allowed to save diary entry.', 403);
		}
		return errorResponse(insertError?.message ?? 'Could not save note.', 500);
	}

	const response: CreateDiarySuccessResponse = {
		success: true,
		diary: inserted as DiaryRecord
	};

	return json(response, { status: 200 });
};
