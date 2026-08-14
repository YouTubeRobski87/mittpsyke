// Återkomst är en liten, lokal produktkontext – inte besökshistorik. Den
// använder följeslagarens redan befintliga "senast sedd"-signal och en enda
// sessionsflagga, men exponerar aldrig någon exakt frånvarotid i gränssnittet.

export type ReturnContext =
	| 'first_visit'
	| 'same_session'
	| 'same_day'
	| 'recent_return'
	| 'longer_return';

type ReturnContextInput = {
	now: Date;
	lastSeenAt: Date | null;
	hasSeenInSession: boolean;
};

const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';
const RECENT_RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_SEEN_KEY = 'mittpsyke:return-context-session-seen:v1';

function getStockholmDateKey(date: Date): string {
	return new Intl.DateTimeFormat('sv-SE', {
		timeZone: STOCKHOLM_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(date);
}

/**
 * Klassificerar återkomsten utan att räkna eller formulera frånvaro. En öppen
 * session har alltid företräde: vanlig navigation tillbaka till Mitt Hem är
 * kontinuitet, inte en ny återkomst.
 */
export function getReturnContext({ now, lastSeenAt, hasSeenInSession }: ReturnContextInput): ReturnContext {
	if (hasSeenInSession) return 'same_session';
	if (!lastSeenAt || !Number.isFinite(lastSeenAt.getTime())) return 'first_visit';

	const elapsedMs = now.getTime() - lastSeenAt.getTime();
	if (elapsedMs < 0) return 'first_visit';
	if (getStockholmDateKey(now) === getStockholmDateKey(lastSeenAt)) return 'same_day';
	if (elapsedMs < RECENT_RETURN_WINDOW_MS) return 'recent_return';
	return 'longer_return';
}

/** Sessionsflaggan innehåller ingen tidsstämpel eller användaridentifierare. */
export function hasSeenReturnContextInSession(storage: Storage | null): boolean {
	return storage?.getItem(SESSION_SEEN_KEY) === '1';
}

export function recordReturnContextSessionSeen(storage: Storage | null): void {
	storage?.setItem(SESSION_SEEN_KEY, '1');
}
