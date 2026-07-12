import {
	COMPANION_POSE_CHANGE_MAX_MS,
	COMPANION_POSE_CHANGE_MIN_MS,
	COMPANION_POSES,
	COMPANION_SCENE_POSITIONS,
	type CompanionPose,
	type CompanionPoseDaypart,
	type CompanionScenePosition,
	type CompanionScenePositionId
} from '$lib/companionPoseManifest';
import { getProgressCompanionDayState } from '$lib/progressCompanion';

type StoredCompanionPoseState = {
	poseId: string;
	daypart: CompanionPoseDaypart;
	expiresAt: number;
};

type StoredCompanionPositionState = {
	positionId: CompanionScenePositionId;
	poseId: string;
	daypart: CompanionPoseDaypart;
	expiresAt: number;
};

const STORAGE_KEY = 'mittpsyke:companion-pose:v1';
const POSITION_STORAGE_KEY = 'mittpsyke:companion-position:v1';

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

function getWeightedPosition(positions: CompanionScenePosition[]): CompanionScenePosition {
	const totalWeight = positions.reduce((sum, position) => sum + (position.weight ?? 1), 0);
	let cursor = Math.random() * totalWeight;

	for (const position of positions) {
		cursor -= position.weight ?? 1;
		if (cursor <= 0) return position;
	}

	return positions[0];
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

function parseStoredPositionState(value: string | null): StoredCompanionPositionState | null {
	if (!value) return null;

	try {
		const parsed = JSON.parse(value) as Partial<StoredCompanionPositionState>;
		const validPosition = COMPANION_SCENE_POSITIONS.some(
			(position) => position.id === parsed.positionId
		);

		if (
			!validPosition ||
			typeof parsed.poseId !== 'string' ||
			(parsed.daypart !== 'day' && parsed.daypart !== 'evening' && parsed.daypart !== 'night') ||
			typeof parsed.expiresAt !== 'number'
		) {
			return null;
		}

		return {
			positionId: parsed.positionId as CompanionScenePositionId,
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

function getAvailablePositions(
	daypart: CompanionPoseDaypart,
	poseId: string
): CompanionScenePosition[] {
	return COMPANION_SCENE_POSITIONS.filter(
		(position) => position.dayparts.includes(daypart) && position.allowedPoseIds.includes(poseId)
	);
}

function getPositionById(
	daypart: CompanionPoseDaypart,
	poseId: string,
	positionId: CompanionScenePositionId
): CompanionScenePosition | null {
	return (
		getAvailablePositions(daypart, poseId).find((position) => position.id === positionId) ?? null
	);
}

function poseHasAvailablePosition(daypart: CompanionPoseDaypart, pose: CompanionPose): boolean {
	return getAvailablePositions(daypart, pose.id).length > 0;
}

export function getCompanionPoseDaypart(date = new Date()): CompanionPoseDaypart {
	return getPoseDaypart(date);
}

export function getCompanionBasePose(date = new Date(), storage: Storage | null = null): CompanionPose {
	const daypart = getPoseDaypart(date);
	const now = date.getTime();
	const availablePoses = COMPANION_POSES.filter(
		(pose) =>
			pose.role === 'base' &&
			pose.dayparts.includes(daypart) &&
			poseHasAvailablePosition(daypart, pose)
	);
	const fallbackPose = availablePoses[0] ?? COMPANION_POSES[0];
	const storedState = storage ? parseStoredState(storage.getItem(STORAGE_KEY)) : null;

	if (storedState && storedState.daypart === daypart && storedState.expiresAt > now) {
		const storedPose = findBasePose(daypart, storedState.poseId);
		if (storedPose && poseHasAvailablePosition(daypart, storedPose)) return storedPose;
		return fallbackPose;
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

export function getCompanionScenePosition(
	pose: CompanionPose | null,
	date = new Date(),
	storage: Storage | null = null
): CompanionScenePosition {
	const daypart = getPoseDaypart(date);
	const fallbackPose = pose ?? getCompanionBasePose(date, storage);
	const now = date.getTime();
	const availablePositions = getAvailablePositions(daypart, fallbackPose.id);
	const fallbackPosition =
		availablePositions[0] ??
		COMPANION_SCENE_POSITIONS.find((position) => position.id === 'foreground-right') ??
		COMPANION_SCENE_POSITIONS[0];
	const storedState = storage ? parseStoredPositionState(storage.getItem(POSITION_STORAGE_KEY)) : null;

	if (
		storedState &&
		storedState.daypart === daypart &&
		storedState.poseId === fallbackPose.id &&
		storedState.expiresAt > now
	) {
		return getPositionById(daypart, fallbackPose.id, storedState.positionId) ?? fallbackPosition;
	}

	const nextPosition = getWeightedPosition(availablePositions.length ? availablePositions : [fallbackPosition]);

	if (storage) {
		const poseExpiry = parseStoredState(storage.getItem(STORAGE_KEY))?.expiresAt ?? getNextExpiry(now);
		const nextState: StoredCompanionPositionState = {
			positionId: nextPosition.id,
			poseId: fallbackPose.id,
			daypart,
			expiresAt: Math.max(poseExpiry, getNextExpiry(now))
		};
		storage.setItem(POSITION_STORAGE_KEY, JSON.stringify(nextState));
	}

	return nextPosition;
}

export function getCompanionOverlayPose(
	daypart: CompanionPoseDaypart,
	motion: CompanionPose['motion']
): CompanionPose | null {
	const availableOverlays = COMPANION_POSES.filter(
		(pose) => pose.role === 'overlay' && pose.dayparts.includes(daypart) && pose.motion === motion
	);
	if (!availableOverlays.length) return null;

	// Blinks are brief and should be dependable; sleep movements remain uncommon.
	if (motion === 'blink') return availableOverlays[0];
	if (motion === 'sleep' && Math.random() > 0.3) return null;

	return availableOverlays[Math.floor(Math.random() * availableOverlays.length)];
}

export function getMsUntilNextCompanionPoseCheck(
	date = new Date(),
	storage: Storage | null = null
): number {
	const storedState = storage ? parseStoredState(storage.getItem(STORAGE_KEY)) : null;
	const remainingMs = storedState ? storedState.expiresAt - date.getTime() : 0;
	return Math.min(Math.max(remainingMs, 30 * 1000), 5 * 60 * 1000);
}
