import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

type CommunityPost = {
	id: string;
	content: string;
	mood: string | null;
	created_at: string | null;
	isOwnPost: boolean;
	diaryEntryId: string | null;
	comments: CommunityComment[];
	commentsLoaded: boolean;
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

function parsePageParam(value: string | null) {
	const page = Number(value ?? '1');
	if (!Number.isFinite(page) || page < 1) return 1;
	return Math.floor(page);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/login');
	}

	const requestedPage = parsePageParam(url.searchParams.get('page'));
	const { count, error: countError } = await locals.supabase
		.from('community_posts')
		.select('id', { count: 'exact', head: true })
		.is('deleted_at', null);

	if (countError && !isMissingTableError(countError, 'community_posts')) {
		console.error('Gemenskap count error:', countError);
	}

	const totalItems = countError ? 0 : count ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
	const currentPage = Math.min(requestedPage, totalPages);
	const from = (currentPage - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	const { data: postsData, error: postsError } = await locals.supabase
		.from('community_posts')
		.select('id, content, mood, created_at, diary_entry_id, user_id')
		.is('deleted_at', null)
		.order('created_at', { ascending: false })
		.range(from, to);

	let items: CommunityPost[] = [];

	if (postsError && !isMissingTableError(postsError, 'community_posts')) {
		console.error('Gemenskap load error:', postsError);
	} else if (postsData) {
		items = postsData
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
				comments: [],
				commentsLoaded: false
			}))
			.filter((row) => row.id.length > 0 && row.content.trim().length > 0);
	}

	return {
		title: 'Gemenskap',
		description: 'En lugn och anonym plats för igenkänning, stöd och varsam bekräftelse.',
		items,
		currentPage,
		totalPages,
		totalItems,
		hasPreviousPage: currentPage > 1,
		hasNextPage: currentPage < totalPages
	};
};
