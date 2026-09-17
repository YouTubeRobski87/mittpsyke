import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Kvällsincheckningens copy finns i tre längder. Samma formuleringar ska
// användas överallt, så att användaren känner igen vad funktionen gör oavsett
// var hen möter den. Testet slår fast var varje variant står.

const read = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8').replace(/\s+/g, ' ');

const CORE =
	'En kort stund för att landa i hur kvällen känns, sätta ord på det som tar mest plats och välja vad du vill bära vidare — eller lägga undan för ikväll.';
const SHORT = 'Stäm av kvällen och lägg undan det du inte behöver bära vidare just nu.';
const LONG =
	'Kvällsincheckningen hjälper dig att stanna upp inför kvällen. Du väljer hur det känns, kan skriva vad som tar mest plats och bestämmer sedan om du vill spara det, släppa det för ikväll eller bara vara kvar en stund.';

const home = read('src/routes/+page.svelte');
const evening = read('src/routes/dashboard/kvallsstugan/+page.svelte');
const signedInHome = read('src/lib/components/home/SignedInHome.svelte');
const cabinProof = read('src/lib/components/home/CabinProof.svelte');
const flow = read('src/lib/components/evening/EveningCheckinFlow.svelte');

describe('Kvällsincheckningens copy', () => {
	it('visar kärncopyn direkt ovanför flödet i Kvällstugan', () => {
		expect(evening).toContain('id="evening-flow-label">Kvällsincheckning</p>');
		expect(evening).toContain(CORE);
		expect(evening).toContain('aria-describedby="evening-flow-intro"');
	});

	it('använder den korta varianten i kort och ingångar', () => {
		expect(signedInHome).toContain(`<small>${SHORT}</small>`);
		expect(home).toContain(`Här gör du Kvällsincheckningen: ${SHORT.charAt(0).toLowerCase()}${SHORT.slice(1)}`);
	});

	it('förklarar funktionen med den längre varianten på startsidan', () => {
		expect(home).toContain('<h2 id="evening-title">Kvällsincheckning</h2>');
		expect(home).toContain(LONG);
	});

	it('pekar exemplet i CabinProof till Kvällsincheckningen i Kvällstugan', () => {
		expect(cabinProof).toContain('Här är det bara ett exempel. Kvällsincheckningen gör du i Kvällstugan.');
	});

	it('lovar ingen effekt och använder inget vårdspråk', () => {
		const forbidden = /må bättre|lugnar ångest|minskar ångest|förbättra\w* sömn|terapi|behandla|symtom|diagnos/i;
		const eveningSection = home.slice(
			home.indexOf('aria-labelledby="evening-title"'),
			home.indexOf('</section>', home.indexOf('aria-labelledby="evening-title"'))
		);
		for (const copy of [CORE, SHORT, LONG, eveningSection, signedInHome, cabinProof, flow]) {
			expect(copy).not.toMatch(forbidden);
		}
	});
});
