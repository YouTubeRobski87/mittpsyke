import type { PageServerLoad } from './$types';

type DiaryEntry = {
	id: string;
	content: string;
	created_at: string | null;
	tags: string[];
	mood: string | null;
};

function normalizeTags(value: unknown) {
	if (Array.isArray(value)) {
		return value
			.map((item) => (typeof item === 'string' ? item.trim() : ''))
			.filter(Boolean);
	}

	if (typeof value === 'string') {
		return value
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
	}

	return [];
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
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		return {
			isLoggedIn: false,
			entries: [] as DiaryEntry[],
			sharedEntryIds: [] as string[]
		};
	}

	let entries: DiaryEntry[] = [];
	let sharedEntryIds: string[] = [];

	const diaryQuery = await locals.supabase
		.from('diary')
		.select('id, text, created_at, tags, mood')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (isMissingTableError(diaryQuery.error, 'diary')) {
		const legacyQuery = await locals.supabase
			.from('journal_entries')
			.select('id, content, created_at, tags, mood')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		if (!legacyQuery.error) {
			entries = (legacyQuery.data ?? []).map((row) => ({
				id: typeof row.id === 'string' ? row.id : '',
				content: typeof row.content === 'string' ? row.content : '',
				created_at: typeof row.created_at === 'string' ? row.created_at : null,
				tags: normalizeTags(row.tags),
				mood: typeof row.mood === 'string' ? row.mood : null
			}));
		}
	} else if (!diaryQuery.error) {
		entries = (diaryQuery.data ?? []).map((row) => ({
			id: typeof row.id === 'string' ? row.id : '',
			content: typeof row.text === 'string' ? row.text : '',
			created_at: typeof row.created_at === 'string' ? row.created_at : null,
			tags: normalizeTags(row.tags),
			mood: typeof row.mood === 'string' ? row.mood : null
		}));
	}

	const sharesQuery = await locals.supabase
		.from('community_posts')
		.select('diary_entry_id')
		.eq('user_id', user.id)
		.is('deleted_at', null);

	if (!sharesQuery.error || isMissingTableError(sharesQuery.error, 'community_posts')) {
		sharedEntryIds = (sharesQuery.data ?? [])
			.map((row) => (typeof row.diary_entry_id === 'string' ? row.diary_entry_id : ''))
			.filter(Boolean);
	}

	return {
		isLoggedIn: true,
		entries,
		sharedEntryIds
	};
};
