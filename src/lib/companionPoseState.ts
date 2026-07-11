import {
	COMPANION_POSE_CHANGE_MAX_MS,
	COMPANION_POSE_CHANGE_MIN_MS,
	COMPANION_POSES,
	type CompanionPose,
	type CompanionPoseDaypart
} from '$lib/companionPoseManifest';
import { getProgressCompanionDayState } from '$lib/progressCompanion';

type StoredCompanionPoseState = {
	poseId: string;
	daypart: CompanionPoseDaypart;
	expiresAt: number;
};

const STORAGE_KEY = 'mittpsyke:companion-pose:v1';

function getPoseDaypart(date: Date): CompanionPoseDaypart {
	const state = getProgressCompanionDayState(date);
	if (state === 'evening') return 'evening';
	if (state === 'night') return 'night';
	return 'day';
}

function getWeightedPose(poses: CompanionPose[]): CompanionPose {
	const totalWeight = poses.reduce((sum, pose) => sum + (pose.weight ?? 1), 0);
	let cursor = Math.random() * totalWeight;

	for (const pose of poses) {
		cursor -= pose.weight ?? 1;
		if (cursor <= 0) return pose;
	}

	return poses[0];
}

function getNextExpiry(now: number): number {
	const span = COMPANION_POSE_CHANGE_MAX_MS - COMPANION_POSE_CHANGE_MIN_MS;
	return now + COMPANION_POSE_CHANGE_MIN_MS + Math.floor(Math.random() * span);
}

function parseStoredState(value: string | null): StoredCompanionPoseState | null {
	if (!value) return null;

	try {
		const parsed = JSON.parse(value) as Partial<StoredCompanionPoseState>;
		if (
			typeof parsed.poseId !== 'string' ||
			(parsed.daypart !== 'day' && parsed.daypart !== 'evening' && parsed.daypart !== 'night') ||
			typeof parsed.expiresAt !== 'number'
		) {
			return null;
		}

		return {
			poseId: parsed.poseId,
			daypart: parsed.daypart,
			expiresAt: parsed.expiresAt
		};
	} catch {
		return null;
	}
}

function findBasePose(daypart: CompanionPoseDaypart, poseId: string): CompanionPose | null {
	return (
		COMPANION_POSES.find(
			(pose) =>
				pose.role === 'base' && pose.id === poseId && pose.dayparts.includes(daypart)
		) ?? null
	);
}

export function getCompanionPoseDaypart(date = new Date()): CompanionPoseDaypart {
	return getPoseDaypart(date);
}

export function getCompanionBasePose(date = new Date(), storage: Storage | null = null): CompanionPose {
	const daypart = getPoseDaypart(date);
	const now = date.getTime();
	const availablePoses = COMPANION_POSES.filter(
		(pose) => pose.role === 'base' && pose.dayparts.includes(daypart)
	);
	const fallbackPose = availablePoses[0] ?? COMPANION_POSES[0];
	const storedState = storage ? parseStoredState(storage.getItem(STORAGE_KEY)) : null;

	if (storedState && storedState.daypart === daypart && storedState.expiresAt > now) {
		return findBasePose(daypart, storedState.poseId) ?? fallbackPose;
	}

	const nextPose = getWeightedPose(availablePoses.length ? availablePoses : [fallbackPose]);

	if (storage) {
		const nextState: StoredCompanionPoseState = {
			poseId: nextPose.id,
			daypart,
			expiresAt: getNextExpiry(now)
		};
		storage.setItem(STORAGE_KEY, JSON.stringify(nextState));
	}

	return nextPose;
}

export function getCompanionOverlayPose(daypart: CompanionPoseDaypart): CompanionPose | null {
	const availableOverlays = COMPANION_POSES.filter(
		(pose) => pose.role === 'overlay' && pose.dayparts.includes(daypart)
	);

	for (const pose of availableOverlays) {
		if (Math.random() < (pose.eventChance ?? 0)) return pose;
	}

	return null;
}

export function getMsUntilNextCompanionPoseCheck(
	date = new Date(),
	storage: Storage | null = null
): number {
	const storedState = storage ? parseStoredState(storage.getItem(STORAGE_KEY)) : null;
	const remainingMs = storedState ? storedState.expiresAt - date.getTime() : 0;
	return Math.min(Math.max(remainingMs, 30 * 1000), 5 * 60 * 1000);
}
