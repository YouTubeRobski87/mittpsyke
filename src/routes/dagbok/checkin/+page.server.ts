import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type DiaryEntry = {
	id: string;
	content: string;
	created_at: string | null;
	tags: string[];
	mood: string | null;
	image_url: string | null;
	video_path: string | null;
	prompt_question: string | null;
};

const INITIAL_DIARY_ENTRY_LIMIT = 20;

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
		throw redirect(303, '/login');
	}

	let entries: DiaryEntry[] = [];
	let hasMoreEntries = false;

	const diaryQuery = await locals.supabase
		.from('diary')
		.select('id, text, created_at, tags, mood, image_url, video_path, prompt_question')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(INITIAL_DIARY_ENTRY_LIMIT + 1);

	if (isMissingTableError(diaryQuery.error, 'diary')) {
		const legacyQuery = await locals.supabase
			.from('journal_entries')
			.select('id, content, created_at, tags, mood')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(INITIAL_DIARY_ENTRY_LIMIT + 1);

		if (!legacyQuery.error) {
			const mappedEntries = (legacyQuery.data ?? []).map((row) => ({
				id: typeof row.id === 'string' ? row.id : '',
				content: typeof row.content === 'string' ? row.content : '',
				created_at: typeof row.created_at === 'string' ? row.created_at : null,
				tags: normalizeTags(row.tags),
				mood: typeof row.mood === 'string' ? row.mood : null,
				image_url: null, // Äldre tabell saknar bildkolumn
				video_path: null,
				prompt_question: null
			}));
			hasMoreEntries = mappedEntries.length > INITIAL_DIARY_ENTRY_LIMIT;
			entries = mappedEntries.slice(0, INITIAL_DIARY_ENTRY_LIMIT);
		}
	} else if (!diaryQuery.error) {
		const mappedEntries = (diaryQuery.data ?? []).map((row) => ({
			id: typeof row.id === 'string' ? row.id : '',
			content: typeof row.text === 'string' ? row.text : '',
			created_at: typeof row.created_at === 'string' ? row.created_at : null,
			tags: normalizeTags(row.tags),
			mood: typeof row.mood === 'string' ? row.mood : null,
			image_url: typeof row.image_url === 'string' ? row.image_url : null,
			video_path: typeof row.video_path === 'string' ? row.video_path : null,
			prompt_question: typeof row.prompt_question === 'string' ? row.prompt_question : null
		}));
		hasMoreEntries = mappedEntries.length > INITIAL_DIARY_ENTRY_LIMIT;
		entries = mappedEntries.slice(0, INITIAL_DIARY_ENTRY_LIMIT);
	}

	return {
		title: 'Dagbok',
		description: 'Skriv i din dagbok, följ ditt mående och spara dina tankar i lugn takt.',
		noindex: true,
		isLoggedIn: true,
		entries,
		hasMoreEntries
	};
};
