import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type DiaryEntry = {
	id: string;
	content: string;
	created_at: string | null;
	tags: string[];
	mood: string | null;
	image_url: string | null;
};

type DailyMovementEntry = {
	entryDate: string;
	stepCount: number | null;
	cycledToday: boolean;
	cycledKm: number | null;
	updatedAt: string | null;
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
		data: { session }
	} = await locals.supabase.auth.getSession();
	const user = session?.user ?? null;

	if (!user) {
		throw redirect(303, '/login');
	}

	let entries: DiaryEntry[] = [];
	let sharedEntryIds: string[] = [];
	let movementToday: DailyMovementEntry | null = null;
	let movementWeek: DailyMovementEntry[] = [];
	let hasMoreEntries = false;

	const diaryQuery = await locals.supabase
		.from('diary')
		.select('id, text, created_at, tags, mood, image_url')
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
				image_url: null // Äldre tabell saknar bildkolumn
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
			image_url: typeof row.image_url === 'string' ? row.image_url : null
		}));
		hasMoreEntries = mappedEntries.length > INITIAL_DIARY_ENTRY_LIMIT;
		entries = mappedEntries.slice(0, INITIAL_DIARY_ENTRY_LIMIT);
	}

	const visibleEntryIds = entries.map((entry) => entry.id).filter(Boolean);
	if (visibleEntryIds.length > 0) {
		const sharesQuery = await locals.supabase
			.from('community_posts')
			.select('diary_entry_id')
			.eq('user_id', user.id)
			.in('diary_entry_id', visibleEntryIds)
			.is('deleted_at', null);

		if (!sharesQuery.error || isMissingTableError(sharesQuery.error, 'community_posts')) {
			sharedEntryIds = (sharesQuery.data ?? [])
				.map((row) => (typeof row.diary_entry_id === 'string' ? row.diary_entry_id : ''))
				.filter(Boolean);
		}
	}

	const today = new Date();
	const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
	const weekStart = new Date(today);
	weekStart.setDate(today.getDate() - 6);
	const weekStartKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

	const movementTodayQuery = await locals.supabase
		.from('daily_movement')
		.select('entry_date, step_count, cycled_today, cycled_km, updated_at')
		.eq('user_id', user.id)
		.eq('entry_date', todayKey)
		.maybeSingle();

	if (!movementTodayQuery.error) {
		const row = movementTodayQuery.data;
		if (row) {
			movementToday = {
				entryDate: typeof row.entry_date === 'string' ? row.entry_date : todayKey,
				stepCount: typeof row.step_count === 'number' ? row.step_count : null,
				cycledToday: row.cycled_today === true,
				cycledKm: typeof row.cycled_km === 'number' ? row.cycled_km : null,
				updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null
			};
		}
	}

	const movementWeekQuery = await locals.supabase
		.from('daily_movement')
		.select('entry_date, step_count, cycled_today, cycled_km, updated_at')
		.eq('user_id', user.id)
		.gte('entry_date', weekStartKey)
		.order('entry_date', { ascending: false })
		.limit(7);

	if (!movementWeekQuery.error || isMissingTableError(movementWeekQuery.error, 'daily_movement')) {
		movementWeek = (movementWeekQuery.data ?? [])
			.map((row) => ({
				entryDate: typeof row.entry_date === 'string' ? row.entry_date : '',
				stepCount: typeof row.step_count === 'number' ? row.step_count : null,
				cycledToday: row.cycled_today === true,
				cycledKm: typeof row.cycled_km === 'number' ? row.cycled_km : null,
				updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null
			}))
			.filter((row) => row.entryDate.length > 0);
	}

	return {
		title: 'Dagbok',
		description: 'Skriv i din dagbok, följ ditt mående och spara dina tankar i lugn takt.',
		noindex: true,
		isLoggedIn: true,
		entries,
		hasMoreEntries,
		sharedEntryIds,
		movementToday,
		movementWeek
	};
};
