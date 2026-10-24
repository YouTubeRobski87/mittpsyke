// Vägen från gästens skrivyta till ett konto och tillbaka till Dagboken.
//
// Både vanlig registrering och Google-inloggning bär samma ?redirect=, som
// valideras med safeInternalRedirect. Efter kontot landar användaren i
// Dagboken, där de lokala inläggen kan sparas till kontot genom ett aktivt val.

import { withSafeRedirect } from '$lib/safe-redirect';

export const DIARY_AFTER_SIGNUP_PATH = '/dagbok/checkin';

export const CREATE_ACCOUNT_FROM_DIARY_HREF = withSafeRedirect('/register', DIARY_AFTER_SIGNUP_PATH);
