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
};

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
				categoryName: categoryNameById.get(typeof row.category_id === 'string' ? row.category_id : '') ?? 'Forum'
			}))
			.filter((thread) => thread.id.length > 0 && thread.title.length > 0);
	}

	return {
		latestForumThreads
	};
};
