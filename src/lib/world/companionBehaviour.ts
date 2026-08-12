// Beteendesystem för följeslagarens mikrorörelser.
//
// Rörelserna körs som CSS-transformer på grundbilden i stället för egna
// sprites, eftersom bara räven har overlay-bilder i companionPoseManifest -
// björn och varg har enbart statiska grundposer. Det här ger alla tre samma
// lilla liv mellan posbytena, och rävens riktiga blink/gesture-overlays
// fortsätter spelas parallellt ovanpå.
//
// Lägg till en ny rörelse genom att lägga till en post i BEHAVIOURS och en
// matchande @keyframes i CompanionPose.svelte (selektorn följer id:t).

export type CompanionBehaviourId =
	| 'glance-left'
	| 'glance-right'
	| 'ear-twitch'
	| 'settle'
	| 'sniff';

export type CompanionBehaviour = {
	id: CompanionBehaviourId;
	/** Relativ sannolikhet mot övriga rörelser. */
	weight: number;
	/** Hur länge rörelsen spelar, i ms. Hålls kort - vilan är det som gör den lugn. */
	durationMs: number;
};

// Blickarna dominerar medvetet: de läses tydligast som "levande" på en
// stillbild. Öronryck och nosande är lågt viktade - de är de mest "pilliga"
// rörelserna och skulle annars kännas påträngande tillsammans med de
// kontinuerliga vatten- och lövrörelserna i scenen. Med vikterna nedan blir
// någon av dem vald ~14% av gångerna, dvs i snitt ungefär var sjätte minut.
export const COMPANION_BEHAVIOURS: readonly CompanionBehaviour[] = [
	{ id: 'glance-left', weight: 3, durationMs: 2800 },
	{ id: 'glance-right', weight: 3, durationMs: 2800 },
	{ id: 'settle', weight: 2, durationMs: 2200 },
	{ id: 'ear-twitch', weight: 0.7, durationMs: 900 },
	{ id: 'sniff', weight: 0.6, durationMs: 2600 }
];

// Vila mellan rörelserna. Satt så att följeslagaren är stilla minst 95% av
// tiden - se testet som räknar ut den viktade duty cycle:n, det går sönder om
// någon sänker vilan eller förlänger en rörelse för mycket.
export const COMPANION_BEHAVIOUR_MIN_REST_MS = 44_000;
export const COMPANION_BEHAVIOUR_MAX_REST_MS = 70_000;
// Första rörelsen kommer tidigare, så en besökare som stannar en stund
// hinner se att platsen lever utan att det känns påträngande direkt.
export const COMPANION_BEHAVIOUR_FIRST_MIN_MS = 9_000;
export const COMPANION_BEHAVIOUR_FIRST_MAX_MS = 20_000;

/** Andelen tid följeslagaren rör sig, givet vikter och vilotider ovan. */
export function getMotionDutyCycle(): number {
	const totalWeight = COMPANION_BEHAVIOURS.reduce((sum, b) => sum + b.weight, 0);
	const averageGestureMs =
		COMPANION_BEHAVIOURS.reduce((sum, b) => sum + b.weight * b.durationMs, 0) / totalWeight;
	const averageRestMs = (COMPANION_BEHAVIOUR_MIN_REST_MS + COMPANION_BEHAVIOUR_MAX_REST_MS) / 2;
	return averageGestureMs / (averageGestureMs + averageRestMs);
}

// Poser som redan har egen rörelse eller där en extra kropps-transform skulle
// se fel ut (sovande djur ska ligga still, gående har redan sin rörelse).
const QUIET_POSE_IDS = new Set([
	'sleep-curled',
	'sleep-side',
	'bear-sleeping',
	'wolf-sleeping',
	'rest',
	'walk'
]);

export function isQuietPose(poseId: string | null | undefined): boolean {
	return poseId ? QUIET_POSE_IDS.has(poseId) : false;
}

export function canPlayCompanionSettle(poseId: string | null | undefined): boolean {
	return !isQuietPose(poseId);
}

/**
 * Väljer nästa rörelse viktat. `random` injiceras för testbarhet.
 * Undviker att upprepa samma rörelse två gånger i rad, så den inte
 * känns som en loopad spelanimation.
 */
export function pickCompanionBehaviour(
	previousId: CompanionBehaviourId | null = null,
	random: () => number = Math.random
): CompanionBehaviour {
	const candidates = COMPANION_BEHAVIOURS.filter((behaviour) => behaviour.id !== previousId);
	const pool = candidates.length > 0 ? candidates : COMPANION_BEHAVIOURS;
	const totalWeight = pool.reduce((sum, behaviour) => sum + behaviour.weight, 0);

	let cursor = random() * totalWeight;
	for (const behaviour of pool) {
		cursor -= behaviour.weight;
		if (cursor <= 0) return behaviour;
	}

	return pool[pool.length - 1];
}

/** Slumpad vila före nästa rörelse. */
export function getCompanionBehaviourRestMs(
	isFirst = false,
	random: () => number = Math.random
): number {
	const min = isFirst ? COMPANION_BEHAVIOUR_FIRST_MIN_MS : COMPANION_BEHAVIOUR_MIN_REST_MS;
	const max = isFirst ? COMPANION_BEHAVIOUR_FIRST_MAX_MS : COMPANION_BEHAVIOUR_MAX_REST_MS;
	return min + random() * (max - min);
}
