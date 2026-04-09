import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');
	const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

	if (!accessToken) {
		console.error('[storify/save] Inget Bearer-token i Authorization-headern.');
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('[storify/save] Saknar PUBLIC_SUPABASE_URL eller PUBLIC_SUPABASE_ANON_KEY.');
		return new Response(JSON.stringify({ error: 'Serverkonfigurationsfel.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Anon-key + token i Authorization-header — samma mönster som /api/storify/generate
	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${accessToken}` } }
	});

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		console.error('[storify/save] Auth fel:', authError?.message ?? 'ingen user');
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const body = (await request.json()) as {
		entry?: string;
		tone?: string;
		moodEmojis?: string[];
		energyScore?: number;
	};
	const { entry, tone, moodEmojis, energyScore } = body;

	if (!entry?.trim()) {
		console.error('[storify/save] entry är tomt – ingenting att spara.');
		return new Response(JSON.stringify({ error: 'Inget innehåll att spara.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	console.log(
		'[storify/save] Sparar för user:',
		user.id,
		'| tone:',
		tone,
		'| content length:',
		entry.length
	);

	// Spara till storify_entries (eget format med ton m.m.)
	const { error: storifyError } = await supabase.from('storify_entries').insert({
		user_id: user.id,
		content: entry,
		tone,
		mood_emojis: moodEmojis ?? [],
		energy_score: energyScore ?? null
	});

	if (storifyError) {
		console.error(
			'[storify/save] storify_entries insert fel:',
			storifyError.message,
			'| code:', storifyError.code,
			'| details:', storifyError.details,
			'| hint:', storifyError.hint
		);
		return new Response(JSON.stringify({ error: storifyError.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Dual-write till diary-tabellen så inlägget syns i /dagbok/checkin.
	// diary.text = innehållet, mood = tonens id, tags = ['dagars-avtryck'] för filtrering.
	const { error: diaryError } = await supabase.from('diary').insert({
		user_id: user.id,
		text: entry,
		mood: tone ?? null,
		tags: ['dagars-avtryck']
	});

	if (diaryError) {
		// Logga men returnera inte fel — storify-inlägget sparades korrekt.
		console.error(
			'[storify/save] diary insert fel:',
			diaryError.message,
			'| code:', diaryError.code,
			'| details:', diaryError.details
		);
	}

	console.log('[storify/save] Sparat OK för user:', user.id);
	return new Response(JSON.stringify({ ok: true }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
