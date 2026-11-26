import { activeHelpfulReminders, HELPFUL_REMINDER_LABELS, HELPFUL_REMINDERS_KEY } from '$lib/progress-helpful-reminders';
import { loadHelpfulReminders } from '$lib/server/progress-helpful-reminders';
import { json } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { RateLimiter } from '$lib/server/rate-limit';
import { createServiceClient, isMissingTableError } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

// Självbetjänad dataexport.
//
// Två säkerhetsval bär hela filen:
//
// 1. Klienten skapas med ANON-nyckeln plus användarens egen access token, aldrig
//    med service role. RLS gäller därmed som för användaren själv, och en
//    felskriven fråga kan inte nå någon annans rader. Undantaget är de få
//    tabeller i _SERVICE_TABLES som saknar SELECT-policy för användaren; utan
//    service role skulle de ge tomt svar utan fel och exporten se fullständig
//    ut fast den inte är det.
// 2. Varje fråga filtreras dessutom explicit på det verifierade user_id:t.
//    Det är inte dubbelarbete: schemat är inte enhetligt RLS-skyddat (se
//    community_posts, vars select-policy släpper in alla inloggade), så
//    filtret är den primära gränsen och RLS backstoppen.
//
// user_id kommer alltid från auth.getUser(), aldrig från request-body,
// query-parametrar eller headers som klienten kan styra.
//
// Varje del hämtas för sig. Misslyckas en del kommer resten ändå med, men
// filen får fullstandig: false och en lista över saknade delar.

// SvelteKit tillåter bara HTTP-verb och _-prefixade namn som named exports i
// +server-filer. Understrecket är alltså krav, inte stil.
export const _EXPORT_VERSION = '4';

/**
 * Tabeller som exporteras, med de kolumner användaren själv har skapat.
 * userColumn anger vilken kolumn som knyter raden till användaren (standard
 * user_id). Varje tabell här har en RLS-policy för SELECT på egna rader;
 * en tabell utan sådan policy ger tomt resultat utan fel och hör inte hemma
 * här (se _SERVICE_TABLES).
 */
export const _EXPORT_TABLES: readonly ExportTable[] = [
	{ key: 'dagboksinlagg', table: 'diary', columns: 'id, created_at, text, mood, tags, prompt_question, image_url, video_path', orderBy: 'created_at' },
	{ key: 'kvallsincheckningar', table: 'evening_checkins', columns: 'id, created_at, checkin_date, theme_id, thought, parking_bucket', orderBy: 'created_at' },
	{ key: 'kreativa_stunder', table: 'creative_moments', columns: 'id, activity_type, occurred_at', orderBy: 'occurred_at' },
	{ key: 'foljeslagarsvar', table: 'companion_daily_answers', columns: 'answer_date, question_id, answer_id, created_at', orderBy: 'answer_date' },
	{ key: 'foljeslagarveckor', table: 'companion_presence_weeks', columns: 'week_start', orderBy: 'week_start' },
	{ key: 'rorelse', table: 'daily_movement', columns: 'id, entry_date, step_count, cycled_today, cycled_km, created_at, updated_at', orderBy: 'entry_date' },
	{ key: 'veckoreflektioner', table: 'weekly_reflections', columns: 'id, week_start, words, quoted_sentence, movement, open_question, status, created_at', orderBy: 'week_start' },
	{ key: 'dagens_fragor', table: 'daily_questions', columns: 'id, date, question_text, regenerations, created_at', orderBy: 'date' },
	{ key: 'sparade_teman', table: 'user_memories', columns: 'id, content, created_at', orderBy: 'created_at' },
	{ key: 'berattelser', table: 'storify_entries', columns: 'id, content, tone, mood_emojis, energy_score, created_at', orderBy: 'created_at' },
	// Chatthistoriken som synkas mellan enheter (per ämne), utöver chattar nedan.
	{ key: 'chatthistorik', table: 'chat_history', columns: 'topic, messages, updated_at', orderBy: 'updated_at' },
	// Gemenskapen: inlägg du delat och kommentarer du skrivit. RLS släpper bara
	// igenom rader som inte är borttagna (deleted_at är null).
	{ key: 'gemenskapsinlagg', table: 'community_posts', columns: 'id, diary_entry_id, content, mood, created_at', orderBy: 'created_at' },
	{ key: 'gemenskapskommentarer', table: 'community_comments', columns: 'id, post_id, body, created_at, updated_at', orderBy: 'created_at' },
	// Det tidigare forumet. Egna trådar och svar, även de du tagit bort.
	{ key: 'forumtradar', table: 'forum_threads', columns: 'id, category_id, title, body, is_anonymous, display_name, created_at, updated_at, deleted_at', orderBy: 'created_at' },
	{ key: 'forumsvar', table: 'forum_replies', columns: 'id, thread_id, body, is_anonymous, display_name, created_at, updated_at, deleted_at', orderBy: 'created_at' },
	{ key: 'foljda_kategorier', table: 'user_category_follows', columns: 'category_id, created_at', orderBy: 'created_at' },
	{ key: 'foljda_tradar', table: 'user_thread_follows', columns: 'thread_id, created_at', orderBy: 'created_at' },
	// actor_user_id utelämnas: det är en annan användares id.
	{ key: 'notiser', table: 'notifications', columns: 'id, type, title, body, link, is_read, thread_id, reply_id, created_at', orderBy: 'created_at' },
	{ key: 'feedback', table: 'feedback_submissions', columns: 'id, experience, what_worked, unclear, missing, use_again, other, created_at', orderBy: 'created_at' },
	{ key: 'profil', table: 'profiles', columns: 'display_name, created_at', orderBy: 'created_at', userColumn: 'id' },
	// Äldre dagbokstabell från innan diary fanns.
	{ key: 'aldre_anteckningar', table: 'journal_entries', columns: 'id, content, created_at', orderBy: 'created_at' }
];

/**
 * Tabeller utan SELECT-policy för användaren. De läses med service role, men
 * alltid filtrerade på det verifierade user-id:t från auth.getUser().
 */
export const _SERVICE_TABLES: readonly ExportTable[] = [
	{ key: 'ai_samtycken', table: 'user_ai_consents', columns: 'scope, status, policy_version, granted_at, revoked_at, updated_at', orderBy: 'scope' },
	{ key: 'forumrapporter', table: 'forum_reports', columns: 'id, thread_id, reply_id, reason, details, resolved_at, created_at', orderBy: 'created_at', userColumn: 'reporter_id' }
];

type PostgrestErrorLike = { code?: string | null; message?: string | null };

type ExportTable = {
	key: string;
	table: string;
	columns: string;
	orderBy: string;
	userColumn?: string;
};

/** Varför en del saknas i exporten. Visas för användaren i filen. */
type MissingReason = 'inte_tillganglig_an' | 'kunde_inte_hamtas';
type MissingSection = { del: string; orsak: MissingReason };

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
	'progress_theme_overrides',
	'profile_theme',
	'ai_diary_context_enabled'
] as const;

// Ett exportanrop gör flera databasfrågor och bygger hela svaret i minnet. Det är
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

	const settings = pickMetadata(user.user_metadata);
	const data: Record<string, unknown> = {
		konto: {
			e_post: user.email ?? null,
			skapat: user.created_at ?? null
		},
		installningar: settings
	};

	const missing: MissingSection[] = [];
	let succeeded = 0;

	// Varje del hämtas för sig. Ett fel i en del stoppar inte resten, men delen
	// listas som saknad och exporten markeras som ofullständig. En ofullständig
	// export får aldrig se ut som en fullständig.
	async function section<T>(key: string, table: string, load: () => Promise<T>): Promise<T | null> {
		try {
			const value = await load();
			succeeded += 1;
			return value;
		} catch (error) {
			const reason: MissingReason = isMissingTableError(error as PostgrestErrorLike, table)
				? 'inte_tillganglig_an'
				: 'kunde_inte_hamtas';
			// Serverloggen får tabell och kod, aldrig innehåll eller användar-id.
			console.error('Data export section failed', { section: key, reason, code: (error as PostgrestErrorLike)?.code });
			missing.push({ del: key, orsak: reason });
			return null;
		}
	}

	async function readTable(client: SupabaseClient, spec: ExportTable) {
		const { data: rows, error } = await client
			.from(spec.table)
			.select(spec.columns)
			.eq(spec.userColumn ?? 'user_id', user!.id)
			.order(spec.orderBy, { ascending: true });
		if (error) throw error;
		return rows ?? [];
	}

	const reminders = await section(HELPFUL_REMINDERS_KEY, 'user_helpful_reminders', () =>
		loadHelpfulReminders(supabase, user.id)
	);
	if (reminders) {
		settings[HELPFUL_REMINDERS_KEY] = activeHelpfulReminders(reminders).map((item) => HELPFUL_REMINDER_LABELS[item]);
	}

	for (const spec of _EXPORT_TABLES) {
		const rows = await section(spec.key, spec.table, () => readTable(supabase, spec));
		if (rows) data[spec.key] = rows;
	}

	const serviceClient = createServiceClient();
	for (const spec of _SERVICE_TABLES) {
		const rows = await section(spec.key, spec.table, async () => {
			if (!serviceClient) throw new Error('service client saknas');
			return readTable(serviceClient, spec);
		});
		if (rows) data[spec.key] = rows;
	}

	const sms = await section('sms_installningar', 'user_sms_preferences', async () => {
		const { data: row, error } = await supabase
			.from('user_sms_preferences')
			.select('sms_opt_in, phone_number, sms_opt_in_at, sms_opt_out_at')
			.eq('user_id', user.id)
			.maybeSingle();
		if (error) throw error;
		return { row: row ?? null };
	});
	if (sms) data.sms_installningar = sms.row;

	const chats = await section('chattar', 'conversations', () => readConversations(supabase, user.id));
	if (chats) data.chattar = chats;

	// Gick ingenting att hämta är filen meningslös. Då svarar vi med ett fel
	// i stället för en tom export.
	if (succeeded === 0) {
		return errorResponse('Kunde inte sammanställa din data just nu. Försök igen senare.', 500);
	}

	const complete = missing.length === 0;

	const exportedAt = new Date().toISOString();
	const body = JSON.stringify(
		{
			export_version: _EXPORT_VERSION,
			exported_at: exportedAt,
			fullstandig: complete,
			// Delar som saknas i den här filen. Tom lista betyder att allt kom med.
			saknade_delar: missing,
			data
		},
		null,
		2
	);

	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="mittpsyke-data-${exportedAt.slice(0, 10)}${complete ? '' : '-ofullstandig'}.json"`,
			'X-Export-Complete': complete ? 'true' : 'false',
			'Cache-Control': 'no-store'
		}
	});
};
