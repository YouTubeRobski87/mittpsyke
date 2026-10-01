import type { CompanionPoseDaypart } from '$lib/companionPoseManifest';
import { pickPersistedRotation } from '$lib/companionPoseState';
import { PROGRESS_SCENE_IMAGE_SIZE } from '$lib/progressCompanionPlacement';
import type { ProgressSceneBand } from '$lib/progressScene';

export type ProgressHumanPoseId = 'sitting' | 'fishing' | 'waterside';

export type ProgressHumanPose = {
	id: ProgressHumanPoseId;
	src: string;
	canvasWidth: number;
	canvasHeight: number;
	/** Markankare och renderad höjd i originalbildens 1672×941-koordinater. */
	groundX: number;
	groundY: number;
	renderHeight: number;
	/** Horisontell ankarpunkt i den beskurna posebildens egen bredd. */
	anchorXPercent: number;
};

const SITTING_POSE: ProgressHumanPose = {
	id: 'sitting',
	src: '/images/scenes/progress-human-sitting.webp',
	canvasWidth: 1122,
	canvasHeight: 1304,
	groundX: 1010,
	groundY: 775,
	renderHeight: 310,
	anchorXPercent: 62
};

export const PROGRESS_HUMAN_POSES: Record<ProgressHumanPoseId, ProgressHumanPose> = {
	sitting: SITTING_POSE,
	fishing: {
		id: 'fishing',
		src: '/images/scenes/progress-human-fishing.webp',
		canvasWidth: 1095,
		canvasHeight: 1324,
		groundX: 1018,
		groundY: 775,
		renderHeight: 310,
		anchorXPercent: 64
	},
	waterside: {
		id: 'waterside',
		src: '/images/scenes/progress-human-waterside.webp',
		canvasWidth: 464,
		canvasHeight: 1370,
		groundX: 1110,
		groundY: 775,
		renderHeight: 330,
		anchorXPercent: 50
	}
};

type HumanPoseChoice = { id: ProgressHumanPoseId; weight: number };

const DAY_CHOICES: HumanPoseChoice[] = [
	{ id: 'sitting', weight: 1.2 },
	{ id: 'fishing', weight: 1.8 },
	{ id: 'waterside', weight: 0.8 }
];

const EVENING_CHOICES: HumanPoseChoice[] = [
	{ id: 'sitting', weight: 1.2 },
	{ id: 'fishing', weight: 0.6 },
	{ id: 'waterside', weight: 1.8 }
];

const REST_CHOICES: HumanPoseChoice[] = [{ id: 'sitting', weight: 1 }];
const SITTING_CHOICE: HumanPoseChoice = { id: 'sitting', weight: 1 };

export const PROGRESS_HUMAN_POSE_STORAGE_KEY = 'mittpsyke:progress-human-pose:v1';

export function getProgressInitialHumanPose(): ProgressHumanPose {
	return SITTING_POSE;
}

function rotationForBand(band: ProgressSceneBand): {
	daypart: CompanionPoseDaypart;
	candidates: HumanPoseChoice[];
} {
	if (band === 'morning' || band === 'day') {
		return { daypart: 'day', candidates: DAY_CHOICES };
	}
	if (band === 'evening') {
		return { daypart: 'evening', candidates: EVENING_CHOICES };
	}
	return { daypart: 'night', candidates: REST_CHOICES };
}

function hasReadableStoredState(storage: Storage): boolean {
	const raw = storage.getItem(PROGRESS_HUMAN_POSE_STORAGE_KEY);
	if (raw === null) return true;

	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		return (
			typeof parsed.poseId === 'string' &&
			['day', 'evening', 'night'].includes(String(parsed.daypart)) &&
			typeof parsed.expiresAt === 'number'
		);
	} catch {
		return false;
	}
}

/**
 * Route-lokalt poseval. Det tar bara dygnsfas, tid och lagring som input:
 * mående, dagbok och analysdata kan därför aldrig påverka människans pose.
 */
export function getProgressHumanPose(
	band: ProgressSceneBand | null | undefined,
	date = new Date(),
	storage: Storage | null = null
): ProgressHumanPose {
	if (!band || !storage) return SITTING_POSE;

	try {
		if (!hasReadableStoredState(storage)) return SITTING_POSE;

		const { daypart, candidates } = rotationForBand(band);
		const fallback = candidates.find((choice) => choice.id === 'sitting') ?? SITTING_CHOICE;
		const choice = pickPersistedRotation({
			candidates,
			fallback,
			storageKey: PROGRESS_HUMAN_POSE_STORAGE_KEY,
			now: date.getTime(),
			daypart,
			storage,
			resolveStored: (id) => candidates.find((candidate) => candidate.id === id) ?? null
		});
		return PROGRESS_HUMAN_POSES[choice.id] ?? SITTING_POSE;
	} catch {
		return SITTING_POSE;
	}
}

export function getProgressHumanPosePlacementStyle(pose: ProgressHumanPose): string {
	return [
		`--progress-human-left: ${(pose.groundX / PROGRESS_SCENE_IMAGE_SIZE.width) * 100}%`,
		`--progress-human-top: ${(pose.groundY / PROGRESS_SCENE_IMAGE_SIZE.height) * 100}%`,
		`--progress-human-height: ${(pose.renderHeight / PROGRESS_SCENE_IMAGE_SIZE.height) * 100}%`,
		`--progress-human-anchor-x: ${pose.anchorXPercent}%`
	].join('; ');
}
