import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type CommunityPost = {
	id: string;
	content: string;
	mood: string | null;
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
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: postsData, error: postsError } = await locals.supabase
		.from('community_posts')
		.select('id, content, mood, created_at')
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
				created_at: typeof row.created_at === 'string' ? row.created_at : null
			}))
			.filter((row) => row.id.length > 0 && row.content.trim().length > 0);
	}

	return {
		title: 'Gemenskap',
		description: 'En lugn och anonym plats för igenkänning, stöd och varsam bekräftelse.',
		posts
	};
};
