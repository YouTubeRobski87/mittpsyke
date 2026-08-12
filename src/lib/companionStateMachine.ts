import type { CompanionPose } from './companionPoseManifest';

// ---------------------------------------------------------------------------
// Kanonisk tillståndsordlista för följeslagaren, oberoende av vilka specifika
// bild-poser (companionPoseManifest.ts) eller viktad-slump/localStorage-val
// (companionPoseState.ts) som faktiskt styr bytet. De filerna äger *urvalet*
// av pose; den här filen äger bara *namngivningen* - vilket av de nio
// tillstånden en given pose motsvarar - så att CSS, tester eller framtida
// komponenter kan styra mot ett stabilt vokabulär även om fler bildvarianter
// läggs till senare (t.ex. flera "sit"-varianter för olika dagpartier).
// ---------------------------------------------------------------------------

export type CompanionState =
	| 'idle'
	| 'look-left'
	| 'look-right'
	| 'blink'
	| 'sniff'
	| 'walk'
	| 'sit'
	| 'rest'
	| 'sleep';

// Mappar bas-pose-id → kanoniskt tillstånd. Poser som inte finns med här
// (t.ex. framtida tillägg) faller tillbaka till "idle" i getBaseCompanionState.
const BASE_POSE_ID_TO_STATE: Record<string, CompanionState> = {
	// Räv
	idle: 'idle',
	'look-left': 'look-left',
	'look-right': 'look-right',
	sit: 'sit',
	'sit-look-up': 'sit',
	'evening-lake': 'sit',
	drink: 'sniff',
	sniff: 'sniff',
	stretch: 'idle',
	walk: 'walk',
	rest: 'rest',
	'sleep-curled': 'sleep',
	'sleep-side': 'sleep',
	// Björn
	'bear-standing': 'idle',
	'bear-sitting': 'sit',
	'bear-sleeping': 'sleep',
	'bear-stretching': 'idle',
	// Varg
	'wolf-standing': 'idle',
	'wolf-sleeping': 'sleep'
};

/** Mappar en bas-pose till dess kanoniska tillstånd. Okänt/saknat → "idle". */
export function getBaseCompanionState(basePose: Pick<CompanionPose, 'id'> | null | undefined): CompanionState {
	if (!basePose) return 'idle';
	return BASE_POSE_ID_TO_STATE[basePose.id] ?? 'idle';
}

/**
 * Det tillstånd som faktiskt ska visas/rapporteras just nu. En aktiv
 * blink-overlay räknas som "blink" oavsett vilken baspose den ligger ovanpå -
 * precis som ett riktigt djur blinkar mitt i en annan rörelse - annars
 * basposens mappade tillstånd.
 */
export function getCompanionDisplayState(
	basePose: Pick<CompanionPose, 'id'> | null | undefined,
	overlayPose: Pick<CompanionPose, 'motion'> | null | undefined
): CompanionState {
	if (overlayPose?.motion === 'blink') return 'blink';
	return getBaseCompanionState(basePose);
}
