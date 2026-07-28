import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { recordCurrentCompanionPresence } from '$lib/server/companion-presence';
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

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

	if (body.image_url !== undefined && body.image_url !== null && typeof body.image_url !== 'string') {
		return { ok: false, error: 'Field "image_url" must be a string or null.' };
	}

	if (body.video_path !== undefined && body.video_path !== null && typeof body.video_path !== 'string') {
		return { ok: false, error: 'Field "video_path" must be a string or null.' };
	}

	if (
		body.prompt_question !== undefined &&
		body.prompt_question !== null &&
		typeof body.prompt_question !== 'string'
	) {
		return { ok: false, error: 'Field "prompt_question" must be a string or null.' };
	}

	if (
		body.daily_question_id !== undefined &&
		body.daily_question_id !== null &&
		typeof body.daily_question_id !== 'string'
	) {
		return { ok: false, error: 'Field "daily_question_id" must be a string or null.' };
	}

	const dailyQuestionId = body.daily_question_id?.trim() || null;
	if (dailyQuestionId && !isUuid(dailyQuestionId)) {
		return { ok: false, error: 'Field "daily_question_id" must be a valid UUID or null.' };
	}

	return {
		ok: true,
		data: {
			text: body.text.trim(),
			mood: body.mood ?? null,
			tags: body.tags ?? null,
			image_url: body.image_url ?? null,
			video_path: body.video_path ?? null,
			prompt_question: body.prompt_question?.trim() || null,
			daily_question_id: dailyQuestionId
		}
	};
}

export const POST: RequestHandler = async ({ request }) => {
	if (!hasSensitiveConsentHeader(request)) {
		return errorResponse('Consent required for sensitive diary features.', 403);
	}

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

	let dailyQuestionId = validated.data.daily_question_id;
	if (dailyQuestionId) {
		const { data: question, error: questionError } = await supabase
			.from('daily_questions')
			.select('id')
			.eq('id', dailyQuestionId)
			.eq('user_id', user.id)
			.maybeSingle();

		if (questionError) {
			console.error('Failed to validate daily question ownership:', questionError);
			return errorResponse('Could not validate daily question.', 500);
		}

		if (!question) {
			return errorResponse('Invalid daily_question_id.', 400);
		}
	}

	const { data: inserted, error: insertError } = await supabase
		.from('diary')
		.insert({
			user_id: user.id,
			text: validated.data.text,
			mood: validated.data.mood,
			tags: validated.data.tags,
			image_url: validated.data.image_url,
			video_path: validated.data.video_path,
			prompt_question: validated.data.prompt_question,
			daily_question_id: dailyQuestionId
		})
		.select('id, user_id, text, mood, tags, image_url, video_path, prompt_question, daily_question_id, created_at')
		.single();

	if (!insertError && inserted) {
		try {
			await recordCurrentCompanionPresence(supabase);
		} catch (presenceError) {
			console.error('Could not record companion presence after diary save:', presenceError);
		}

		const response: CreateDiarySuccessResponse = {
			success: true,
			diary: inserted as DiaryRecord
		};

		return json(response, { status: 200 });
	}

	// We intentionally do not insert into legacy journal_entries anymore.
	// Writing to one table keeps Dagbok and Framsteg counters consistent.
	const tableMissing =
		insertError?.code === 'PGRST205' ||
		insertError?.code === '42P01' ||
		(insertError?.message ?? '').includes("Could not find the table 'public.diary'");

	if (tableMissing) {
		return errorResponse(
			`Databastabell saknas i Supabase-projektet "${projectRef}". Kontrollera att SUPABASE_URL/PUBLIC_SUPABASE_URL pekar mot projektet där "diary" skapades.`,
			500
		);
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
