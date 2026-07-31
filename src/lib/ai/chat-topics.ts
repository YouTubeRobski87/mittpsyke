// Valfria ämnesgenvägar för chattens ingång.
//
// Genvägarna är medvetet FRIKOPPLADE från stödkategorierna A/B/E. Kategorierna
// styr vilken systemprompt som används och ligger sparade i databasen; en genväg
// är bara en mjuk vink om var användaren tror att samtalet börjar. Därför får
// sex genvägar inte bli sex separata chattupplevelser.
//
// Etiketterna är en fast lista och valideras på servern innan de vävs in i
// systemprompten. Fritext från användaren får aldrig hamna i prompten den vägen.

export type ChatTopicHint = {
	id: string;
	label: string;
};

export const CHAT_TOPIC_HINTS: readonly ChatTopicHint[] = [
	{ id: 'angest', label: 'Ångest' },
	{ id: 'depression', label: 'Depression' },
	{ id: 'stress', label: 'Stress & utmattning' },
	{ id: 'relationer', label: 'Relationer' },
	{ id: 'tvangstankar', label: 'Tvångstankar' },
	{ id: 'somn', label: 'Sömn' }
];

export function getTopicHint(id: unknown): ChatTopicHint | null {
	if (typeof id !== 'string') return null;
	const normalized = id.trim().toLowerCase();
	if (!normalized) return null;
	return CHAT_TOPIC_HINTS.find((hint) => hint.id === normalized) ?? null;
}

export function isValidTopicHintId(id: unknown): boolean {
	return getTopicHint(id) !== null;
}

/**
 * Raden som vävs in i systemprompten när en genväg valts.
 *
 * Formuleringen är avsiktligt underordnad: genvägen är en möjlig ingång, inte
 * ett facit. Modellen ska följa det användaren faktiskt skriver, även när det
 * visar sig handla om något helt annat än genvägen antydde.
 */
export function buildTopicHintInstruction(id: unknown): string | null {
	const hint = getTopicHint(id);
	if (!hint) return null;
	return `Användaren valde "${hint.label}" som möjlig ingång, men följ alltid det faktiska innehållet i samtalet. Genvägen är inte en diagnos och inte en avgränsning - om samtalet handlar om något annat, följ med dit utan att kommentera valet.`;
}
