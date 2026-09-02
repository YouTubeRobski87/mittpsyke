/**
 * Supabase returns an obfuscated user with no identities for an existing
 * confirmed account in configurations that hide account enumeration. Only a
 * returned identity proves that this sign-up request created an account.
 */
export function createdAccountFromSignUp(user: { identities?: unknown[] } | null | undefined) {
	return Array.isArray(user?.identities) && user.identities.length > 0;
}

// This is a short-lived, one-time handoff from the server-confirmed sign-up
// action to the browser analytics helper. It contains no personal data.
export const SIGN_UP_COMPLETED_COOKIE = 'mittpsyke:sign-up-completed';
