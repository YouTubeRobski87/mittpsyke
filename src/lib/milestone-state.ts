import { browser, dev } from '$app/environment';

export type MilestoneId =
	| 'first_diary_entry'
	| 'diary_entries_3'
	| 'diary_entries_7'
	| 'diary_streak_3'
	| 'diary_streak_7'
	| 'first_checkin'
	| 'first_saved_insight';

export type EarnedMilestone = {
	id: string;
	title: string;
	description: string;
	category: string;
	earnedAt: string;
};

const STORAGE_PREFIX = 'mittpsyke:milestone';
const EARNED_MILESTONES_STORAGE_PREFIX = 'mittpsyke:earned-milestones';
const PENDING_STORAGE_PREFIX = 'mittpsyke:pending-milestone';
const GUEST_SCOPE = 'guest';
export const MILESTONE_VERSION = 'v3';

function normalizeMilestoneId(id: MilestoneId) {
	return id.replaceAll('_', '-');
}

export function getMilestoneStorageKey(id: MilestoneId, userId?: string | null) {
	return `${STORAGE_PREFIX}:${normalizeMilestoneId(id)}:${MILESTONE_VERSION}:${userId || GUEST_SCOPE}`;
}

export function getEarnedMilestonesStorageKey(userId?: string | null) {
	return `${EARNED_MILESTONES_STORAGE_PREFIX}:${userId || GUEST_SCOPE}`;
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

function parseEarnedMilestones(value: string | null): EarnedMilestone[] {
	if (!value) return [];

	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return [];

		return parsed.filter((milestone): milestone is EarnedMilestone => {
			return (
				milestone &&
				typeof milestone === 'object' &&
				typeof milestone.id === 'string' &&
				typeof milestone.title === 'string' &&
				typeof milestone.description === 'string' &&
				typeof milestone.category === 'string' &&
				typeof milestone.earnedAt === 'string'
			);
		});
	} catch {
		return [];
	}
}

export function loadEarnedMilestones(userId?: string | null): EarnedMilestone[] {
	if (!browser) return [];

	try {
		return parseEarnedMilestones(window.localStorage.getItem(getEarnedMilestonesStorageKey(userId)));
	} catch {
		return [];
	}
}

export function saveEarnedMilestones(
	userId: string | null | undefined,
	milestones: EarnedMilestone[]
): void {
	if (!browser) return;

	try {
		const key = getEarnedMilestonesStorageKey(userId);
		window.localStorage.setItem(key, JSON.stringify(milestones));
		if (dev) {
			console.debug('[milestone] earned localStorage write', window.localStorage.getItem(key));
		}
	} catch (error) {
		if (dev) {
			console.warn('[milestone] earned localStorage write failed', error);
		}
	}
}

export function hasEarnedMilestone(milestoneId: string, userId?: string | null): boolean {
	return loadEarnedMilestones(userId).some((milestone) => milestone.id === milestoneId);
}

export function awardMilestone(
	milestone: Omit<EarnedMilestone, 'earnedAt'> & { earnedAt?: string },
	userId: string | null | undefined,
): EarnedMilestone[] {
	if (!browser) return [];

	const milestones = loadEarnedMilestones(userId);
	if (milestones.some((storedMilestone) => storedMilestone.id === milestone.id)) {
		return milestones;
	}

	const nextMilestones = [
		{
			id: milestone.id,
			title: milestone.title,
			description: milestone.description,
			category: milestone.category,
			earnedAt: milestone.earnedAt ?? new Date().toISOString()
		},
		...milestones
	];

	saveEarnedMilestones(userId, nextMilestones);
	return nextMilestones;
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
