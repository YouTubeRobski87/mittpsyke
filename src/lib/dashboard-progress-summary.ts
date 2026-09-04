// Sammanfattningsraden under "Ditt nuläge" på Mitt Hem.
//
// Ligger här i stället för i +page.server.ts av två skäl: SvelteKit tillåter
// inga egna värdeexporter ur +page.server.ts, och copyn ska kunna testas mot
// faktiska tal utan att hela laddaren behöver mockas.
//
// Språkregel: raden räknar det som finns sparat. Den tolkar aldrig personen
// bakom talen och beskriver aldrig sammanhängande dagar.
//
// Tidigare eskalerade raden med antal dagar i följd - "7 dagar nära i tid. Du
// har hittat en rytm som verkar fungera just nu." Det gjorde obruten användning
// till ett resultat, och därmed varje dag utan inlägg till ett brutet resultat.
// Sammanhängande dagar räknas fortfarande i laddaren, men presenteras inte.

/** Ingen sparad anteckning ännu. En inbjudan, inte ett mål. */
export const EMPTY_PROGRESS_SUMMARY = 'Små steg räcker. Skriv ditt första inlägg här.';

/**
 * @param weeklyEntries Antal inlägg sedan måndag i innevarande vecka.
 * @param totalEntries Antal sparade anteckningar totalt.
 *
 * Texten säger aldrig mer än de två talen visar. Negativa eller icke-ändliga
 * tal behandlas som noll, så en trasig räkning aldrig kan bli en påhittad
 * mening.
 */
export function buildProgressSummary(weeklyEntries: number, totalEntries: number): string {
	const total = Number.isFinite(totalEntries) ? Math.max(0, Math.trunc(totalEntries)) : 0;
	const weekly = Number.isFinite(weeklyEntries) ? Math.max(0, Math.trunc(weeklyEntries)) : 0;

	if (total < 1) {
		return EMPTY_PROGRESS_SUMMARY;
	}

	const saved =
		total === 1
			? '1 sparad anteckning finns kvar att gå tillbaka till.'
			: `${total} sparade anteckningar finns kvar att gå tillbaka till.`;

	if (weekly >= 1) {
		return `${weekly} inlägg den här veckan. ${saved}`;
	}

	return saved;
}
