export const EVENING_CHECKIN_FLOW_VERSION = 'evening-calm-v1';

export const EVENING_THEMES = [
	{ id: 'racing_thoughts', label: 'Tankarna snurrar' },
	{ id: 'body_anxiety', label: 'Oro i kroppen' },
	{ id: 'loneliness', label: 'Känner mig ensam' },
	{ id: 'tomorrow', label: 'Orolig inför imorgon' },
	{ id: 'other', label: 'Något annat' }
] as const;

export const EVENING_PARKING_BUCKETS = [
	{ id: 'tomorrow', label: 'Låta det vänta till imorgon' },
	{ id: 'small_step', label: 'Ta ett litet steg' },
	{ id: 'not_tonight', label: 'Inte lösa det ikväll' }
] as const;

export type EveningThemeId = (typeof EVENING_THEMES)[number]['id'];
export type EveningParkingBucket = (typeof EVENING_PARKING_BUCKETS)[number]['id'];

export const MAX_EVENING_THOUGHT_LENGTH = 1_200;

export type EveningCheckinInput = {
	themeId: EveningThemeId;
	thought: string | null;
	parkingBucket: EveningParkingBucket;
	flowVersion: typeof EVENING_CHECKIN_FLOW_VERSION;
};

export type EveningCheckinValidation =
	| { ok: true; data: EveningCheckinInput }
	| { ok: false; error: string };

export type EveningFlowStep = 1 | 2 | 3 | 4;

/** Steg två är avsiktligt frivilligt. De två valen runt fritexten är däremot alltid nödvändiga. */
export function canAdvanceEveningFlow(
	step: EveningFlowStep,
	input: { themeId: EveningThemeId | null; parkingBucket: EveningParkingBucket | null }
): boolean {
	if (step === 1) return input.themeId !== null;
	if (step === 2) return true;
	if (step === 3) return input.parkingBucket !== null;
	return false;
}

function isThemeId(value: unknown): value is EveningThemeId {
	return typeof value === 'string' && EVENING_THEMES.some((theme) => theme.id === value);
}

function isParkingBucket(value: unknown): value is EveningParkingBucket {
	return typeof value === 'string' && EVENING_PARKING_BUCKETS.some((bucket) => bucket.id === value);
}

/** Validerar en frivillig kvällsincheckning. Fritext lämnar aldrig klienten utan sparval. */
export function validateEveningCheckinInput(value: unknown): EveningCheckinValidation {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return { ok: false, error: 'Ogiltigt underlag.' };
	}

	const input = value as Record<string, unknown>;
	if (!isThemeId(input.themeId)) {
		return { ok: false, error: 'Välj hur det är ikväll.' };
	}
	if (!isParkingBucket(input.parkingBucket)) {
		return { ok: false, error: 'Välj vad du vill göra med det för ikväll.' };
	}
	if (input.flowVersion !== EVENING_CHECKIN_FLOW_VERSION) {
		return { ok: false, error: 'Ogiltig version av Kvällslugn.' };
	}
	if (input.thought !== null && input.thought !== undefined && typeof input.thought !== 'string') {
		return { ok: false, error: 'Tanken måste vara text.' };
	}

	const thought = typeof input.thought === 'string' ? input.thought.trim() : '';
	if (thought.length > MAX_EVENING_THOUGHT_LENGTH) {
		return {
			ok: false,
			error: `Tanken får vara högst ${MAX_EVENING_THOUGHT_LENGTH} tecken.`
		};
	}

	return {
		ok: true,
		data: {
			themeId: input.themeId,
			thought: thought || null,
			parkingBucket: input.parkingBucket,
			flowVersion: EVENING_CHECKIN_FLOW_VERSION
		}
	};
}
