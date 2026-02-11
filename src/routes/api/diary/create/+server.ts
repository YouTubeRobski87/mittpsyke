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

type LegacyJournalRow = {
	id: string;
	user_id: string;
	content: string;
	mood: string | null;
	tags: string[] | null;
	created_at: string;
};

function errorResponse(message: string, status: number) {
	const body: CreateDiaryErrorResponse = { success: false, error: message };
	return json(body, { status });
}

function getProjectRefFromUrl(url: string): string {
	try {
		const hostname = new URL(url).hostname;
		return hostname.split('.')[0] || 'unknown';
	} catch {
		return 'unknown';
	}
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
	const projectRef = supabaseUrl ? getProjectRefFromUrl(supabaseUrl) : 'unknown';
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

	if (!insertError && inserted) {
		const response: CreateDiarySuccessResponse = {
			success: true,
			diary: inserted as DiaryRecord
		};

		return json(response, { status: 200 });
	}

	const tableMissing =
		insertError?.code === 'PGRST205' ||
		insertError?.code === '42P01' ||
		(insertError?.message ?? '').includes("Could not find the table 'public.diary'");

	if (tableMissing) {
		const { data: legacyInserted, error: legacyInsertError } = await supabase
			.from('journal_entries')
			.insert({
				user_id: user.id,
				content: validated.data.text,
				mood: validated.data.mood,
				tags: validated.data.tags
			})
			.select('id, user_id, content, mood, tags, created_at')
			.single();

		if (legacyInsertError || !legacyInserted) {
			console.error('Fallback insert into journal_entries failed:', legacyInsertError);
			const legacyTableMissing =
				legacyInsertError?.code === 'PGRST205' ||
				legacyInsertError?.code === '42P01' ||
				(legacyInsertError?.message ?? '').includes("Could not find the table 'public.journal_entries'");
			if (legacyTableMissing) {
				return errorResponse(
					`Databastabell saknas i Supabase-projektet "${projectRef}". Kontrollera att SUPABASE_URL/PUBLIC_SUPABASE_URL pekar mot projektet där "diary" skapades.`,
					500
				);
			}
			return errorResponse(legacyInsertError?.message ?? 'Could not save note.', 500);
		}

		const legacy = legacyInserted as LegacyJournalRow;
		const response: CreateDiarySuccessResponse = {
			success: true,
			diary: {
				id: legacy.id,
				user_id: legacy.user_id,
				text: legacy.content,
				mood: legacy.mood,
				tags: legacy.tags,
				created_at: legacy.created_at
			}
		};

		return json(response, { status: 200 });
	}

	if (insertError || !inserted) {
		console.error('Failed to save diary entry:', insertError);
		if (insertError?.code === '42501') {
			return errorResponse('Not allowed to save diary entry.', 403);
		}
		return errorResponse(insertError?.message ?? 'Could not save note.', 500);
	}
	return errorResponse('Could not save note.', 500);
};


