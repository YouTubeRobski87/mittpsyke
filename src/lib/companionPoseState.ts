import {
	COMPANION_POSE_CHANGE_MAX_MS,
	COMPANION_POSE_CHANGE_MIN_MS,
	COMPANION_POSES,
	COMPANION_SCENE_POSITIONS,
	type CompanionId,
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

type StoredCompanionPositionState = StoredCompanionPoseState & {
	positionId: CompanionScenePositionId;
};

const storageKeyFor = (companionId: CompanionId) => `mittpsyke:companion-pose:${companionId}:v1`;
const positionStorageKeyFor = (companionId: CompanionId) =>
	`mittpsyke:companion-position:${companionId}:v1`;

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
	return now + COMPANION_POSE_CHANGE_MIN_MS + Math.floor(Math.random() * (COMPANION_POSE_CHANGE_MAX_MS - COMPANION_POSE_CHANGE_MIN_MS));
}

function parseStoredState(value: string | null): StoredCompanionPoseState | null {
	if (!value) return null;
	try {
		const parsed = JSON.parse(value) as Partial<StoredCompanionPoseState>;
		if (typeof parsed.poseId !== 'string' || !['day', 'evening', 'night'].includes(parsed.daypart ?? '') || typeof parsed.expiresAt !== 'number') return null;
		return parsed as StoredCompanionPoseState;
	} catch {
		return null;
	}
}

function parseStoredPositionState(value: string | null): StoredCompanionPositionState | null {
	const parsed = parseStoredState(value) as Partial<StoredCompanionPositionState> | null;
	if (!parsed || !COMPANION_SCENE_POSITIONS.some((position) => position.id === parsed.positionId)) return null;
	return parsed as StoredCompanionPositionState;
}

function belongsToCompanion(pose: CompanionPose, companionId: CompanionId) {
	return (pose.companionId ?? 'fox') === companionId;
}

function getAvailablePositions(daypart: CompanionPoseDaypart, poseId: string) {
	return COMPANION_SCENE_POSITIONS.filter(
		(position) => position.dayparts.includes(daypart) && position.allowedPoseIds.includes(poseId)
	);
}

function poseHasAvailablePosition(daypart: CompanionPoseDaypart, pose: CompanionPose) {
	return getAvailablePositions(daypart, pose.id).length > 0;
}

function getFallbackPose(companionId: CompanionId, availablePoses: CompanionPose[]) {
	return (
		COMPANION_POSES.find(
			(pose) => pose.role === 'base' && belongsToCompanion(pose, companionId) && pose.id === 'bear-standing'
		) ??
		availablePoses[0] ??
		COMPANION_POSES.find((pose) => pose.role === 'base' && belongsToCompanion(pose, companionId)) ??
		COMPANION_POSES[0]
	);
}

export function getCompanionPoseDaypart(date = new Date()) {
	return getPoseDaypart(date);
}

export function getCompanionBasePose(
	date = new Date(),
	storage: Storage | null = null,
	companionId: CompanionId = 'fox'
): CompanionPose {
	const daypart = getPoseDaypart(date);
	const now = date.getTime();
	const availablePoses = COMPANION_POSES.filter(
		(pose) => pose.role === 'base' && belongsToCompanion(pose, companionId) && pose.dayparts.includes(daypart) && poseHasAvailablePosition(daypart, pose)
	);
	const fallbackPose = getFallbackPose(companionId, availablePoses);
	const storedState = storage ? parseStoredState(storage.getItem(storageKeyFor(companionId))) : null;
	if (storedState && storedState.daypart === daypart && storedState.expiresAt > now) {
		const storedPose = COMPANION_POSES.find(
			(pose) => pose.role === 'base' && belongsToCompanion(pose, companionId) && pose.id === storedState.poseId && pose.dayparts.includes(daypart)
		);
		if (storedPose && poseHasAvailablePosition(daypart, storedPose)) return storedPose;
	}

	const nextPose = getWeightedPose(availablePoses.length ? availablePoses : [fallbackPose]);
	if (storage) storage.setItem(storageKeyFor(companionId), JSON.stringify({ poseId: nextPose.id, daypart, expiresAt: getNextExpiry(now) }));
	return nextPose;
}

export function getCompanionScenePosition(
	pose: CompanionPose | null,
	date = new Date(),
	storage: Storage | null = null,
	companionId: CompanionId = pose?.companionId ?? 'fox'
): CompanionScenePosition {
	const daypart = getPoseDaypart(date);
	const fallbackPose = pose ?? getCompanionBasePose(date, storage, companionId);
	const now = date.getTime();
	const availablePositions = getAvailablePositions(daypart, fallbackPose.id);
	const fallbackPosition = availablePositions[0] ?? COMPANION_SCENE_POSITIONS.find((position) => position.id === 'foreground-right') ?? COMPANION_SCENE_POSITIONS[0];
	const storedState = storage ? parseStoredPositionState(storage.getItem(positionStorageKeyFor(companionId))) : null;
	if (storedState && storedState.daypart === daypart && storedState.poseId === fallbackPose.id && storedState.expiresAt > now) {
		return availablePositions.find((position) => position.id === storedState.positionId) ?? fallbackPosition;
	}

	const nextPosition = getWeightedPosition(availablePositions.length ? availablePositions : [fallbackPosition]);
	if (storage) {
		const poseExpiry = parseStoredState(storage.getItem(storageKeyFor(companionId)))?.expiresAt ?? getNextExpiry(now);
		storage.setItem(positionStorageKeyFor(companionId), JSON.stringify({ positionId: nextPosition.id, poseId: fallbackPose.id, daypart, expiresAt: Math.max(poseExpiry, getNextExpiry(now)) }));
	}
	return nextPosition;
}

export function getCompanionOverlayPose(
	daypart: CompanionPoseDaypart,
	motion: CompanionPose['motion'],
	companionId: CompanionId = 'fox'
): CompanionPose | null {
	const availableOverlays = COMPANION_POSES.filter(
		(pose) => pose.role === 'overlay' && belongsToCompanion(pose, companionId) && pose.dayparts.includes(daypart) && pose.motion === motion
	);
	if (!availableOverlays.length) return null;
	if (motion === 'blink') return availableOverlays[0];
	if (motion === 'sleep' && Math.random() > 0.3) return null;
	return availableOverlays[Math.floor(Math.random() * availableOverlays.length)];
}

export function getMsUntilNextCompanionPoseCheck(
	date = new Date(),
	storage: Storage | null = null,
	companionId: CompanionId = 'fox'
) {
	const storedState = storage ? parseStoredState(storage.getItem(storageKeyFor(companionId))) : null;
	const remainingMs = storedState ? storedState.expiresAt - date.getTime() : 0;
	return Math.min(Math.max(remainingMs, 30 * 1000), 5 * 60 * 1000);
}
