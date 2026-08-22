import { EVENING_THEMES, type EveningThemeId } from '$lib/evening-checkin';

// Frivilliga nästa steg efter kvällens incheckning.
//
// Tre regler bär hela filen:
//
// 1. Inget här tolkar användarens psykologi. Ett tema är det användaren själv
//    valde att kalla kvällen, inte en bedömning av hur hen mår. Copyn speglar
//    tillbaka valet och frågar - den drar aldrig en slutsats om orsak.
// 2. Att stanna kvar är alltid ett av alternativen, och det leder ingenstans.
//    Ingen väg är obligatorisk och ingen är markerad som rekommenderad.
// 3. Allt är deterministiskt och pekar på funktioner som redan finns. Inga nya
//    övningar, ingen AI, ingen ny datainsamling.

export type EveningNextStepId = 'write' | 'exercise' | 'stay';

export type EveningNextStep = {
	id: EveningNextStepId;
	label: string;
	/** Null = alternativet leder ingenstans. Gäller alltid "stanna kvar". */
	href: string | null;
};

/** Att stanna kvar ser likadant ut oavsett tema, och står alltid sist. */
export const EVENING_STAY_STEP: EveningNextStep = {
	id: 'stay',
	label: 'Bara vara här en stund',
	href: null
};

const WRITE_STEP: EveningNextStep = {
	id: 'write',
	label: 'Skriva en stund',
	href: '/dagbok?action=new'
};

/**
 * Övningarna är befintliga sidor under /ovningar. Valet per tema är enkelt och
 * uppenbart - ingen dold viktning, ingen personlig profilering.
 */
const EXERCISE_BY_THEME: Record<EveningThemeId, { label: string; href: string }> = {
	racing_thoughts: { label: 'Göra en lugn övning', href: '/ovningar/grounding-5-4-3-2-1' },
	body_anxiety: { label: 'Göra en lugn övning', href: '/ovningar/4-7-8-andning' },
	loneliness: { label: 'Göra en lugn övning', href: '/ovningar/sjalvmedkansla-ovning' },
	tomorrow: { label: 'Göra en lugn övning', href: '/ovningar/dagens-avslut-reflektion' },
	other: { label: 'Göra en lugn övning', href: '/ovningar/body-scan' }
};

/**
 * Raden ovanför alternativen. Den upprepar användarens eget val med hens egna
 * ord och ställer en fråga - den påstår ingenting om vad valet betyder.
 */
export function getEveningNextStepPrompt(themeId: EveningThemeId | null | undefined): string {
	const theme = EVENING_THEMES.find((candidate) => candidate.id === themeId);
	if (!theme) return 'Vad skulle kännas bäst nu?';
	return `Du valde "${theme.label.toLocaleLowerCase('sv-SE')}". Vad skulle kännas bäst nu?`;
}

/**
 * Alternativen för ett tema. Ett okänt eller saknat värde ger de neutrala
 * alternativen i stället för att gissa - aldrig ett fel, aldrig en tolkning.
 */
export function getEveningNextSteps(
	themeId: EveningThemeId | null | undefined
): EveningNextStep[] {
	const exercise = themeId ? EXERCISE_BY_THEME[themeId] : undefined;
	if (!exercise) return [WRITE_STEP, EVENING_STAY_STEP];

	return [WRITE_STEP, { id: 'exercise', ...exercise }, EVENING_STAY_STEP];
}
