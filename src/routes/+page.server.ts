import type { PageServerLoad } from './$types';

type ForumCategory = {
	id: string;
	name: string;
};

type LatestForumThread = {
	id: string;
	title: string;
	category_id: string;
	body: string;
	created_at: string;
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
	let latestForumThreads: Array<
		LatestForumThread & { categoryName: string; active_at: string; bodyPreview: string }
	> = [];

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
		.select('id, title, category_id, body, created_at')
		.is('deleted_at', null)
		.eq('is_hidden', false)
		.order('created_at', { ascending: false })
		.limit(12);

	if (threadsError && !isMissingTableError(threadsError, 'forum_threads')) {
		console.error('Homepage latest forum threads load error:', threadsError);
	} else if (threadRows) {
		const normalizedThreads = threadRows
			.map((row) => ({
				id: typeof row.id === 'string' ? row.id : '',
				title: typeof row.title === 'string' ? row.title.trim() : '',
				category_id: typeof row.category_id === 'string' ? row.category_id : '',
				body: typeof row.body === 'string' ? row.body.trim() : '',
				created_at: typeof row.created_at === 'string' ? row.created_at : ''
			}))
			.filter((thread) => thread.id.length > 0 && thread.title.length > 0);

		const threadIds = normalizedThreads.map((thread) => thread.id);
		const replyStatsByThread = new Map<string, { reply_count: number; last_reply_at: string }>();

		if (threadIds.length > 0) {
			const { data: replyRows, error: repliesError } = await locals.supabase
				.from('forum_replies')
				.select('thread_id, created_at')
				.in('thread_id', threadIds)
				.is('deleted_at', null)
				.eq('is_hidden', false);

			if (repliesError && !isMissingTableError(repliesError, 'forum_replies')) {
				console.error('Homepage forum replies stats load error:', repliesError);
			} else {
				for (const row of replyRows ?? []) {
					if (typeof row.thread_id !== 'string') continue;
					const createdAt = typeof row.created_at === 'string' ? row.created_at : '';
					const current = replyStatsByThread.get(row.thread_id) ?? {
						reply_count: 0,
						last_reply_at: ''
					};

					replyStatsByThread.set(row.thread_id, {
						reply_count: current.reply_count + 1,
						last_reply_at:
							current.last_reply_at && current.last_reply_at > createdAt
								? current.last_reply_at
								: createdAt
					});
				}
			}
		}

		latestForumThreads = normalizedThreads
			.map((thread) => {
				const replyStats = replyStatsByThread.get(thread.id);
				const active_at = replyStats?.last_reply_at || thread.created_at;

				return {
					...thread,
					reply_count: replyStats?.reply_count ?? 0,
					active_at,
					bodyPreview: truncateText(thread.body, 110),
					categoryName: categoryNameById.get(thread.category_id) ?? 'Forum'
				};
			})
			.sort((a, b) => {
				const aTime = Date.parse(a.active_at || a.created_at || '');
				const bTime = Date.parse(b.active_at || b.created_at || '');
				return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
			})
			.slice(0, 3);
	}

	console.info('Homepage forum threads result', {
		categories: categoryRows?.length ?? 0,
		threads: latestForumThreads.length,
		threadIds: latestForumThreads.map((thread) => thread.id)
	});

	return {
		title: 'MittPsyke – AI-dagbok för mental hälsa',
		description:
			'Skriv dagbok med AI-stöd, spåra ditt humör och förstå dina känslomönster. MittPsyke är din personliga digitala dagbok för välmående.',
		latestForumThreads
	};
};
