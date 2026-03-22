import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';
import type {
	UpdateForumThreadSuccessResponse,
	UpdateForumThreadErrorResponse,
	DeleteForumThreadSuccessResponse,
	DeleteForumThreadErrorResponse
} from '$lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TITLE_MAX = 200;
const BODY_MIN = 10;

function err(message: string, status: number) {
	const body: UpdateForumThreadErrorResponse | DeleteForumThreadErrorResponse = {
		success: false,
		error: message
	};
	return json(body, { status });
}

function getToken(authHeader: string | null): string | null {
	if (!authHeader) return null;
	const [scheme, token] = authHeader.split(' ');
	return scheme?.toLowerCase() === 'bearer' && token?.trim() ? token.trim() : null;
}

function getSupabase(token: string) {
	const url = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const anon = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anon) throw new Error('Missing Supabase env vars');
	return createClient(url, anon, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});
}

// PATCH – redigera tråd
export const PATCH: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	if (!body || typeof body !== 'object' || Array.isArray(body)) return err('Invalid request body.', 400);
	const b = body as Record<string, unknown>;

	const threadId = typeof b.id === 'string' ? b.id.trim() : '';
	const title = typeof b.title === 'string' ? b.title.trim() : '';
	const newBody = typeof b.body === 'string' ? b.body.trim() : '';

	if (!threadId || !UUID_REGEX.test(threadId)) return err('Ogiltig tråd-id.', 400);
	if (title.length < 3) return err('Rubriken måste vara minst 3 tecken.', 400);
	if (title.length > TITLE_MAX) return err(`Rubriken får vara högst ${TITLE_MAX} tecken.`, 400);
	if (newBody.length < BODY_MIN) return err(`Texten måste vara minst ${BODY_MIN} tecken.`, 400);

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	// Verifiera ägande
	const { data: existing } = await supabase
		.from('forum_threads')
		.select('id, user_id')
		.eq('id', threadId)
		.is('deleted_at', null)
		.maybeSingle();

	if (!existing) return err('Tråden hittades inte.', 404);
	if (existing.user_id !== user.id) return err('Du kan bara redigera dina egna inlägg.', 403);

	const { data: updated, error: updateError } = await supabase
		.from('forum_threads')
		.update({ title, body: newBody, updated_at: new Date().toISOString() })
		.eq('id', threadId)
		.select('id, title, body, updated_at')
		.single();

	if (updateError) {
		console.error('Forum thread update error:', updateError);
		return err(updateError.message ?? 'Kunde inte uppdatera inlägget.', 500);
	}

	const response: UpdateForumThreadSuccessResponse = {
		success: true,
		thread: {
			id: updated.id,
			title: updated.title,
			body: updated.body,
			updated_at: updated.updated_at
		}
	};
	return json(response);
};

// DELETE – mjukradera tråd
export const DELETE: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	if (!body || typeof body !== 'object' || Array.isArray(body)) return err('Invalid request body.', 400);
	const b = body as Record<string, unknown>;
	const threadId = typeof b.id === 'string' ? b.id.trim() : '';

	if (!threadId || !UUID_REGEX.test(threadId)) return err('Ogiltig tråd-id.', 400);

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	const { data: existing } = await supabase
		.from('forum_threads')
		.select('id, user_id')
		.eq('id', threadId)
		.is('deleted_at', null)
		.maybeSingle();

	if (!existing) return err('Tråden hittades inte.', 404);
	if (existing.user_id !== user.id) return err('Du kan bara radera dina egna inlägg.', 403);

	const { error: deleteError } = await supabase
		.from('forum_threads')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', threadId);

	if (deleteError) {
		console.error('Forum thread delete error:', deleteError);
		return err(deleteError.message ?? 'Kunde inte radera inlägget.', 500);
	}

	const response: DeleteForumThreadSuccessResponse = { success: true };
	return json(response);
};
