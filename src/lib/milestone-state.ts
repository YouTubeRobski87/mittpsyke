import { browser } from '$app/environment';

export type MilestoneId =
	| 'first_diary_entry'
	| 'diary_entries_3'
	| 'diary_entries_7'
	| 'diary_streak_3'
	| 'diary_streak_7'
	| 'first_checkin'
	| 'first_saved_insight';

const STORAGE_PREFIX = 'mittpsyke_milestones_seen:v1';
const GUEST_SCOPE = 'guest';

function getStorageKey(userId?: string | null) {
	return `${STORAGE_PREFIX}:${userId || GUEST_SCOPE}`;
}

function readSeenMilestones(userId?: string | null): Set<MilestoneId> {
	if (!browser) return new Set();

	try {
		const raw = window.localStorage.getItem(getStorageKey(userId));
		const parsed = raw ? JSON.parse(raw) : [];
		if (!Array.isArray(parsed)) return new Set();
		return new Set(parsed.filter((item): item is MilestoneId => typeof item === 'string'));
	} catch {
		return new Set();
	}
}

export function hasSeenMilestone(id: MilestoneId, userId?: string | null): boolean {
	return readSeenMilestones(userId).has(id);
}

export function markMilestoneSeen(id: MilestoneId, userId?: string | null): void {
	if (!browser) return;

	try {
		const seen = readSeenMilestones(userId);
		seen.add(id);
		window.localStorage.setItem(getStorageKey(userId), JSON.stringify([...seen]));
	} catch {
		// Local storage can be unavailable in private mode; milestone UI should not block saving.
	}
}
