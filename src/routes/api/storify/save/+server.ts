import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');
	const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

	if (!accessToken) {
		return new Response('Unauthorized', { status: 401 });
	}

	const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY!);

	const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

	if (authError || !user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { entry, tone, moodEmojis, energyScore } = await request.json();

	const { error } = await supabase.from('storify_entries').insert({
		user_id: user.id,
		content: entry,
		tone,
		mood_emojis: moodEmojis,
		energy_score: energyScore
	});

	if (error) {
		return new Response('Error', { status: 500 });
	}

	return new Response('OK');
};
