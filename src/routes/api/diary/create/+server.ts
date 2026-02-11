import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';
import type {
	CreateDiaryErrorResponse,
	CreateDiaryRequestBody,
	CreateDiarySuccessResponse,
	DiaryRecord
} from '$lib/types';

const DIARY_TABLE = privateEnv.DIARY_TABLE_NAME?.trim() || 'diary';

type ValidatedDiaryPayload = {
	text: string;
	mood: string | null;
	tags: string[];
};

function getBearerToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
	return token.trim() || null;
}

function validatePayload(body: unknown): { data: ValidatedDiaryPayload | null; error: string | null } {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return { data: null, error: 'Invalid request body.' };
	}

	const input = body as CreateDiaryRequestBody;
	const text = typeof input.text === 'string' ? input.text.trim() : '';
	if (!text) {
		return { data: null, error: 'Field "text" is required.' };
	}

	if (input.mood !== undefined && input.mood !== null && typeof input.mood !== 'string') {
		return { data: null, error: 'Field "mood" must be a string when provided.' };
	}

	if (input.tags !== undefined) {
		const invalidTags = !Array.isArray(input.tags) || input.tags.some((tag) => typeof tag !== 'string');
		if (invalidTags) {
			return { data: null, error: 'Field "tags" must be an array of strings.' };
		}
	}

	const tags = Array.from(
		new Set((input.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0))
	);

	return {
		data: {
			text,
			mood: typeof input.mood === 'string' && input.mood.trim() ? input.mood.trim() : null,
			tags
		},
		error: null
	};
}

function serverError(message: string, status = 500) {
	const body: CreateDiaryErrorResponse = { success: false, error: message };
	return json(body, { status });
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return serverError('Invalid JSON body.', 400);
	}

	const validated = validatePayload(body);
	if (!validated.data) {
		return serverError(validated.error ?? 'Invalid request body.', 400);
	}

	const token = getBearerToken(request.headers.get('authorization'));
	if (!token) {
		return serverError('Missing or invalid Authorization header.', 401);
	}

	const supabaseUrl = privateEnv.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = privateEnv.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Supabase env vars are missing (SUPABASE_URL / SUPABASE_ANON_KEY).');
		return serverError('Server configuration error.');
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
		console.error('Unauthorized diary save attempt:', userError);
		return serverError('Unauthorized.', 401);
	}

	const insertPayload = {
		user_id: user.id,
		text: validated.data.text,
		mood: validated.data.mood,
		tags: validated.data.tags.length > 0 ? validated.data.tags : null,
		created_at: new Date().toISOString()
	};

	const { data: diary, error: insertError } = await supabase
		.from(DIARY_TABLE)
		.insert(insertPayload)
		.select('id, user_id, text, mood, tags, created_at')
		.single();

	if (insertError) {
		console.error('Diary insert error:', insertError);
		const status = insertError.code === '42501' ? 403 : 500;
		return serverError(insertError.message || 'Could not save note.', status);
	}

	const response: CreateDiarySuccessResponse = {
		success: true,
		diary: diary as DiaryRecord
	};

	return json(response, { status: 200 });
};
