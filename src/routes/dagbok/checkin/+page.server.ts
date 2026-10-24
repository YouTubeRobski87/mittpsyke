import { redirect } from '@sveltejs/kit';
import { readLinkedEntryId, type LinkedEntryResult } from '$lib/diary-entry-link';
import type { LoadStatus } from '$lib/load-state';
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

function mapDiaryRow(row: Record<string, unknown>): DiaryEntry {
	return {
		id: typeof row.id === 'string' ? row.id : '',
		content: typeof row.text === 'string' ? row.text : '',
		created_at: typeof row.created_at === 'string' ? row.created_at : null,
		tags: normalizeTags(row.tags),
		mood: typeof row.mood === 'string' ? row.mood : null,
		image_url: typeof row.image_url === 'string' ? row.image_url : null,
		video_path: typeof row.video_path === 'string' ? row.video_path : null,
		prompt_question: typeof row.prompt_question === 'string' ? row.prompt_question : null
	};
}

/**
 * Anteckningen som en länk från Framsteg pekar ut. 'found' bär raden, oavsett
 * om den redan finns i listan eller hämtades för sig. 'missing' betyder bara
 * att den inte gick att visa just nu, inte varför.
 */
export type LinkedDiaryEntry = LinkedEntryResult<DiaryEntry>;

type LinkedEntryClient = App.Locals['supabase'];

async function findLinkedEntry(
	supabase: LinkedEntryClient,
	userId: string,
	entryId: string | null,
	entries: DiaryEntry[]
): Promise<LinkedDiaryEntry> {
	if (!entryId) return { status: 'none' };
	const inList = entries.find((entry) => entry.id === entryId);
	if (inList) return { status: 'found', entry: inList };

	// Äldre än första sidan: hämta just den raden. user_id ligger med som
	// extra skydd ovanpå RLS.
	const { data, error } = await supabase
		.from('diary')
		.select('id, text, created_at, tags, mood, image_url, video_path, prompt_question')
		.eq('id', entryId)
		.eq('user_id', userId)
		.maybeSingle();

	if (error || !data) {
		if (error) console.error('Dagbok: kunde inte läsa länkad anteckning', { code: error.code });
		return { status: 'missing' };
	}
	const entry = mapDiaryRow(data as Record<string, unknown>);
	return entry.id ? { status: 'found', entry } : { status: 'missing' };
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/login');
	}

	let entries: DiaryEntry[] = [];
	let hasMoreEntries = false;
	// En tom lista får inte betyda "kunde inte hämta". Felet följer med till
	// klienten så att den kan försöka igen i stället för att visa tomt läge.
	let entriesStatus: LoadStatus = 'ready';

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
		} else {
			console.error('Dagbok: kunde inte läsa journal_entries', { code: legacyQuery.error.code });
			entriesStatus = 'error';
		}
	} else if (diaryQuery.error) {
		console.error('Dagbok: kunde inte läsa diary', { code: diaryQuery.error.code });
		entriesStatus = 'error';
	} else {
		const mappedEntries = (diaryQuery.data ?? []).map(mapDiaryRow);
		hasMoreEntries = mappedEntries.length > INITIAL_DIARY_ENTRY_LIMIT;
		entries = mappedEntries.slice(0, INITIAL_DIARY_ENTRY_LIMIT);
	}

	// Bara när listan gick att läsa. Vid ett läsfel visar sidan felet, inte en
	// separat "hittar inte"-rad som kunde misstas för att anteckningen är borta.
	const linkedEntry: LinkedDiaryEntry =
		entriesStatus === 'ready'
			? await findLinkedEntry(locals.supabase, user.id, readLinkedEntryId(url?.searchParams), entries)
			: { status: 'none' };

	return {
		title: 'Dagbok',
		description: 'Skriv i din dagbok, följ ditt mående och spara dina tankar i lugn takt.',
		noindex: true,
		isLoggedIn: true,
		entries,
		hasMoreEntries,
		entriesStatus,
		linkedEntry
	};
};
