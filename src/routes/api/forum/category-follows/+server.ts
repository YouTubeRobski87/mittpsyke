import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const VALID_CATEGORY_IDS = new Set([
	'angest-och-oro',
	'nedstamdhet-och-tunga-dagar',
	'stress-och-utmattning',
	'somn-och-nattankar',
	'relationer-och-ensamhet',
	'sjalvkansla-och-sjalvkritik',
	'trauma-och-svara-upplevelser',
	'framsteg-och-ljusglimtar'
]);

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

// POST – börja följa en kategori
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	const b = body as Record<string, unknown>;
	const categoryId = typeof b.categoryId === 'string' ? b.categoryId.trim() : '';
	if (!categoryId || !VALID_CATEGORY_IDS.has(categoryId)) return err('Ogiltig kategori.', 400);

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	const { error: insertError } = await supabase
		.from('user_category_follows')
		.insert({ user_id: user.id, category_id: categoryId });

	if (insertError) {
		if (insertError.code === '23505') {
			return json({ success: true, following: true });
		}
		return err(insertError.message ?? 'Kunde inte följa kategorin.', 500);
	}

	return json({ success: true, following: true }, { status: 201 });
};

// DELETE – sluta följa en kategori
export const DELETE: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	const b = body as Record<string, unknown>;
	const categoryId = typeof b.categoryId === 'string' ? b.categoryId.trim() : '';
	if (!categoryId || !VALID_CATEGORY_IDS.has(categoryId)) return err('Ogiltig kategori.', 400);

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Ej autentiserad.', 401);

	let supabase: ReturnType<typeof getSupabase>;
	try { supabase = getSupabase(token); } catch { return err('Server configuration error.', 500); }

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	const { error: deleteError } = await supabase
		.from('user_category_follows')
		.delete()
		.eq('user_id', user.id)
		.eq('category_id', categoryId);

	if (deleteError) return err(deleteError.message ?? 'Kunde inte sluta följa.', 500);

	return json({ success: true, following: false });
};
