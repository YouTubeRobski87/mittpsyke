import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { recordCurrentCompanionPresence } from '$lib/server/companion-presence';
import type { RequestHandler } from './$types';

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	return scheme?.toLowerCase() === 'bearer' && token?.trim() ? token.trim() : null;
}

export const POST: RequestHandler = async ({ request }) => {
	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) return json({ error: 'Unauthorized.' }, { status: 401 });

	const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseAnonKey) {
		return json({ error: 'Server configuration error.' }, { status: 500 });
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user || user.is_anonymous) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	try {
		const inserted = await recordCurrentCompanionPresence(supabase);
		return json({ inserted });
	} catch (error) {
		console.error('Companion presence record error:', error);
		return json({ error: 'Could not record companion presence.' }, { status: 500 });
	}
};
