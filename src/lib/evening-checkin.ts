export const EVENING_CHECKIN_FLOW_VERSION = 'evening-calm-v1';

export const EVENING_THEMES = [
	{ id: 'racing_thoughts', label: 'Tankarna snurrar' },
	{ id: 'body_anxiety', label: 'Oro i kroppen' },
	{ id: 'loneliness', label: 'Känner mig ensam' },
	{ id: 'tomorrow', label: 'Orolig inför imorgon' },
	// Kvällsstugan är inte bara till för svåra kvällar. Det här valet betyder inte
	// "jag mår jättebra" utan är avsiktligt mjukare, och det egna id:t gör att en
	// framtida analys kan skilja det från de fyra som beskriver något jobbigt.
	{ id: 'feeling_okay', label: 'Det är ändå okej' },
	{ id: 'other', label: 'Något annat' }
] as const;

export const EVENING_PARKING_BUCKETS = [
	{ id: 'tomorrow', label: 'Låta det vänta till imorgon' },
	{ id: 'small_step', label: 'Ta ett litet steg' },
	{ id: 'not_tonight', label: 'Inte lösa det ikväll' }
] as const;

// Samma steg, men för en kväll som inte bär på något att hantera. De tre valen
// ovan förutsätter alla ett "det" som är ett bekymmer - särskilt "inte lösa det
// ikväll" läser fel för den som just sagt att kvällen är okej.
//
// Egna id:n i stället för omdöpta etiketter, så att ett sparat värde betyder
// samma sak för alltid och analysen inte blandar ihop de två vägarna.
export const EVENING_CALM_PARKING_BUCKETS = [
	{ id: 'let_it_be', label: 'Låta kvällen vara som den är' },
	{ id: 'carry_it', label: 'Ta med mig det här till imorgon' },
	{ id: 'take_it_easy', label: 'Bara ta det lugnt' }
] as const;

export type EveningThemeId = (typeof EVENING_THEMES)[number]['id'];
export type EveningParkingBucket =
	| (typeof EVENING_PARKING_BUCKETS)[number]['id']
	| (typeof EVENING_CALM_PARKING_BUCKETS)[number]['id'];

/** Teman som beskriver en kväll utan något att hantera. */
const CALM_THEMES: readonly EveningThemeId[] = ['feeling_okay'];

/** Steg tre ser olika ut beroende på om kvällen bär på något eller inte. */
export function getEveningParkingBuckets(
	themeId: EveningThemeId | null | undefined
): readonly { readonly id: EveningParkingBucket; readonly label: string }[] {
	return themeId && CALM_THEMES.includes(themeId)
		? EVENING_CALM_PARKING_BUCKETS
		: EVENING_PARKING_BUCKETS;
}

/** Rubriken över samma steg. Frågar aldrig vad som ska lösas för en lugn kväll. */
export function getEveningParkingPrompt(themeId: EveningThemeId | null | undefined): string {
	return themeId && CALM_THEMES.includes(themeId)
		? 'Vad känns rätt för resten av kvällen?'
		: 'Vad vill du göra med det för ikväll?';
}

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
	if (typeof value !== 'string') return false;
	return (
		EVENING_PARKING_BUCKETS.some((bucket) => bucket.id === value) ||
		EVENING_CALM_PARKING_BUCKETS.some((bucket) => bucket.id === value)
	);
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
	// Steg tre visar olika uppsättningar beroende på tema, och kombinationen låses
	// även här. Annars kan ett sparat värde beskriva ett steg användaren aldrig
	// blev erbjuden. Samma källa som UI:t läser, så reglerna inte kan glida isär.
	if (!getEveningParkingBuckets(input.themeId).some((bucket) => bucket.id === input.parkingBucket)) {
		return { ok: false, error: 'Valet hör inte till hur du beskrev kvällen.' };
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
