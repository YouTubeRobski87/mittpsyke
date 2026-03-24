import type { PageServerLoad } from './$types';

type ForumCategory = {
	id: string;
	name: string;
};

type LatestForumThread = {
	id: string;
	title: string;
	category_id: string;
	reply_count: number;
	created_at: string;
	last_reply_at: string;
};

type FeaturedForumComment = {
	id: string;
	body: string;
	created_at: string;
	authorLabel: string;
};

type FeaturedForumThread = {
	id: string;
	title: string;
	reply_count: number;
	created_at: string;
	active_at: string;
	categoryName: string;
	bodyPreview: string;
	authorLabel: string;
	comments: FeaturedForumComment[];
};

function truncateText(text: string, maxLength: number) {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function isMissingTableError(
	error: { code?: string | null; message?: string | null } | null | undefined,
	tableName: string
) {
	if (!error) return false;
	return (
		error.code === 'PGRST205' ||
		error.code === '42P01' ||
		(error.message ?? '').includes(`Could not find the table 'public.${tableName}'`)
	);
}

export const load: PageServerLoad = async ({ locals }) => {
	let latestForumThreads: Array<LatestForumThread & { categoryName: string }> = [];
	let featuredForumThread: FeaturedForumThread | null = null;

	const { data: categoryRows, error: categoriesError } = await locals.supabase
		.from('forum_categories')
		.select('id, name');

	if (categoriesError && !isMissingTableError(categoriesError, 'forum_categories')) {
		console.error('Homepage forum categories load error:', categoriesError);
	}

	const categoryNameById = new Map<string, string>();
	for (const row of categoryRows ?? []) {
		if (typeof row.id === 'string' && typeof row.name === 'string') {
			categoryNameById.set(row.id, row.name);
		}
	}

	const { data: threadRows, error: threadsError } = await locals.supabase
		.from('forum_threads')
		.select('id, title, category_id, reply_count, created_at, last_reply_at')
		.is('deleted_at', null)
		.eq('is_hidden', false)
		.order('last_reply_at', { ascending: false, nullsFirst: false })
		.order('created_at', { ascending: false })
		.limit(3);

	if (threadsError && !isMissingTableError(threadsError, 'forum_threads')) {
		console.error('Homepage latest forum threads load error:', threadsError);
	} else if (threadRows) {
		latestForumThreads = threadRows
			.map((row) => ({
				id: typeof row.id === 'string' ? row.id : '',
				title: typeof row.title === 'string' ? row.title.trim() : '',
				category_id: typeof row.category_id === 'string' ? row.category_id : '',
				reply_count: typeof row.reply_count === 'number' ? row.reply_count : 0,
				created_at: typeof row.created_at === 'string' ? row.created_at : '',
				last_reply_at: typeof row.last_reply_at === 'string' ? row.last_reply_at : '',
				categoryName: categoryNameById.get(typeof row.category_id === 'string' ? row.category_id : '') ?? 'Forum'
			}))
			.filter((thread) => thread.id.length > 0 && thread.title.length > 0);
	}

	const latestThread = latestForumThreads[0];

	if (latestThread) {
		const { data: featuredThreadRow, error: featuredThreadError } = await locals.supabase
			.from('forum_threads')
			.select('id, title, body, category_id, reply_count, created_at, is_anonymous, display_name')
			.eq('id', latestThread.id)
			.is('deleted_at', null)
			.eq('is_hidden', false)
			.maybeSingle();

		if (featuredThreadError && !isMissingTableError(featuredThreadError, 'forum_threads')) {
			console.error('Homepage featured forum thread load error:', featuredThreadError);
		} else if (featuredThreadRow) {
			const { data: replyRows, error: repliesError } = await locals.supabase
				.from('forum_replies')
				.select('id, body, created_at, is_anonymous, display_name')
				.eq('thread_id', latestThread.id)
				.is('deleted_at', null)
				.eq('is_hidden', false)
				.order('created_at', { ascending: false })
				.limit(2);

			if (repliesError && !isMissingTableError(repliesError, 'forum_replies')) {
				console.error('Homepage featured forum replies load error:', repliesError);
			}

			const comments: FeaturedForumComment[] = (replyRows ?? [])
				.map((row) => ({
					id: typeof row.id === 'string' ? row.id : '',
					body: truncateText(typeof row.body === 'string' ? row.body.trim() : '', 120),
					created_at: typeof row.created_at === 'string' ? row.created_at : '',
					authorLabel:
						row.is_anonymous || typeof row.display_name !== 'string' || row.display_name.trim().length === 0
							? 'Anonym'
							: row.display_name.trim()
				}))
				.filter((comment) => comment.id.length > 0 && comment.body.length > 0);

			featuredForumThread = {
				id: String(featuredThreadRow.id),
				title: String(featuredThreadRow.title),
				reply_count: typeof featuredThreadRow.reply_count === 'number' ? featuredThreadRow.reply_count : 0,
				created_at: String(featuredThreadRow.created_at),
				active_at: latestThread.last_reply_at || String(featuredThreadRow.created_at),
				categoryName: categoryNameById.get(String(featuredThreadRow.category_id)) ?? 'Forum',
				bodyPreview: truncateText(String(featuredThreadRow.body ?? '').trim(), 140),
				authorLabel:
					featuredThreadRow.is_anonymous ||
					typeof featuredThreadRow.display_name !== 'string' ||
					featuredThreadRow.display_name.trim().length === 0
						? 'Anonym'
						: featuredThreadRow.display_name.trim(),
				comments
			};
		}
	}

	return {
		latestForumThreads,
		featuredForumThread
	};
};
