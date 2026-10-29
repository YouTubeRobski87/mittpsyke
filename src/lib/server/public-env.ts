// SvelteKit skickar med ALLA PUBLIC_*-variabler från servermiljön i varje sidas
// HTML, eftersom koden läser $env/dynamic/public i klienten. En variabel som
// ligger kvar i Render efter en avvecklad tjänst (t.ex. ett gammalt pixel-ID)
// blir därför publik på varje sida, även om ingen kod använder den.
//
// Listan är de PUBLIC_*-variabler som koden faktiskt läser. Testet i
// public-env.test.ts håller den i synk med källkoden.
export const ALLOWED_PUBLIC_ENV_KEYS: readonly string[] = [
	'PUBLIC_GA_MEASUREMENT_ID',
	'PUBLIC_SITE_URL',
	'PUBLIC_SUPABASE_ANON_KEY',
	'PUBLIC_SUPABASE_URL',
	'PUBLIC_VERCEL_ENV'
];

/** Namnen (aldrig värdena) på PUBLIC_*-variabler som inte står i listan. */
export function unexpectedPublicEnvKeys(env: Record<string, string | undefined>): string[] {
	return Object.keys(env)
		.filter((key) => key.startsWith('PUBLIC_') && !ALLOWED_PUBLIC_ENV_KEYS.includes(key))
		.sort();
}

/** Varnar en gång i serverloggen, med bara variabelnamnen, om okända PUBLIC_* finns. */
export function warnAboutUnexpectedPublicEnv(
	env: Record<string, string | undefined>,
	warn: (message: string) => void = console.warn
): string[] {
	const keys = unexpectedPublicEnvKeys(env);
	if (keys.length > 0) {
		warn(
			`[public-env] Okända PUBLIC_*-variabler skickas med i varje sidas HTML: ${keys.join(', ')}. ` +
				'Ta bort dem i Render om de inte används.'
		);
	}
	return keys;
}
