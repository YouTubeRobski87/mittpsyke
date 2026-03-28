import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type CommunityPost = {
	id: string;
	content: string;
	mood: string | null;
	created_at: string | null;
	isOwnPost: boolean;
	diaryEntryId: string | null;
	comments: CommunityComment[];
};

type CommunityComment = {
	id: string;
	postId: string;
	body: string;
	created_at: string | null;
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
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();
	const user = session?.user ?? null;

	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: postsData, error: postsError } = await locals.supabase
		.from('community_posts')
		.select('id, content, mood, created_at, diary_entry_id, user_id')
		.is('deleted_at', null)
		.order('created_at', { ascending: false })
		.limit(40);

	let posts: CommunityPost[] = [];

	if (postsError && !isMissingTableError(postsError, 'community_posts')) {
		console.error('Gemenskap load error:', postsError);
	} else if (postsData) {
		posts = postsData
			.map((row) => ({
				id: typeof row.id === 'string' ? row.id : '',
				content: typeof row.content === 'string' ? row.content : '',
				mood: typeof row.mood === 'string' ? row.mood : null,
				created_at: typeof row.created_at === 'string' ? row.created_at : null,
				isOwnPost: row.user_id === user.id,
				diaryEntryId:
					row.user_id === user.id && typeof row.diary_entry_id === 'string'
						? row.diary_entry_id
						: null,
				comments: []
			}))
			.filter((row) => row.id.length > 0 && row.content.trim().length > 0);
	}

	const postIds = posts.map((post) => post.id);
	const commentsByPostId = new Map<string, CommunityComment[]>();

	if (postIds.length > 0) {
		const { data: commentsData, error: commentsError } = await locals.supabase
			.from('community_comments')
			.select('id, post_id, body, created_at')
			.in('post_id', postIds)
			.is('deleted_at', null)
			.order('created_at', { ascending: true });

		if (commentsError && !isMissingTableError(commentsError, 'community_comments')) {
			console.error('Gemenskap comments load error:', commentsError);
		} else if (commentsData) {
			for (const row of commentsData) {
				const postId = typeof row.post_id === 'string' ? row.post_id : '';
				const body = typeof row.body === 'string' ? row.body.trim() : '';
				const id = typeof row.id === 'string' ? row.id : '';
				if (!postId || !id || !body) continue;

				const comment: CommunityComment = {
					id,
					postId,
					body,
					created_at: typeof row.created_at === 'string' ? row.created_at : null
				};

				const existingComments = commentsByPostId.get(postId) ?? [];
				existingComments.push(comment);
				commentsByPostId.set(postId, existingComments);
			}
		}
	}

	posts = posts.map((post) => ({
		...post,
		comments: commentsByPostId.get(post.id) ?? []
	}));

	return {
		title: 'Gemenskap',
		description: 'En lugn och anonym plats för igenkänning, stöd och varsam bekräftelse.',
		posts
	};
};
