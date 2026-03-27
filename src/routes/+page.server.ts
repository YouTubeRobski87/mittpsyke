import type { PageServerLoad } from './$types';

type LatestForumThread = {
	id: string;
	title: string;
	created_at: string;
	active_at: string;
	reply_count: number;
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
	let latestForumThreads: LatestForumThread[] = [];

	const { data: latestCreatedThreads, error: latestThreadsError } = await locals.supabase
		.from('forum_threads')
		.select('id, title, created_at')
		.is('deleted_at', null)
		.eq('is_hidden', false)
		.order('created_at', { ascending: false })
		.limit(50);

	if (latestThreadsError && !isMissingTableError(latestThreadsError, 'forum_threads')) {
		console.error('Homepage forum threads load error:', latestThreadsError);
	}

	const { data: recentReplies, error: recentRepliesError } = await locals.supabase
		.from('forum_replies')
		.select('thread_id, created_at')
		.is('deleted_at', null)
		.eq('is_hidden', false)
		.order('created_at', { ascending: false })
		.limit(200);

	if (recentRepliesError && !isMissingTableError(recentRepliesError, 'forum_replies')) {
		console.error('Homepage recent forum replies load error:', recentRepliesError);
	}

	const recentReplyThreadIds = Array.from(
		new Set(
			(recentReplies ?? [])
				.map((row) => (typeof row.thread_id === 'string' ? row.thread_id : ''))
				.filter((threadId) => threadId.length > 0)
		)
	);

	let recentlyActiveThreads:
		| Array<{
				id: string | null;
				title: string | null;
				created_at: string | null;
		  }>
		| null = null;

	if (recentReplyThreadIds.length > 0) {
		const { data: activeThreadRows, error: activeThreadsError } = await locals.supabase
			.from('forum_threads')
			.select('id, title, created_at')
			.in('id', recentReplyThreadIds)
			.is('deleted_at', null)
			.eq('is_hidden', false);

		if (activeThreadsError && !isMissingTableError(activeThreadsError, 'forum_threads')) {
			console.error('Homepage recently active threads load error:', activeThreadsError);
		} else {
			recentlyActiveThreads = activeThreadRows;
		}
	}

	const candidateThreads = new Map<
		string,
		{
			id: string;
			title: string;
			created_at: string;
		}
	>();

	for (const row of latestCreatedThreads ?? []) {
		const id = typeof row.id === 'string' ? row.id : '';
		const title = typeof row.title === 'string' ? row.title.trim() : '';
		const createdAt = typeof row.created_at === 'string' ? row.created_at : '';

		if (!id || !title) continue;

		candidateThreads.set(id, {
			id,
			title,
			created_at: createdAt
		});
	}

	for (const row of recentlyActiveThreads ?? []) {
		const id = typeof row.id === 'string' ? row.id : '';
		const title = typeof row.title === 'string' ? row.title.trim() : '';
		const createdAt = typeof row.created_at === 'string' ? row.created_at : '';

		if (!id || !title) continue;

		candidateThreads.set(id, {
			id,
			title,
			created_at: createdAt
		});
	}

	const candidateThreadIds = Array.from(candidateThreads.keys());
	const replyStatsByThread = new Map<string, { reply_count: number; last_reply_at: string }>();

	if (candidateThreadIds.length > 0) {
		const { data: replyRows, error: replyStatsError } = await locals.supabase
			.from('forum_replies')
			.select('thread_id, created_at')
			.in('thread_id', candidateThreadIds)
			.is('deleted_at', null)
			.eq('is_hidden', false);

		if (replyStatsError && !isMissingTableError(replyStatsError, 'forum_replies')) {
			console.error('Homepage forum reply stats load error:', replyStatsError);
		} else {
			for (const row of replyRows ?? []) {
				const threadId = typeof row.thread_id === 'string' ? row.thread_id : '';
				const createdAt = typeof row.created_at === 'string' ? row.created_at : '';

				if (!threadId) continue;

				const current = replyStatsByThread.get(threadId) ?? {
					reply_count: 0,
					last_reply_at: ''
				};

				replyStatsByThread.set(threadId, {
					reply_count: current.reply_count + 1,
					last_reply_at:
						current.last_reply_at && current.last_reply_at > createdAt
							? current.last_reply_at
							: createdAt
				});
			}
		}
	}

	latestForumThreads = Array.from(candidateThreads.values())
		.map((thread) => {
			const replyStats = replyStatsByThread.get(thread.id);
			return {
				id: thread.id,
				title: thread.title,
				created_at: thread.created_at,
				active_at: replyStats?.last_reply_at || thread.created_at,
				reply_count: replyStats?.reply_count ?? 0
			};
		})
		.sort((a, b) => {
			const aTime = Date.parse(a.active_at || a.created_at || '');
			const bTime = Date.parse(b.active_at || b.created_at || '');
			return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
		})
		.slice(0, 3);

	console.log('Homepage latestForumThreads', {
		latestCreatedThreads: latestCreatedThreads?.length ?? 0,
		recentReplyRows: recentReplies?.length ?? 0,
		candidateThreads: candidateThreadIds.length,
		returnedThreads: latestForumThreads
	});

	return {
		title: 'MittPsyke â€“ AI-dagbok fÃ¶r mental hÃ¤lsa',
		description:
			'Skriv dagbok med AI-stÃ¶d, spÃ¥ra ditt humÃ¶r och fÃ¶rstÃ¥ dina kÃ¤nslomÃ¶nster. MittPsyke Ã¤r din personliga digitala dagbok fÃ¶r vÃ¤lmÃ¥ende.',
		latestForumThreads
	};
};
