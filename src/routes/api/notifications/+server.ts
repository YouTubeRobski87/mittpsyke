import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

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

// GET – hämta notiser för inloggad användare
// Query params:
//   unread_only=true  – bara olästa
//   limit=N           – antal (default 30, 0 = bara räkna)
export const GET: RequestHandler = async ({ request, url }) => {
	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	const unreadOnly = url.searchParams.get('unread_only') === 'true';
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam === '0' ? 0 : Math.min(parseInt(limitParam ?? '30', 10) || 30, 100);

	// Räkna olästa
	const { count: unreadCount } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', user.id)
		.eq('is_read', false);

	if (limit === 0) {
		return json({ success: true, notifications: [], unread_count: unreadCount ?? 0 });
	}

	let query = supabase
		.from('notifications')
		.select('id, type, title, body, link, is_read, thread_id, reply_id, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (unreadOnly) {
		query = query.eq('is_read', false);
	}

	const { data, error: fetchError } = await query;
	if (fetchError) {
		console.error('notifications fetch error:', fetchError.message);
		return err('Kunde inte hämta notiser.', 500);
	}

	return json({
		success: true,
		notifications: data ?? [],
		unread_count: unreadCount ?? 0
	});
};

// PATCH – markera notiser som lästa
// Body: { id: string } | { all: true }
export const PATCH: RequestHandler = async ({ request }) => {
	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }
	const b = body as Record<string, unknown>;

	if (b.all === true) {
		// Markera alla som lästa
		const { error: updateError } = await supabase
			.from('notifications')
			.update({ is_read: true })
			.eq('user_id', user.id)
			.eq('is_read', false);
		if (updateError) return err(updateError.message, 500);
		return json({ success: true });
	}

	const id = typeof b.id === 'string' ? b.id.trim() : '';
	if (!id) return err('Ange id eller all: true.', 400);

	const { error: updateError } = await supabase
		.from('notifications')
		.update({ is_read: true })
		.eq('id', id)
		.eq('user_id', user.id);

	if (updateError) return err(updateError.message, 500);
	return json({ success: true });
};
