import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function err(message: string, status: number) {
	return json({ success: false, error: message }, { status });
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

// POST – börja följa en tråd
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	const b = body as Record<string, unknown>;
	const threadId = typeof b.threadId === 'string' ? b.threadId.trim() : '';
	if (!threadId || !UUID_REGEX.test(threadId)) return err('Ogiltig tråd-id.', 400);

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	const { error: insertError } = await supabase
		.from('user_thread_follows')
		.insert({ user_id: user.id, thread_id: threadId });

	if (insertError) {
		if (insertError.code === '23505') {
			// Redan följt – returnera success ändå
			return json({ success: true, following: true });
		}
		return err(insertError.message ?? 'Kunde inte följa tråden.', 500);
	}

	return json({ success: true, following: true }, { status: 201 });
};

// DELETE – sluta följa en tråd
export const DELETE: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	const b = body as Record<string, unknown>;
	const threadId = typeof b.threadId === 'string' ? b.threadId.trim() : '';
	if (!threadId || !UUID_REGEX.test(threadId)) return err('Ogiltig tråd-id.', 400);

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	const { error: deleteError } = await supabase
		.from('user_thread_follows')
		.delete()
		.eq('user_id', user.id)
		.eq('thread_id', threadId);

	if (deleteError) return err(deleteError.message ?? 'Kunde inte sluta följa.', 500);

	return json({ success: true, following: false });
};
