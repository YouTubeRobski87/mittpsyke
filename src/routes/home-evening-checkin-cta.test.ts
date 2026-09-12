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

	// Exemplet och vägen till den riktiga incheckningen hör ihop: CTA:n är
	// nästa interaktiva element efter kortet, utan någon annan länk emellan.
	it('lägger CTA:n direkt efter exemplet', () => {
		const afterCard = publicHome.slice(publicHome.indexOf('<CabinProof variant="card" />'));
		const nextLink = afterCard.slice(afterCard.indexOf('<a'));
		expect(nextLink).toMatch(/^<a\s+class="text-link"\s+href=\{EVENING_CHECKIN_DESTINATION\}/);
	});

	// Stödlänken stod tidigare här bredvid CTA:n. Sedan P2 är akutvägarna
	// samlade i trygghetssektionen; här ska de inte dubbleras, men de får inte
	// heller försvinna från sidan.
	it('har akutvägen i trygghetssektionen i stället för bredvid CTA:n', () => {
		const evening = publicHome.slice(
			publicHome.indexOf('evening-inner'),
			publicHome.indexOf('<!-- 5.')
		);
		expect(evening).not.toContain('href={SUPPORT_LINES_URL}');
		expect(evening).not.toContain('Behöver du akut stöd?');

		const trust = publicHome.slice(publicHome.indexOf('aria-labelledby="trust-title"'));
		expect(trust).toContain('href={SUPPORT_LINES_URL}');
		expect(trust).toContain('<a href="tel:112">112</a>');
	});

	// Produktbeviset låg tidigare som överlägg i heron med display:none under
	// 1120px - alltså osynligt på varje telefon. Det hör hemma här, och får
	// inte döljas i någon bredd igen.
	it('visar stegkortet här i stället för som överlägg i heron', () => {
		const evening = publicHome.slice(
			publicHome.indexOf('evening-inner'),
			publicHome.indexOf('<!-- 5.')
		);
		expect(evening).toContain('<CabinProof variant="card" />');
	});

	it('döljer aldrig produktbeviset på någon skärmbredd', () => {
		const styles = page.slice(page.indexOf('<style>'));
		expect(styles).not.toMatch(/\.evening-proof\s*\{[^}]*display:\s*none/);
	});
});
