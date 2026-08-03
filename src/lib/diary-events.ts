export const DIARY_ENTRIES_CHANGED_EVENT = 'mittpsyke:diary-entries-changed';

export function notifyDiaryEntriesChanged() {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new CustomEvent(DIARY_ENTRIES_CHANGED_EVENT));
}

// ---------------------------------------------------------------------------
// Ren metadata om att en reflektion nyss sparades - bara en tidsstämpel,
// aldrig text, humördata eller ett ID. Den här modulen vet ingenting om vem
// som läser flaggan eller varför; håll det så. Andra delar av appen (t.ex.
// följeslagaren) läser och tolkar den utifrån.
// ---------------------------------------------------------------------------

const REFLECTION_SAVED_AT_KEY = 'mittpsyke:reflection-saved-at:v1';

/** Anropas direkt efter en lyckad sparning, bredvid notifyDiaryEntriesChanged. */
export function recordSuccessfulReflectionSave(): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(REFLECTION_SAVED_AT_KEY, String(Date.now()));
	} catch {
		// Lagring får aldrig blockera själva sparningen.
	}
}

/** Tidpunkten (ms epoch) för senast sparade reflektion, eller null. Ren läsning. */
export function getReflectionSavedTimestamp(): number | null {
	if (typeof window === 'undefined') return null;
	try {
		const stored = window.localStorage.getItem(REFLECTION_SAVED_AT_KEY);
		if (!stored) return null;
		const parsed = Number(stored);
		return Number.isFinite(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

/** Tar bort tidsstämpeln, t.ex. sedan den använts eller gått ut. */
export function clearReflectionSavedTimestamp(): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.removeItem(REFLECTION_SAVED_AT_KEY);
	} catch {
		// Ignoreras medvetet.
	}
}
