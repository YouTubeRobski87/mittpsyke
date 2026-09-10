// Meditationsinnehåll för Sovläge.
//
// Ingenting nytt skrivs här. Övningarna finns redan under /ovningar och är
// samma texter som evening-next-steps.ts redan pekar på efter incheckningen –
// det här lagret plockar bara ut dem i en form som en playback-adapter kan
// läsa upp.
//
// Källan är alltså innehåll, inte uppspelning. Byter vi senare från TTS till
// inspelade filer är det den här modulen som får ett `audioSrc`-fält, medan
// panelen och tillståndslogiken lämnas orörda.

import { tools, type Tool } from '$lib/data/seo-architecture';

export type EveningMeditation = {
	id: string;
	title: string;
	/** Kort beskrivning i valet. Kommer från övningens egen description. */
	summary: string;
	/** Inledande stycke som läses upp först, om övningen har ett. */
	intro: string | null;
	/** Stegen som läses upp i ordning. Alltid minst ett. */
	lines: readonly string[];
	/** Länk till hela övningen, för den som hellre vill läsa själv. */
	href: string;
};

/**
 * Urvalet och ordningen är medvetna. Body scan står först eftersom den är
 * skriven som en liggande övning och är den enda som uttryckligen tar 10–15
 * minuter – de andra två tar under två minuter och passar bättre som ett kort
 * alternativ än som kvällens huvudspår.
 */
export const EVENING_MEDITATION_IDS = [
	'body-scan',
	'4-7-8-andning',
	'grounding-5-4-3-2-1'
] as const;

export const DEFAULT_EVENING_MEDITATION_ID = 'body-scan';

function toMeditation(tool: Tool): EveningMeditation | null {
	// Steps är valfritt i Tool-typen. En övning utan steg har ingenting att
	// läsa upp, och då är det bättre att den inte erbjuds alls än att Sovläge
	// startar och är tyst.
	if (!tool.steps || tool.steps.length === 0) return null;

	return {
		id: tool.slug,
		title: tool.title,
		summary: tool.description,
		intro: tool.purpose ?? null,
		lines: tool.steps,
		href: `/ovningar/${tool.slug}`
	};
}

export function getEveningMeditations(): EveningMeditation[] {
	return EVENING_MEDITATION_IDS.map((id) => {
		const tool = tools.find((candidate) => candidate.slug === id);
		return tool ? toMeditation(tool) : null;
	}).filter((meditation): meditation is EveningMeditation => meditation !== null);
}

export function getEveningMeditation(id: string | null): EveningMeditation | null {
	if (!id) return null;
	return getEveningMeditations().find((meditation) => meditation.id === id) ?? null;
}

/**
 * Raderna som faktiskt spelas upp: inledningen först om den finns, sedan
 * stegen. Hålls skild från `lines` så att en framtida ljudfil kan ersätta hela
 * sekvensen utan att texten behöver ändras.
 */
export function getEveningMeditationScript(meditation: EveningMeditation): string[] {
	return meditation.intro ? [meditation.intro, ...meditation.lines] : [...meditation.lines];
}
