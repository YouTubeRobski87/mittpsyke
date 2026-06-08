export const DIARY_ENTRIES_CHANGED_EVENT = 'mittpsyke:diary-entries-changed';

export function notifyDiaryEntriesChanged() {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new CustomEvent(DIARY_ENTRIES_CHANGED_EVENT));
}
