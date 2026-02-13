import { supabase } from '$lib/supabase';

export type DiaryEntry = {
	id: string;
	content: string;
	created_at: string | null;
	tags: string[];
	mood: string | null;
};

type DiaryRow = {
	id: unknown;
	text: unknown;
	created_at: unknown;
	tags: unknown;
	mood: unknown;
};

type LegacyDiaryRow = {
	id: unknown;
	content: unknown;
	created_at: unknown;
	tags: unknown;
	mood: unknown;
};

const cachedEntriesByUserId = new Map<string, DiaryEntry[]>();
const inFlightByUserId = new Map<string, Promise<DiaryEntry[]>>();

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

function mapDiaryRow(row: DiaryRow): DiaryEntry {
	return {
		id: typeof row.id === 'string' ? row.id : '',
		content: typeof row.text === 'string' ? row.text : '',
		created_at: typeof row.created_at === 'string' ? row.created_at : null,
		tags: normalizeTags(row.tags),
		mood: typeof row.mood === 'string' ? row.mood : null
	};
}

function mapLegacyDiaryRow(row: LegacyDiaryRow): DiaryEntry {
	return {
		id: typeof row.id === 'string' ? row.id : '',
		content: typeof row.content === 'string' ? row.content : '',
		created_at: typeof row.created_at === 'string' ? row.created_at : null,
		tags: normalizeTags(row.tags),
		mood: typeof row.mood === 'string' ? row.mood : null
	};
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

async function fetchDiaryEntries(userId: string): Promise<DiaryEntry[]> {
	const { data, error: loadError } = await supabase
		.from('diary')
		.select('id, text, created_at, tags, mood')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (isMissingTableError(loadError, 'diary')) {
		const { data: legacyData, error: legacyLoadError } = await supabase
			.from('journal_entries')
			.select('id, content, created_at, tags, mood')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (isMissingTableError(legacyLoadError, 'journal_entries')) {
			throw new Error('Databastabell saknas. Be administratören köra supabase/diary.sql i Supabase.');
		}

		if (legacyLoadError) {
			throw new Error('Kunde inte hämta anteckningar just nu.');
		}

		return (legacyData ?? []).map((row) => mapLegacyDiaryRow(row as LegacyDiaryRow));
	}

	if (loadError) {
		throw new Error('Kunde inte hämta anteckningar just nu.');
	}

	return (data ?? []).map((row) => mapDiaryRow(row as DiaryRow));
}

export function getDiaryEntries(userId: string): DiaryEntry[] | null {
	const cached = cachedEntriesByUserId.get(userId);
	return cached ? [...cached] : null;
}

export function setDiaryEntries(userId: string, entries: DiaryEntry[]) {
	cachedEntriesByUserId.set(userId, [...entries]);
}

export async function loadDiaryEntries(userId: string, options: { force?: boolean } = {}) {
	if (!userId) return [];

	const force = options.force ?? false;
	const cached = cachedEntriesByUserId.get(userId);
	if (cached && !force) {
		return [...cached];
	}

	const inFlight = inFlightByUserId.get(userId);
	if (inFlight && !force) {
		const entries = await inFlight;
		return [...entries];
	}

	const request = fetchDiaryEntries(userId)
		.then((entries) => {
			cachedEntriesByUserId.set(userId, entries);
			return entries;
		})
		.finally(() => {
			if (inFlightByUserId.get(userId) === request) {
				inFlightByUserId.delete(userId);
			}
		});

	inFlightByUserId.set(userId, request);
	const entries = await request;
	return [...entries];
}

export function clearDiaryEntries(userId?: string) {
	if (!userId) {
		cachedEntriesByUserId.clear();
		inFlightByUserId.clear();
		return;
	}

	cachedEntriesByUserId.delete(userId);
	inFlightByUserId.delete(userId);
}
