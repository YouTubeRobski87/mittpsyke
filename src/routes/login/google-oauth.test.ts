import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const loginSource = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

describe('Google-inloggning', () => {
	it('behåller en knapp som kan aktiveras när Google OAuth är tillgänglig', () => {
		expect(loginSource).toContain('disabled={loading || oauthLoading || !googleOAuthAvailable}');
		expect(loginSource).toContain('onclick={continueWithGoogle}');
	});

	it('startar den befintliga Google-OAuth-funktionen med den centrala callbacken', () => {
		expect(loginSource).toContain("provider: 'google'");
		expect(loginSource).toContain("redirectTo: getStableOAuthCallbackUrl('/dashboard')");
	});

	it('pekar fallback-länken mot den kanoniska apex-domänen', () => {
		expect(loginSource).toContain('href="https://mittpsyke.se/login"');
		expect(loginSource).not.toContain('href="https://www.mittpsyke.se/login"');
	});
});
