// Gemensamma tillstånd för listor med personligt innehåll.
//
// En tom lista får aldrig betyda "hämtningen misslyckades". Tomt läge visas
// bara när hämtningen faktiskt lyckades och gav noll rader. Annars kan en
// tillfällig databasstörning se ut som att användarens anteckningar är borta.

/** Vad servern kunde ladda: allt gick bra, eller hämtningen misslyckades. */
export type LoadStatus = 'ready' | 'error';

/** Klientens tillstånd. `loading` gäller även en omhämtning efter serverfel. */
export type LoadState = 'loading' | LoadStatus;

/**
 * Visas när anteckningar inte kunde hämtas. Formuleringen lovar inte mer än
 * vi vet: ett läsfel raderar ingenting, men vi kan inte se innehållet just nu.
 */
export const NOTES_LOAD_ERROR_MESSAGE =
	'Vi kunde inte visa dina anteckningar just nu. Det betyder inte att de har raderats. Försök igen om en liten stund.';

/** Visas när Gemenskapens flöde inte kunde hämtas. Säger inget om orsaken. */
export const COMMUNITY_LOAD_ERROR_MESSAGE =
	'Vi kunde inte hämta Gemenskapen just nu. Försök igen om en liten stund.';

/**
 * Visas på Framsteg när antalet sparade inlägg inte kunde läsas. Lovar inte
 * mer än vi vet, precis som texten för anteckningar.
 */
export const PROGRESS_LOAD_ERROR_MESSAGE =
	'Vi kunde inte hämta dina framsteg just nu. Det betyder inte att dina anteckningar har raderats. Försök igen om en liten stund.';

export const NOTES_LOADING_MESSAGE = 'Hämtar dina anteckningar…';

export const LOAD_RETRY_LABEL = 'Försök igen';

/**
 * Klientens starttillstånd utifrån serverns svar. Ett serverfel blir
 * `loading`, eftersom klienten försöker hämta igen innan något visas.
 * Saknas status (äldre data) gäller det tidigare beteendet: `ready`.
 */
export function initialLoadState(status: LoadStatus | undefined): LoadState {
	return status === 'error' ? 'loading' : 'ready';
}

/**
 * Tillståndet efter klientens egen hämtning. Ett misslyckande blir `error`,
 * utom när servern redan bekräftat listan, eller när en senare hämtning (t.ex.
 * efter ett sparande) hunnit lyckas medan den här pågick: då är den listan
 * fortfarande sann och ett gammalt fel får inte dölja den.
 */
export function loadStateAfterClientFetch(
	previous: LoadState,
	succeeded: boolean,
	newerLoadSucceeded = false
): LoadState {
	if (succeeded || newerLoadSucceeded) return 'ready';
	return previous === 'ready' ? 'ready' : 'error';
}
