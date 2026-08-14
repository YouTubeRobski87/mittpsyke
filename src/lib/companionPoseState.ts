import {
	COMPANION_POSE_CHANGE_MAX_MS,
	COMPANION_POSE_CHANGE_MIN_MS,
	COMPANION_POSES,
	COMPANION_SCENE_CONTEXT_POSITION_IDS,
	COMPANION_SCENE_POSITIONS,
	type CompanionId,
	type CompanionPose,
	type CompanionPoseDaypart,
	type CompanionSceneContext,
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

export type CompanionPosePreference = 'default' | 'calm';

const storageKeyFor = (companionId: CompanionId, preference: CompanionPosePreference = 'default') =>
	`mittpsyke:companion-pose:${companionId}:${preference}:v1`;
// Positionen lagras per scen, till skillnad från posen. Posen är
// följeslagarens tillstånd och ska vara densamma i alla vyer; positionen är
// scenberoende, så ett val gjort i Framsteg får inte läcka in i dashboarden
// och tvinga fram en fallback där.
const positionStorageKeyFor = (
	companionId: CompanionId,
	scene: CompanionSceneContext | null,
	preference: CompanionPosePreference = 'default'
) => `mittpsyke:companion-position:${companionId}:${scene ?? 'any'}:${preference}:v1`;

const CALM_POSE_IDS = new Set([
	'idle',
	'look-left',
	'look-right',
	'sit',
	'sit-look-up',
	'evening-lake',
	'rest',
	'sleep-curled',
	'sleep-side',
	'bear-sitting',
	'bear-sleeping',
	'wolf-standing',
	'wolf-sleeping'
]);

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

// scene = null betyder "ingen scenbegränsning" och ger exakt det tidigare
// beteendet - så anropare utan scenkontext (t.ex. tester) inte påverkas.
function isPositionAllowedInScene(
	position: CompanionScenePosition,
	scene: CompanionSceneContext | null
) {
	return scene === null || COMPANION_SCENE_CONTEXT_POSITION_IDS[scene].includes(position.id);
}

function getAvailablePositions(
	daypart: CompanionPoseDaypart,
	poseId: string,
	scene: CompanionSceneContext | null = null
) {
	return COMPANION_SCENE_POSITIONS.filter(
		(position) =>
			position.dayparts.includes(daypart) &&
			position.allowedPoseIds.includes(poseId) &&
			isPositionAllowedInScene(position, scene)
	);
}

function poseHasAvailablePosition(
	daypart: CompanionPoseDaypart,
	pose: CompanionPose,
	scene: CompanionSceneContext | null = null
) {
	return getAvailablePositions(daypart, pose.id, scene).length > 0;
}

// Sista utvägen om ingen pose är tillgänglig för dagparten just nu (t.ex. en
// framtida följeslagare med ofullständig dagpartstäckning). Varje companions
// poser är listade med sin lugnaste stående/sittande pose först i
// companionPoseManifest.ts, så den enklaste find() nedan råkar alltid landa
// där - följeslagaren visas aldrig trasig, bara i sitt mest neutrala läge.
function getFallbackPose(companionId: CompanionId, availablePoses: CompanionPose[]) {
	return (
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
	companionId: CompanionId = 'fox',
	scene: CompanionSceneContext | null = null,
	preference: CompanionPosePreference = 'default'
): CompanionPose {
	const daypart = getPoseDaypart(date);
	const now = date.getTime();
	const allAvailablePoses = COMPANION_POSES.filter(
		(pose) => pose.role === 'base' && belongsToCompanion(pose, companionId) && pose.dayparts.includes(daypart) && poseHasAvailablePosition(daypart, pose, scene)
	);
	const calmPoses = allAvailablePoses.filter((pose) => CALM_POSE_IDS.has(pose.id));
	const availablePoses = preference === 'calm' && calmPoses.length ? calmPoses : allAvailablePoses;
	const fallbackPose = getFallbackPose(companionId, availablePoses);
	const storedState = storage ? parseStoredState(storage.getItem(storageKeyFor(companionId, preference))) : null;
	if (storedState && storedState.daypart === daypart && storedState.expiresAt > now) {
		const storedPose = COMPANION_POSES.find(
			(pose) => pose.role === 'base' && belongsToCompanion(pose, companionId) && pose.id === storedState.poseId && pose.dayparts.includes(daypart)
		);
		if (storedPose && poseHasAvailablePosition(daypart, storedPose, scene)) return storedPose;
	}

	const nextPose = getWeightedPose(availablePoses.length ? availablePoses : [fallbackPose]);
	if (storage) storage.setItem(storageKeyFor(companionId, preference), JSON.stringify({ poseId: nextPose.id, daypart, expiresAt: getNextExpiry(now) }));
	return nextPose;
}

export function getCompanionScenePosition(
	pose: CompanionPose | null,
	date = new Date(),
	storage: Storage | null = null,
	companionId: CompanionId = pose?.companionId ?? 'fox',
	scene: CompanionSceneContext | null = null,
	preference: CompanionPosePreference = 'default'
): CompanionScenePosition {
	const daypart = getPoseDaypart(date);
	const fallbackPose = pose ?? getCompanionBasePose(date, storage, companionId, scene, preference);
	const now = date.getTime();
	const availablePositions = getAvailablePositions(daypart, fallbackPose.id, scene);
	const fallbackPosition = availablePositions[0] ?? COMPANION_SCENE_POSITIONS.find((position) => position.id === 'foreground-right') ?? COMPANION_SCENE_POSITIONS[0];
	const storedState = storage ? parseStoredPositionState(storage.getItem(positionStorageKeyFor(companionId, scene, preference))) : null;
	if (storedState && storedState.daypart === daypart && storedState.poseId === fallbackPose.id && storedState.expiresAt > now) {
		return availablePositions.find((position) => position.id === storedState.positionId) ?? fallbackPosition;
	}

	const nextPosition = getWeightedPosition(availablePositions.length ? availablePositions : [fallbackPosition]);
	if (storage) {
		const poseExpiry = parseStoredState(storage.getItem(storageKeyFor(companionId, preference)))?.expiresAt ?? getNextExpiry(now);
		storage.setItem(positionStorageKeyFor(companionId, scene, preference), JSON.stringify({ positionId: nextPosition.id, poseId: fallbackPose.id, daypart, expiresAt: Math.max(poseExpiry, getNextExpiry(now)) }));
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
	companionId: CompanionId = 'fox',
	preference: CompanionPosePreference = 'default'
) {
	const storedState = storage
		? parseStoredState(storage.getItem(storageKeyFor(companionId, preference)))
		: null;
	const remainingMs = storedState ? storedState.expiresAt - date.getTime() : 0;
	return Math.min(Math.max(remainingMs, 30 * 1000), 5 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// "Kommer tillbaka"-signal. Egen, separat lagringsnyckel (skild från
// pos/position-nycklarna ovan) eftersom det här mäter besök, inte poseval.
//
// Skrivs en gång per faktisk sidmontering, aldrig från den periodiska
// pose-uppdateringen - annars skulle en flik som bara ligger öppen i
// timmar felaktigt tolkas som "borta och tillbaka" varje gång posen
// råkar uppdateras i bakgrunden.
// ---------------------------------------------------------------------------

/** Hur länge companionen måste ha varit osedd för att räknas som en återkomst. */
export const COMPANION_RETURN_ABSENCE_THRESHOLD_MS = 4 * 60 * 60 * 1000;

const lastSeenStorageKeyFor = (companionId: CompanionId) =>
	`mittpsyke:companion-last-seen:${companionId}:v1`;

/**
 * Millisekunder sedan companionen senast sågs, eller null om det saknas en
 * tidigare tidsstämpel (första besöket - inget att jämföra "återkomst" mot).
 * Ren läsning, ingen sidoeffekt - anropas innan recordCompanionSeen skriver
 * över värdet.
 */
export function getCompanionAbsenceMs(
	now: Date,
	storage: Storage | null,
	companionId: CompanionId
): number | null {
	if (!storage) return null;
	const stored = storage.getItem(lastSeenStorageKeyFor(companionId));
	if (!stored) return null;
	const previous = Number(stored);
	if (!Number.isFinite(previous)) return null;
	return Math.max(0, now.getTime() - previous);
}

/** Skriver den aktuella tiden som "senast sedd". Måste anropas efter att den
 *  gamla tidsstämpeln redan lästs med getCompanionAbsenceMs, annars jämförs
 *  `now` mot sig själv. */
export function recordCompanionSeen(now: Date, storage: Storage | null, companionId: CompanionId): void {
	if (!storage) return;
	storage.setItem(lastSeenStorageKeyFor(companionId), String(now.getTime()));
}

/** Ren tröskelkontroll, utan storage-beroende - lätt att testa isolerat. */
export function qualifiesAsCompanionReturn(absenceMs: number | null): boolean {
	return absenceMs !== null && absenceMs >= COMPANION_RETURN_ABSENCE_THRESHOLD_MS;
}

// ---------------------------------------------------------------------------
// Reaktion på en sparad reflektion. Den faktiska tidsstämpeln lagras och
// tolkas av $lib/diary-events.ts (som inte vet något om följeslagaren) -
// den här funktionen äger bara tolkningen av hur "nyligen" räknas.
// ---------------------------------------------------------------------------

/** Hur länge en sparad reflektion räknas som "nyligen" för följeslagarens
 *  reaktion. Efter det ska flaggan rensas utan att spela någon gest. */
export const COMPANION_REFLECTION_REACTION_WINDOW_MS = 6 * 60 * 60 * 1000;

/**
 * Ren tröskelkontroll, samma mönster som qualifiesAsCompanionReturn - inget
 * storage-beroende, lätt att testa mot exakta gränsvärden. En tidsstämpel i
 * framtiden (klockskevhet) räknas som ogiltig, inte som "precis sparad".
 */
export function isReflectionSaveWithinReactionWindow(savedAtMs: number, now: Date): boolean {
	const age = now.getTime() - savedAtMs;
	return age >= 0 && age <= COMPANION_REFLECTION_REACTION_WINDOW_MS;
}
