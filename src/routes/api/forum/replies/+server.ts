import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';
import type {
	CreateForumReplySuccessResponse,
	CreateForumReplyErrorResponse,
	UpdateForumReplySuccessResponse,
	UpdateForumReplyErrorResponse,
	DeleteForumReplySuccessResponse,
	DeleteForumReplyErrorResponse
} from '$lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REPLY_MAX_LENGTH = 2000;

function err(message: string, status: number) {
	const body: CreateForumReplyErrorResponse | UpdateForumReplyErrorResponse | DeleteForumReplyErrorResponse = {
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

// POST – skapa svar
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	if (!body || typeof body !== 'object' || Array.isArray(body)) return err('Invalid request body.', 400);
	const b = body as Record<string, unknown>;

	const threadId = typeof b.threadId === 'string' ? b.threadId.trim() : '';
	const replyBody = typeof b.body === 'string' ? b.body.trim() : '';
	const isAnonymous = Boolean(b.isAnonymous);

	if (!threadId || !UUID_REGEX.test(threadId)) return err('Ogiltig tråd-id.', 400);
	if (!replyBody) return err('Svaret kan inte vara tomt.', 400);
	if (replyBody.length > REPLY_MAX_LENGTH) return err(`Svaret får vara högst ${REPLY_MAX_LENGTH} tecken.`, 400);

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	// Verifiera att tråden finns
	const { data: thread } = await supabase
		.from('forum_threads')
		.select('id')
		.eq('id', threadId)
		.is('deleted_at', null)
		.eq('is_hidden', false)
		.maybeSingle();

	if (!thread) return err('Tråden hittades inte.', 404);

	// Hämta visningsnamn
	let displayName: string | null = null;
	if (!isAnonymous) {
		const { data: profile } = await supabase
			.from('profiles')
			.select('display_name')
			.eq('id', user.id)
			.maybeSingle();
		displayName = typeof profile?.display_name === 'string' ? profile.display_name.trim() || null : null;
	}

	const { data: reply, error: insertError } = await supabase
		.from('forum_replies')
		.insert({
			thread_id: threadId,
			user_id: user.id,
			body: replyBody,
			is_anonymous: isAnonymous,
			display_name: isAnonymous ? null : displayName
		})
		.select('id, thread_id, body, is_anonymous, display_name, created_at, updated_at')
		.single();

	if (insertError) {
		console.error('Forum reply insert error:', insertError);
		return err(insertError.message ?? 'Kunde inte spara svaret.', 500);
	}

	// Uppdatera reply_count på tråden (best-effort)
	await supabase
		.from('forum_threads')
		.update({ reply_count: (thread as { reply_count?: number }).reply_count ?? 0 + 1, last_reply_at: new Date().toISOString() })
		.eq('id', threadId);

	const response: CreateForumReplySuccessResponse = {
		success: true,
		reply: {
			id: reply.id,
			thread_id: reply.thread_id,
			body: reply.body,
			is_anonymous: reply.is_anonymous,
			display_name: reply.display_name,
			created_at: reply.created_at,
			updated_at: reply.updated_at
		}
	};

	return json(response, { status: 201 });
};

// PATCH – redigera eget svar
export const PATCH: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	if (!body || typeof body !== 'object' || Array.isArray(body)) return err('Invalid request body.', 400);
	const b = body as Record<string, unknown>;

	const replyId = typeof b.id === 'string' ? b.id.trim() : '';
	const newBody = typeof b.body === 'string' ? b.body.trim() : '';

	if (!replyId || !UUID_REGEX.test(replyId)) return err('Ogiltig svar-id.', 400);
	if (!newBody) return err('Svaret kan inte vara tomt.', 400);
	if (newBody.length > REPLY_MAX_LENGTH) return err(`Svaret får vara högst ${REPLY_MAX_LENGTH} tecken.`, 400);

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	// Verifiera ägande
	const { data: existing } = await supabase
		.from('forum_replies')
		.select('id, user_id')
		.eq('id', replyId)
		.is('deleted_at', null)
		.maybeSingle();

	if (!existing) return err('Svaret hittades inte.', 404);
	if (existing.user_id !== user.id) return err('Du kan bara redigera dina egna svar.', 403);

	const { data: updated, error: updateError } = await supabase
		.from('forum_replies')
		.update({ body: newBody, updated_at: new Date().toISOString() })
		.eq('id', replyId)
		.select('id, body, updated_at')
		.single();

	if (updateError) {
		console.error('Forum reply update error:', updateError);
		return err(updateError.message ?? 'Kunde inte uppdatera svaret.', 500);
	}

	const response: UpdateForumReplySuccessResponse = {
		success: true,
		reply: { id: updated.id, body: updated.body, updated_at: updated.updated_at }
	};
	return json(response);
};

// DELETE – mjukradera eget svar
export const DELETE: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	if (!body || typeof body !== 'object' || Array.isArray(body)) return err('Invalid request body.', 400);
	const b = body as Record<string, unknown>;
	const replyId = typeof b.id === 'string' ? b.id.trim() : '';

	if (!replyId || !UUID_REGEX.test(replyId)) return err('Ogiltig svar-id.', 400);

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	const { data: existing } = await supabase
		.from('forum_replies')
		.select('id, user_id')
		.eq('id', replyId)
		.is('deleted_at', null)
		.maybeSingle();

	if (!existing) return err('Svaret hittades inte.', 404);
	if (existing.user_id !== user.id) return err('Du kan bara radera dina egna svar.', 403);

	const { error: deleteError } = await supabase
		.from('forum_replies')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', replyId);

	if (deleteError) {
		console.error('Forum reply delete error:', deleteError);
		return err(deleteError.message ?? 'Kunde inte radera svaret.', 500);
	}

	const response: DeleteForumReplySuccessResponse = { success: true };
	return json(response);
};
