/**
 * Engångsöverlämning av text från startsidans hero till chatten.
 *
 * Modulen är medvetet fristående från Svelte och produktens övriga lagring.
 * Den hanterar bara hero-utkastet och kan därför testas med ett injicerat
 * Storage-liknande objekt.
 */
export const HERO_CHAT_HANDOFF_STORAGE_KEY = 'mittpsyke_hero_quick_start';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getBrowserStorage(): StorageLike | null {
	if (typeof window === 'undefined') return null;

	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

/** Lagrar ett trimmat hero-utkast när browserlagring är tillgänglig. */
export function storeHeroChatHandoff(
	text: string,
	storage: StorageLike | null = getBrowserStorage()
): boolean {
	const trimmed = text.trim();
	if (!trimmed || !storage) return false;

	try {
		storage.setItem(HERO_CHAT_HANDOFF_STORAGE_KEY, trimmed);
		return true;
	} catch {
		return false;
	}
}

/** Läser och tar bort hero-utkastet så att det bara kan användas en gång. */
export function consumeHeroChatHandoff(
	storage: StorageLike | null = getBrowserStorage()
): string | null {
	if (!storage) return null;

	try {
		const value = storage.getItem(HERO_CHAT_HANDOFF_STORAGE_KEY);
		const trimmed = value?.trim() ?? '';

		try {
			storage.removeItem(HERO_CHAT_HANDOFF_STORAGE_KEY);
		} catch {
			// Ett lagringsfel får aldrig hindra den text som redan lästs från att användas.
		}

		return trimmed || null;
	} catch {
		return null;
	}
}
