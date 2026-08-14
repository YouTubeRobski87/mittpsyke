/**
 * Kvällsstugan behåller bara ett avtryck som redan finns i den verkliga
 * persistenceen, eller som just bekräftats av ett lyckat API-svar.
 */
export function isEveningInteriorMemoryEligible(
	hasPersistedEveningCheckin: boolean,
	saveSucceeded: boolean
): boolean {
	return hasPersistedEveningCheckin || saveSucceeded;
}
