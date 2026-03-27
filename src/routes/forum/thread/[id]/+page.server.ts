import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isMissingTableError(
	err: { code?: string | null; message?: string | null } | null | undefined,
	tableName: string
) {
	if (!err) return false;
	return (
		err.code === 'PGRST205' ||
		err.code === '42P01' ||
		(err.message ?? '').includes(`Could not find the table 'public.${tableName}'`)
	);
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	if (!UUID_REGEX.test(id)) {
		throw error(404, 'Tråden hittades inte.');
	}

	// Hämta tråd
	const { data: threadData, error: threadError } = await locals.supabase
		.from('forum_threads')
		.select('id, category_id, user_id, title, body, is_anonymous, display_name, created_at, updated_at')
		.eq('id', id)
		.is('deleted_at', null)
		.eq('is_hidden', false)
		.maybeSingle();

	if (threadError && !isMissingTableError(threadError, 'forum_threads')) {
		console.error('Forum thread load error:', threadError);
		throw error(500, 'Kunde inte ladda tråden.');
	}

	if (!threadData) {
		throw error(404, 'Tråden hittades inte.');
	}

	const thread = {
		id: String(threadData.id),
		category_id: String(threadData.category_id),
		user_id: threadData.user_id ? String(threadData.user_id) : null,
		title: String(threadData.title),
		body: String(threadData.body),
		is_anonymous: Boolean(threadData.is_anonymous),
		display_name: threadData.display_name ? String(threadData.display_name) : null,
		created_at: String(threadData.created_at),
		updated_at: String(threadData.updated_at)
	};

	// Hämta kategoriinfo
	const { data: catData } = await locals.supabase
		.from('forum_categories')
		.select('id, name, icon')
		.eq('id', thread.category_id)
		.maybeSingle();

	const category = catData
		? { id: String(catData.id), name: String(catData.name), icon: String(catData.icon) }
		: { id: thread.category_id, name: 'Samtalsrum', icon: '💬' };

	// Hämta svar
	type ReplyRow = {
		id: string;
		thread_id: string;
		user_id: string | null;
		body: string;
		is_anonymous: boolean;
		display_name: string | null;
		created_at: string;
		updated_at: string;
	};

	let replies: ReplyRow[] = [];

	const { data: repliesData, error: repliesError } = await locals.supabase
		.from('forum_replies')
		.select('id, thread_id, user_id, body, is_anonymous, display_name, created_at, updated_at')
		.eq('thread_id', id)
		.is('deleted_at', null)
		.eq('is_hidden', false)
		.order('created_at', { ascending: true });

	if (repliesError && !isMissingTableError(repliesError, 'forum_replies')) {
		console.error('Forum replies load error:', repliesError);
	} else if (repliesData) {
		replies = repliesData.map((row) => ({
			id: String(row.id),
			thread_id: String(row.thread_id),
			user_id: row.user_id ? String(row.user_id) : null,
			body: String(row.body),
			is_anonymous: Boolean(row.is_anonymous),
			display_name: row.display_name ? String(row.display_name) : null,
			created_at: String(row.created_at),
			updated_at: String(row.updated_at)
		})).filter((r) => r.id.length > 0 && r.body.trim().length > 0);
	}

	// Hämta inloggad användare
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	// display_name lagras i user_metadata (via auth.updateUser i inställningar)
	const userDisplayName: string | null = user
		? (typeof user.user_metadata?.display_name === 'string'
			? user.user_metadata.display_name.trim() || null
			: null)
		: null;

	// Kolla om inloggad användare följer tråden
	let isFollowing = false;
	if (user) {
		const { data: followData } = await locals.supabase
			.from('user_thread_follows')
			.select('id')
			.eq('user_id', user.id)
			.eq('thread_id', id)
			.maybeSingle();
		isFollowing = !!followData;
	}

	// Generera meta-description från brödtexten (max 155 tecken)
	const descriptionRaw = thread.body.replace(/\s+/g, ' ').trim();
	const description =
		descriptionRaw.length > 155
			? descriptionRaw.slice(0, 152) + '...'
			: descriptionRaw;

	return {
		title: thread.title,
		description,
		thread,
		category,
		replies,
		userId: user?.id ?? null,
		userDisplayName,
		isFollowing
	};
};
