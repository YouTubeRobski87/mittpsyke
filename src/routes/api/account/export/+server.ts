import { json } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { RateLimiter } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

// Självbetjänad dataexport.
//
// Två säkerhetsval bär hela filen:
//
// 1. Klienten skapas med ANON-nyckeln plus användarens egen access token, aldrig
//    med service role. RLS gäller därmed som för användaren själv, och en
//    felskriven fråga kan inte nå någon annans rader.
// 2. Varje fråga filtreras dessutom explicit på det verifierade user_id:t.
//    Det är inte dubbelarbete: schemat är inte enhetligt RLS-skyddat (se
//    community_posts, vars select-policy släpper in alla inloggade), så
//    filtret är den primära gränsen och RLS backstoppen.
//
// user_id kommer alltid från auth.getUser(), aldrig från request-body,
// query-parametrar eller headers som klienten kan styra.

// SvelteKit tillåter bara HTTP-verb och _-prefixade namn som named exports i
// +server-filer. Understrecket är alltså krav, inte stil.
export const _EXPORT_VERSION = '1';

/** Tabeller som exporteras, med de kolumner användaren själv har skapat. */
const EXPORT_TABLES = [
	{ key: 'dagboksinlagg', table: 'diary', columns: 'id, created_at, text, mood, tags, prompt_question, image_url, video_path', orderBy: 'created_at' },
	{ key: 'kvallsincheckningar', table: 'evening_checkins', columns: 'id, created_at, checkin_date, theme_id, thought, parking_bucket', orderBy: 'created_at' },
	{ key: 'foljeslagarsvar', table: 'companion_daily_answers', columns: 'answer_date, question_id, answer_id, created_at', orderBy: 'answer_date' },
	{ key: 'rorelse', table: 'daily_movement', columns: 'id, entry_date, step_count, cycled_today, cycled_km, created_at, updated_at', orderBy: 'entry_date' },
	{ key: 'veckoreflektioner', table: 'weekly_reflections', columns: 'id, week_start, words, quoted_sentence, movement, open_question, status, created_at', orderBy: 'week_start' },
	{ key: 'sparade_teman', table: 'user_memories', columns: 'id, content, created_at', orderBy: 'created_at' }
] as const;

/**
 * Fält ur user_metadata som användaren själv har satt i gränssnittet.
 * Medvetet en tillåtelselista: metadata kan innehålla interna flaggor och
 * leverantörsfält som inte hör hemma i en export.
 */
const METADATA_FIELDS = [
	'display_name',
	'birthday',
	'personal_goals',
	'progress_companion',
	'profile_theme',
	'ai_diary_context_enabled'
] as const;

// Ett exportanrop gör 8-9 databasfrågor och bygger hela svaret i minnet. Det är
// en användarinitierad nedladdning som ingen har legitim anledning att köra mer
// än ett fåtal gånger per minut, så fönstret hålls snävt. Nyckeln är det
// verifierade user-id:t från auth.getUser(), aldrig något klienten kan styra.
const EXPORT_RATE_LIMIT_WINDOW_MS = 60_000;
const EXPORT_RATE_LIMIT_MAX_REQUESTS = 5;
const exportRateLimiter = new RateLimiter(EXPORT_RATE_LIMIT_WINDOW_MS, EXPORT_RATE_LIMIT_MAX_REQUESTS);
const EXPORT_RATE_LIMIT_MESSAGE =
	'Du har begärt export för många gånger. Vänta en liten stund och försök igen.';

const errorResponse = (message: string, status: number) =>
	json({ success: false, error: message }, { status });

function getAccessToken(header: string | null): string | null {
	if (!header) return null;
	const [scheme, token] = header.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

function pickMetadata(metadata: unknown): Record<string, unknown> {
	if (typeof metadata !== 'object' || metadata === null) return {};
	const source = metadata as Record<string, unknown>;
	const picked: Record<string, unknown> = {};
	for (const field of METADATA_FIELDS) {
		if (source[field] !== undefined) picked[field] = source[field];
	}
	return picked;
}

/** Chatten hämtas i två steg eftersom messages saknar eget user_id. */
async function readConversations(supabase: SupabaseClient, userId: string) {
	const { data: conversations, error } = await supabase
		.from('conversations')
		.select('id, category, title, created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: true });
	if (error) throw error;
	if (!conversations?.length) return [];

	const { data: messages, error: messageError } = await supabase
		.from('messages')
		.select('id, conversation_id, role, content, created_at')
		.in(
			'conversation_id',
			conversations.map((conversation) => conversation.id)
		)
		.order('created_at', { ascending: true });
	if (messageError) throw messageError;

	return conversations.map((conversation) => ({
		...conversation,
		meddelanden: (messages ?? [])
			.filter((message) => message.conversation_id === conversation.id)
			.map(({ conversation_id: _conversationId, ...message }) => message)
	}));
}

export const GET: RequestHandler = async ({ request }) => {
	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) return errorResponse('Du behöver vara inloggad för att exportera din data.', 401);

	const supabaseUrl = privateEnv.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = privateEnv.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Missing Supabase configuration for data export.');
		return errorResponse('Server configuration error.', 500);
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();
	if (authError || !user) return errorResponse('Du behöver vara inloggad för att exportera din data.', 401);

	// Först efter verifierad identitet - gränsen knyts till användaren själv, och
	// de tunga frågorna nedan gatas innan de körs.
	if (exportRateLimiter.consume(`user:${user.id}`)) {
		return errorResponse(EXPORT_RATE_LIMIT_MESSAGE, 429);
	}

	const data: Record<string, unknown> = {
		konto: {
			e_post: user.email ?? null,
			skapat: user.created_at ?? null
		},
		installningar: pickMetadata(user.user_metadata)
	};

	try {
		for (const { key, table, columns, orderBy } of EXPORT_TABLES) {
			const { data: rows, error } = await supabase
				.from(table)
				.select(columns)
				.eq('user_id', user.id)
				.order(orderBy, { ascending: true });
			if (error) throw error;
			data[key] = rows ?? [];
		}

		const { data: sms, error: smsError } = await supabase
			.from('user_sms_preferences')
			.select('sms_opt_in, phone_number, sms_opt_in_at, sms_opt_out_at')
			.eq('user_id', user.id)
			.maybeSingle();
		if (smsError) throw smsError;
		data.sms_installningar = sms ?? null;

		data.chattar = await readConversations(supabase, user.id);
	} catch (error) {
		// Databasfelet loggas serversidan; svaret till klienten säger bara att det
		// misslyckades, så inga tabellnamn eller villkor läcker ut.
		console.error('Data export failed', error);
		return errorResponse('Kunde inte sammanställa din data just nu. Försök igen senare.', 500);
	}

	const exportedAt = new Date().toISOString();
	const body = JSON.stringify(
		{ export_version: _EXPORT_VERSION, exported_at: exportedAt, data },
		null,
		2
	);

	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="mittpsyke-data-${exportedAt.slice(0, 10)}.json"`,
			'Cache-Control': 'no-store'
		}
	});
};
