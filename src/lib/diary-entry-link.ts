// Direktlänk från ett tema i Framsteg till anteckningen det bygger på.
//
// Bara anteckningens id går i länken, aldrig text eller utdrag. Dagboken läser
// id:t, kontrollerar formatet och hämtar raden med användarens egen inloggade
// klient, så RLS avgör som vanligt vad som går att läsa.

/** Frågeparametern i Dagboken som pekar ut en anteckning. */
export const DIARY_ENTRY_PARAM = 'anteckning';

/** Id:n är uuid eller heltal. Allt annat behandlas som att länken saknar id. */
const ENTRY_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

function normalizeEntryId(value: string | null | undefined): string | null {
	const trimmed = value?.trim() ?? '';
	return ENTRY_ID_PATTERN.test(trimmed) ? trimmed : null;
}

/** Länken till anteckningen i Dagboken, eller null när utdraget saknar användbart id. */
export function diaryEntryHref(entryId: string | null | undefined): string | null {
	const id = normalizeEntryId(entryId);
	return id ? `/dagbok/checkin?${DIARY_ENTRY_PARAM}=${encodeURIComponent(id)}` : null;
}

/** Id:t som en länk från Framsteg pekar ut, eller null. */
export function readLinkedEntryId(searchParams: URLSearchParams | null | undefined): string | null {
	return normalizeEntryId(searchParams?.get(DIARY_ENTRY_PARAM));
}

/** Elementets id för en anteckning i listan, så att länken kan skrolla dit. */
export function diaryEntryElementId(entryId: string): string {
	return `anteckning-${entryId}`;
}

/** Sidan i den paginerade listan där anteckningen ligger, eller null om den inte finns där. */
export function pageForEntry(
	entries: { id: string }[],
	entryId: string,
	entriesPerPage: number
): number | null {
	const index = entries.findIndex((entry) => entry.id === entryId);
	if (index === -1 || entriesPerPage < 1) return null;
	return Math.floor(index / entriesPerPage) + 1;
}

/** Lugn text när anteckningen inte går att visa. Gissar aldrig varför. */
export const LINKED_ENTRY_MISSING_MESSAGE = 'Vi hittar inte den anteckningen just nu.';

/** Vad laddaren hittade för en länkad anteckning. */
export type LinkedEntryResult<Entry extends { id: string }> =
	| { status: 'none' }
	| { status: 'found'; entry: Entry }
	| { status: 'missing' };

/**
 * Var den länkade anteckningen visas: öppnad i listan när den finns där,
 * annars för sig överst, eller som en lugn rad när den inte gick att hämta.
 */
export function linkedEntryPlacement<Entry extends { id: string }>(
	linked: LinkedEntryResult<Entry> | null | undefined,
	entries: { id: string }[]
): 'none' | 'list' | 'separate' | 'missing' {
	if (!linked || linked.status === 'none') return 'none';
	if (linked.status === 'missing') return 'missing';
	return entries.some((entry) => entry.id === linked.entry.id) ? 'list' : 'separate';
}
