import { supabase } from '$lib/supabase';

export type DiaryEntry = {
	id: string;
	content: string;
	created_at: string | null;
	tags: string[];
	mood: string | null;
	image_url: string | null;
};

type DiaryRow = {
	id: unknown;
	text: unknown;
	created_at: unknown;
	tags: unknown;
	mood: unknown;
	image_url: unknown;
};

type LegacyDiaryRow = {
	id: unknown;
	content: unknown;
	created_at: unknown;
	tags: unknown;
	mood: unknown;
};

export const DIARY_ENTRY_PAGE_SIZE = 20;
const MAX_DIARY_ENTRY_LIMIT = 100;

export type DiaryEntriesPage = {
	entries: DiaryEntry[];
	hasMore: boolean;
	limit: number;
};

type DiaryLoadOptions = {
	force?: boolean;
	limit?: number;
};

const cachedEntriesByUserId = new Map<string, DiaryEntriesPage>();
const inFlightByUserId = new Map<string, Promise<DiaryEntriesPage>>();

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
		mood: typeof row.mood === 'string' ? row.mood : null,
		image_url: typeof row.image_url === 'string' ? row.image_url : null
	};
}

function mapLegacyDiaryRow(row: LegacyDiaryRow): DiaryEntry {
	return {
		id: typeof row.id === 'string' ? row.id : '',
		content: typeof row.content === 'string' ? row.content : '',
		created_at: typeof row.created_at === 'string' ? row.created_at : null,
		tags: normalizeTags(row.tags),
		mood: typeof row.mood === 'string' ? row.mood : null,
		image_url: null // Äldre tabell saknar bildkolumn
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

function normalizeLimit(limit?: number) {
	return Math.max(
		DIARY_ENTRY_PAGE_SIZE,
		Math.min(MAX_DIARY_ENTRY_LIMIT, Math.trunc(limit ?? DIARY_ENTRY_PAGE_SIZE))
	);
}

function toDiaryEntriesPage(entries: DiaryEntry[], limit: number): DiaryEntriesPage {
	return {
		entries: entries.slice(0, limit),
		hasMore: entries.length > limit,
		limit
	};
}

async function fetchDiaryEntries(userId: string, limit: number): Promise<DiaryEntriesPage> {
	const queryLimit = limit + 1;
	const { data, error: loadError } = await supabase
		.from('diary')
		.select('id, text, created_at, tags, mood, image_url')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(queryLimit);

	if (isMissingTableError(loadError, 'diary')) {
		const { data: legacyData, error: legacyLoadError } = await supabase
			.from('journal_entries')
			.select('id, content, created_at, tags, mood')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(queryLimit);

		if (isMissingTableError(legacyLoadError, 'journal_entries')) {
			throw new Error('Databastabell saknas. Be administratören köra supabase/diary.sql i Supabase.');
		}

		if (legacyLoadError) {
			throw new Error('Kunde inte hämta anteckningar just nu.');
		}

		return toDiaryEntriesPage(
			(legacyData ?? []).map((row) => mapLegacyDiaryRow(row as LegacyDiaryRow)),
			limit
		);
	}

	if (loadError) {
		throw new Error('Kunde inte hämta anteckningar just nu.');
	}

	return toDiaryEntriesPage(
		(data ?? []).map((row) => mapDiaryRow(row as DiaryRow)),
		limit
	);
}

export function getDiaryEntries(userId: string): DiaryEntry[] | null {
	const cached = cachedEntriesByUserId.get(userId);
	return cached ? [...cached.entries] : null;
}

export function setDiaryEntries(userId: string, entries: DiaryEntry[]) {
	cachedEntriesByUserId.set(userId, {
		entries: [...entries],
		hasMore: false,
		limit: Math.max(entries.length, DIARY_ENTRY_PAGE_SIZE)
	});
}

export async function loadDiaryEntriesPage(
	userId: string,
	options: DiaryLoadOptions = {}
): Promise<DiaryEntriesPage> {
	if (!userId) {
		return { entries: [], hasMore: false, limit: DIARY_ENTRY_PAGE_SIZE };
	}

	const force = options.force ?? false;
	const limit = normalizeLimit(options.limit);
	const cached = cachedEntriesByUserId.get(userId);
	if (cached && cached.limit >= limit && !force) {
		return {
			entries: cached.entries.slice(0, limit),
			hasMore: cached.hasMore || cached.entries.length > limit,
			limit
		};
	}

	const cacheKey = `${userId}:${limit}`;
	const inFlight = inFlightByUserId.get(cacheKey);
	if (inFlight && !force) {
		const page = await inFlight;
		return { entries: [...page.entries], hasMore: page.hasMore, limit: page.limit };
	}

	const request = fetchDiaryEntries(userId, limit)
		.then((page) => {
			cachedEntriesByUserId.set(userId, {
				entries: [...page.entries],
				hasMore: page.hasMore,
				limit: page.limit
			});
			return page;
		})
		.finally(() => {
			if (inFlightByUserId.get(cacheKey) === request) {
				inFlightByUserId.delete(cacheKey);
			}
		});

	inFlightByUserId.set(cacheKey, request);
	const page = await request;
	return { entries: [...page.entries], hasMore: page.hasMore, limit: page.limit };
}

export async function loadDiaryEntries(userId: string, options: DiaryLoadOptions = {}) {
	const page = await loadDiaryEntriesPage(userId, options);
	return page.entries;
}

export function clearDiaryEntries(userId?: string) {
	if (!userId) {
		cachedEntriesByUserId.clear();
		inFlightByUserId.clear();
		return;
	}

	cachedEntriesByUserId.delete(userId);
	for (const key of inFlightByUserId.keys()) {
		if (key.startsWith(`${userId}:`)) {
			inFlightByUserId.delete(key);
		}
	}
}
