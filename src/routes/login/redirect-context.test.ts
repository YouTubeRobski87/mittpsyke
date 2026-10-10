import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const loginSource = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

describe('redirect-kontext på inloggningen', () => {
	it('visar Kvällstugan-kontext bara för den exakta Kvällstugan-redirecten', () => {
		expect(loginSource).toContain(
			"page.url.searchParams.get('redirect') === '/dashboard/kvallsstugan'"
		);
		expect(loginSource).toMatch(
			/\{#if isEveningCabinRedirect\}[\s\S]*?Logga in för att öppna Kvällstugan\.[\s\S]*?Du kommer tillbaka dit efter inloggningen\.[\s\S]*?\{\/if\}/
		);
	});

	it('behåller de befintliga returvägarna för lösenord, Google och registrering', () => {
		expect(loginSource).toContain("safeInternalRedirect(page.url.searchParams.get('redirect'))");
		expect(loginSource).toContain(
			"getStableOAuthCallbackUrl(safeInternalRedirect(page.url.searchParams.get('redirect')))"
		);
		expect(loginSource).toContain(
			"withSafeRedirect('/register', page.url.searchParams.get('redirect'))"
		);
	});

	it('lägger inte till någon generell kontext för andra login-mål', () => {
		expect(loginSource).not.toMatch(/redirect.*startsWith|redirect.*includes|redirect.*match/i);
		expect(loginSource.match(/isEveningCabinRedirect/g)).toHaveLength(2);
	});
});
