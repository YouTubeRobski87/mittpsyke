import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const ADMIN_USER_ID = 'f4f107ef-461a-4090-bc2f-6ddccc0cc64d';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function err(message: string, status: number) {
	return json({ success: false, error: message }, { status });
}

function getToken(authHeader: string | null): string | null {
	if (!authHeader) return null;
	const [scheme, token] = authHeader.split(' ');
	return scheme?.toLowerCase() === 'bearer' && token?.trim() ? token.trim() : null;
}

export const POST: RequestHandler = async ({ request }) => {
	// Verifiera admin-token
	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	const url = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const anon = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !anon || !serviceKey) return err('Serverkonfigurationsfel.', 500);

	// Verifiera att token tillhör admin-användaren
	const authClient = createClient(url, anon, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});
	const {
		data: { user },
		error: userError
	} = await authClient.auth.getUser();
	if (userError || !user || user.id !== ADMIN_USER_ID) return err('Åtkomst nekad.', 403);

	// Läs body
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return err('Ogiltig JSON.', 400);
	}
	if (!body || typeof body !== 'object' || Array.isArray(body)) return err('Ogiltig body.', 400);
	const b = body as Record<string, unknown>;

	const reportId = typeof b.reportId === 'string' ? b.reportId.trim() : null;
	const threadId = typeof b.threadId === 'string' ? b.threadId.trim() : null;
	const replyId = typeof b.replyId === 'string' ? b.replyId.trim() : null;

	if (!reportId || !UUID_REGEX.test(reportId)) return err('Ogiltigt reportId.', 400);
	if (!threadId && !replyId) return err('Ange threadId eller replyId.', 400);
	if (threadId && !UUID_REGEX.test(threadId)) return err('Ogiltigt threadId.', 400);
	if (replyId && !UUID_REGEX.test(replyId)) return err('Ogiltigt replyId.', 400);

	const admin = createClient(url, serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});

	const now = new Date().toISOString();

	// Mjukradera tråd eller svar
	if (threadId) {
		const { error: deleteError } = await admin
			.from('forum_threads')
			.update({ deleted_at: now })
			.eq('id', threadId)
			.is('deleted_at', null);
		if (deleteError) {
			console.error('Admin delete thread error:', deleteError);
			return err('Kunde inte radera tråden.', 500);
		}
	} else if (replyId) {
		const { error: deleteError } = await admin
			.from('forum_replies')
			.update({ deleted_at: now })
			.eq('id', replyId)
			.is('deleted_at', null);
		if (deleteError) {
			console.error('Admin delete reply error:', deleteError);
			return err('Kunde inte radera svaret.', 500);
		}
	}

	// Markera rapporten som löst
	const { error: resolveError } = await admin
		.from('forum_reports')
		.update({ resolved_at: now })
		.eq('id', reportId);
	if (resolveError) {
		console.error('Admin resolve report error:', resolveError);
		return err('Inlägget raderades men rapporten kunde inte markeras som löst.', 500);
	}

	return json({ success: true }, { status: 200 });
};
