import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const publicHome = page.slice(page.indexOf('{:else}'), page.indexOf('</main>'));

describe('Kvällsstugan-sektionen på den publika startsidan', () => {
	it('leder vidare till den riktiga incheckningen via inloggningen', () => {
		expect(page).toContain(
			"const EVENING_CHECKIN_DESTINATION = '/login?redirect=/dashboard/kvallsstugan';"
		);
		expect(publicHome).toMatch(
			/class="text-link"\s+href=\{EVENING_CHECKIN_DESTINATION\}/
		);
		expect(publicHome).toContain('Öppna kvällsincheckningen');
	});

	it('säger var incheckningen görs, så CTA:n inte överraskar med inloggning', () => {
		expect(publicHome).toContain('Du gör den i Kvällsstugan när');
	});

	it('behåller stödlänken bredvid den nya CTA:n', () => {
		expect(publicHome).toContain('Behöver du akut stöd?');
	});

	// Produktbeviset låg tidigare som överlägg i heron med display:none under
	// 1120px - alltså osynligt på varje telefon. Det hör hemma här, och får
	// inte döljas i någon bredd igen.
	it('visar stegkortet här i stället för som överlägg i heron', () => {
		const evening = publicHome.slice(
			publicHome.indexOf('evening-inner'),
			publicHome.indexOf('<!-- 4.')
		);
		expect(evening).toContain('<CabinProof variant="card" />');
	});

	it('döljer aldrig produktbeviset på någon skärmbredd', () => {
		const styles = page.slice(page.indexOf('<style>'));
		expect(styles).not.toMatch(/\.evening-proof\s*\{[^}]*display:\s*none/);
	});
});
