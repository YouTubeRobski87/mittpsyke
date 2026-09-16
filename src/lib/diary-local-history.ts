// Lokal historik för den som skriver utan konto.
//
// Tidigare fanns bara ett enda utkast (`mittpsyke_guest_entry`), så den som
// kom tillbaka en andra dag skrev över gårdagens text. Här ligger i stället
// en kort lista med de senaste inläggen, fortfarande enbart i webbläsaren:
// ingen serverrequest, ingen AI och inget konto.
//
// Utkastnyckeln finns kvar och rörs inte härifrån. Den bär texten som just nu
// skrivs och är det som /register visar och den inloggade dagboken kan fylla i.
// Historiken är ett tillägg ovanpå den, aldrig en ersättare, så ingen befintlig
// text kan gå förlorad vid uppgraderingen.

import { browser } from '$app/environment';
import {
	DIARY_DRAFT_KEY,
	DIARY_DRAFT_SAVED_AT_KEY,
	LEGACY_DIARY_DRAFT_KEY,
	parseDiaryDraft
} from '$lib/diary-draft';

/** Listan med lokala inlägg. Endast den här modulen skriver hit. */
export const LOCAL_ENTRIES_KEY = 'mittpsyke_local_entries';

/** Vilket lokalt inlägg som är öppet i skrivytan just nu. */
export const CURRENT_LOCAL_ENTRY_KEY = 'mittpsyke_local_entry_current';

/**
 * Så många inlägg sparas. Fler än så gör listan svåröverblickbar, och
 * poängen är att kunna återkomma - inte att bygga ett arkiv utan konto.
 */
export const MAX_LOCAL_ENTRIES = 12;

export type LocalDiaryEntry = {
	id: string;
	/** Millisekunder. Sätts en gång, ändras aldrig. */
	createdAt: number;
	/** Millisekunder. Uppdateras vid varje sparning. */
	updatedAt: number;
	text: string;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultStorage(): StorageLike | null {
	if (!browser) return null;
	try {
		return window.localStorage;
	} catch {
		// Privatläge eller blockerad lagring. Historiken finns då bara i minnet.
		return null;
	}
}

function read(storage: StorageLike | null, key: string): string | null {
	if (!storage) return null;
	try {
		return storage.getItem(key);
	} catch {
		return null;
	}
}

function write(storage: StorageLike | null, key: string, value: string) {
	if (!storage) return;
	try {
		storage.setItem(key, value);
	} catch {
		// Full kvot eller blockerad lagring får aldrig stoppa skrivandet.
	}
}

function remove(storage: StorageLike | null, key: string) {
	if (!storage) return;
	try {
		storage.removeItem(key);
	} catch {
		// Ignoreras medvetet.
	}
}

function isEntry(value: unknown): value is LocalDiaryEntry {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<LocalDiaryEntry>;
	return (
		typeof candidate.id === 'string' &&
		candidate.id.length > 0 &&
		typeof candidate.text === 'string' &&
		candidate.text.trim().length > 0 &&
		Number.isFinite(candidate.createdAt) &&
		Number.isFinite(candidate.updatedAt)
	);
}

/** Nyast först, så listan kan visas direkt utan extra sortering i vyn. */
function sortNewestFirst(entries: LocalDiaryEntry[]): LocalDiaryEntry[] {
	return [...entries].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createLocalEntryId(): string {
	try {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
	} catch {
		// Faller igenom till tidsstämpel nedan.
	}
	return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function readLocalEntries(storage: StorageLike | null = defaultStorage()): LocalDiaryEntry[] {
	const raw = read(storage, LOCAL_ENTRIES_KEY);
	if (!raw) return [];

	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return sortNewestFirst(parsed.filter(isEntry)).slice(0, MAX_LOCAL_ENTRIES);
	} catch {
		// Trasig JSON kastas inte vidare; användaren ska kunna fortsätta skriva.
		return [];
	}
}

function writeEntries(storage: StorageLike | null, entries: LocalDiaryEntry[]) {
	const capped = sortNewestFirst(entries).slice(0, MAX_LOCAL_ENTRIES);
	write(storage, LOCAL_ENTRIES_KEY, JSON.stringify(capped));
	return capped;
}

/**
 * Sparar ett inlägg. Med `id` uppdateras det befintliga inlägget, annars
 * skapas ett nytt. Tom text sparar ingenting och tar bort ett tidigare
 * tomt-redigerat inlägg, så listan aldrig fylls med blanka rader.
 */
export function saveLocalEntry(
	input: { id?: string | null; text: string; now?: number },
	storage: StorageLike | null = defaultStorage()
): LocalDiaryEntry | null {
	const text = input.text.trim();
	const now = input.now ?? Date.now();
	const entries = readLocalEntries(storage);

	if (!text) {
		if (input.id) {
			writeEntries(
				storage,
				entries.filter((entry) => entry.id !== input.id)
			);
		}
		return null;
	}

	const existing = input.id ? entries.find((entry) => entry.id === input.id) : undefined;
	const entry: LocalDiaryEntry = existing
		? { ...existing, text, updatedAt: now }
		: { id: input.id || createLocalEntryId(), createdAt: now, updatedAt: now, text };

	const next = [entry, ...entries.filter((item) => item.id !== entry.id)];
	writeEntries(storage, next);
	return entry;
}

export function deleteLocalEntry(id: string, storage: StorageLike | null = defaultStorage()) {
	const entries = readLocalEntries(storage);
	writeEntries(
		storage,
		entries.filter((entry) => entry.id !== id)
	);
}

/** Tar bort hela den lokala historiken, inklusive vilket inlägg som var öppet. */
export function clearLocalEntries(storage: StorageLike | null = defaultStorage()) {
	remove(storage, LOCAL_ENTRIES_KEY);
	remove(storage, CURRENT_LOCAL_ENTRY_KEY);
}

export function readCurrentLocalEntryId(
	storage: StorageLike | null = defaultStorage()
): string | null {
	const id = read(storage, CURRENT_LOCAL_ENTRY_KEY);
	return id && id.trim() ? id : null;
}

export function writeCurrentLocalEntryId(
	id: string | null,
	storage: StorageLike | null = defaultStorage()
) {
	if (!id) {
		remove(storage, CURRENT_LOCAL_ENTRY_KEY);
		return;
	}
	write(storage, CURRENT_LOCAL_ENTRY_KEY, id);
}

/**
 * Lyfter in ett utkast som sparats med den gamla enskilda nyckeln i historiken.
 * Körs vid första besöket efter uppgraderingen.
 *
 * Utkastnyckeln lämnas kvar: den läses fortfarande av /register och av den
 * inloggade dagboken, och att radera den här hade tagit texten från dem.
 * Migreringen är därför additiv och kan köras om utan att skapa dubbletter.
 */
export function migrateDraftIntoLocalEntries(
	storage: StorageLike | null = defaultStorage(),
	now = Date.now()
): LocalDiaryEntry | null {
	const entries = readLocalEntries(storage);
	if (entries.length > 0) return null;

	const draft =
		parseDiaryDraft(read(storage, DIARY_DRAFT_KEY)) ||
		parseDiaryDraft(read(storage, LEGACY_DIARY_DRAFT_KEY));
	if (!draft) return null;

	const savedAtRaw = Number(read(storage, DIARY_DRAFT_SAVED_AT_KEY));
	const savedAt =
		Number.isFinite(savedAtRaw) && savedAtRaw > 0 && savedAtRaw <= now ? savedAtRaw : now;

	const entry: LocalDiaryEntry = {
		id: createLocalEntryId(),
		createdAt: savedAt,
		updatedAt: savedAt,
		text: draft
	};
	writeEntries(storage, [entry]);
	writeCurrentLocalEntryId(entry.id, storage);
	return entry;
}

const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
	day: 'numeric',
	month: 'long',
	hour: '2-digit',
	minute: '2-digit'
});

export function formatLocalEntryDate(timestamp: number): string {
	return dateFormatter.format(new Date(timestamp));
}

/** Kort förhandsvisning i listan. Hela texten visas först när inlägget öppnas. */
export function localEntryPreview(text: string, maxLength = 90): string {
	const flat = text.replace(/\s+/g, ' ').trim();
	if (flat.length <= maxLength) return flat;
	return `${flat.slice(0, maxLength).trimEnd()}…`;
}
