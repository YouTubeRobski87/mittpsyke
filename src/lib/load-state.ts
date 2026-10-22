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
 * utom när servern redan bekräftat listan: då är den listan fortfarande sann.
 */
export function loadStateAfterClientFetch(previous: LoadState, succeeded: boolean): LoadState {
	if (succeeded) return 'ready';
	return previous === 'ready' ? 'ready' : 'error';
}
