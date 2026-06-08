import { browser } from '$app/environment';

export type MilestoneId =
	| 'first_diary_entry'
	| 'diary_entries_3'
	| 'diary_entries_7'
	| 'diary_streak_3'
	| 'diary_streak_7'
	| 'first_checkin'
	| 'first_saved_insight';

const STORAGE_PREFIX = 'mittpsyke:milestone';
const PENDING_STORAGE_PREFIX = 'mittpsyke:pending-milestone';
const GUEST_SCOPE = 'guest';
const MILESTONE_VERSION = 'v2';

function normalizeMilestoneId(id: MilestoneId) {
	return id.replaceAll('_', '-');
}

export function getMilestoneStorageKey(id: MilestoneId, userId?: string | null) {
	return `${STORAGE_PREFIX}:${normalizeMilestoneId(id)}:${MILESTONE_VERSION}:${userId || GUEST_SCOPE}`;
}

function getPendingMilestoneStorageKey(userId?: string | null) {
	return `${PENDING_STORAGE_PREFIX}:${userId || GUEST_SCOPE}`;
}

function isMilestoneId(value: unknown): value is MilestoneId {
	return (
		value === 'first_diary_entry' ||
		value === 'diary_entries_3' ||
		value === 'diary_entries_7' ||
		value === 'diary_streak_3' ||
		value === 'diary_streak_7' ||
		value === 'first_checkin' ||
		value === 'first_saved_insight'
	);
}

export function hasSeenMilestone(id: MilestoneId, userId?: string | null): boolean {
	if (!browser) return false;

	try {
		return window.localStorage.getItem(getMilestoneStorageKey(id, userId)) === '1';
	} catch {
		return false;
	}
}

export function markMilestoneSeen(id: MilestoneId, userId?: string | null): void {
	if (!browser) return;

	try {
		window.localStorage.setItem(getMilestoneStorageKey(id, userId), '1');
	} catch {
		// Local storage can be unavailable in private mode; milestone UI should not block saving.
	}
}

export function queuePendingMilestone(id: MilestoneId, userId?: string | null): void {
	if (!browser) return;

	try {
		window.sessionStorage.setItem(getPendingMilestoneStorageKey(userId), id);
	} catch {
		// If session storage is unavailable, the save flow should continue without blocking.
	}
}

export function consumePendingMilestone(userId?: string | null): MilestoneId | null {
	if (!browser) return null;

	try {
		const key = getPendingMilestoneStorageKey(userId);
		const value = window.sessionStorage.getItem(key);
		window.sessionStorage.removeItem(key);
		return isMilestoneId(value) ? value : null;
	} catch {
		return null;
	}
}
