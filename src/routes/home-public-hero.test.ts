import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const publicHome = page.slice(page.indexOf('{:else}'), page.indexOf('</main>'));

describe('Den publika startsidans hero', () => {
	it('förklarar skrivande, kontinuitet och mönster direkt i den publika grenen', () => {
		expect(publicHome).toContain('Skriv, reflektera och se mönster över tid');
		expect(publicHome).toContain('Skriv av dig. Se mönster över tid.');
		expect(publicHome).toContain(
			'MittPsyke är ett digitalt stöd där du kan skriva, reflektera och följa hur du har det över'
		);
		expect(publicHome).toContain('Skriv → spara det du vill → se vad som återkommer');
	});

	it('låter den primära CTA:n börja skriva utan konto och behåller platsen för sparande', () => {
		expect(publicHome).toMatch(
			/class="cta-primary"\s+href=\{ANONYMOUS_WRITE_DESTINATION\}\s+onclick=\{\(\) => trackHomeCta\('hero', 'skriv_utan_konto', ANONYMOUS_WRITE_DESTINATION\)\}/
		);
		expect(publicHome).toContain('Börja skriva');
		expect(publicHome).toMatch(
			/class="cta-secondary"\s+href=\{CREATE_PLACE_DESTINATION\}\s+onclick=\{\(\) => trackHomeCta\('hero', 'skapa_din_plats', CREATE_PLACE_DESTINATION\)\}/
		);
		expect(publicHome).toContain('Skapa en plats för att spara det du skriver');
	});
});
