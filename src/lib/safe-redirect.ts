/**
 * Validerar en ?redirect=-parameter innan den används som destination efter
 * inloggning.
 *
 * Bara interna sökvägar accepteras. Utan den här kontrollen blir
 * `/login?redirect=...` en open redirect: en angripare kan länka till en
 * inloggningssida på vår egen domän som skickar användaren vidare till sin
 * egen sajt direkt efter att lösenordet skrivits in.
 *
 * Avvisas: absoluta URL:er, protokollrelativa (`//evil.tld`), backslash-varianter
 * som vissa webbläsare normaliserar till `//`, och kontrolltecken.
 */
const DEFAULT_DESTINATION = '/dashboard';

// Kontrolltecken (inkl. radbrytningar) hör inte hemma i en sökväg och kan
// användas för injektion i Location-headern. Kontrolleras via teckenkod i
// stället för regex, så källkoden inte behöver innehålla literala styrbytes.
function hasControlCharacter(value: string): boolean {
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code < 0x20 || code === 0x7f) return true;
	}
	return false;
}

export function safeInternalRedirect(
	value: string | null | undefined,
	fallback: string = DEFAULT_DESTINATION
): string {
	if (typeof value !== 'string') return fallback;

	const trimmed = value.trim();
	if (!trimmed) return fallback;

	// Måste vara en rot-relativ sökväg.
	if (!trimmed.startsWith('/')) return fallback;

	// `//host` och `/\host` tolkas som protokollrelativa URL:er.
	if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback;

	if (hasControlCharacter(trimmed)) return fallback;

	return trimmed;
}
