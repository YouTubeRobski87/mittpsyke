import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

// P2 för den publika startsidan: färre sektioner, tydligare ordning.
// Hero -> Så fungerar det -> platsen (+ chatten som rad) -> Kvällsstugan ->
// guider -> trygghet -> avslutande CTA. Testerna läser den renderade sidan,
// så ordningen och rubrikerna är det besökaren faktiskt får.
// Sveltes scope-klasser (svelte-xxxx) tas bort så att testerna läser
// markupen och inte en hash som byts vid varje stiländring.
const body = render(Page, {
	props: { data: { isSignedInHome: false } as never }
})
	.body.replace(/\s?svelte-[a-z0-9]+/g, '')
	.replace(/ class=""/g, '');
const source = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

const headings = [...body.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map(([, level, text]) => ({
	level: Number(level),
	text: text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}));
const h2s = headings.filter((heading) => heading.level === 2).map((heading) => heading.text);
const sectionOf = (id: string) => {
	const start = body.indexOf(`aria-labelledby="${id}"`);
	return body.slice(start, body.indexOf('</section>', start));
};

describe('Startsidans P2-struktur', () => {
	it('har sektionerna i den nya ordningen', () => {
		expect(h2s).toEqual([
			'Fyra steg, och sedan börjar det om',
			'Så ser platsen ut',
			'En kort incheckning när dagen ska landa',
			'Guider när du behöver ord',
			'Vad det här är och inte är',
			'Börja med en mening'
		]);
	});

	it('har en hel rubrikhierarki utan tomma eller dubblerade rubriker', () => {
		expect(headings.filter((heading) => heading.level === 1)).toHaveLength(1);
		expect(headings.every((heading) => heading.text.length > 0)).toBe(true);
		expect(new Set(h2s).size).toBe(h2s.length);
		// Första rubriken efter h1 är en h2, aldrig ett hopp till h3.
		expect(headings[1].level).toBe(2);
	});

	it('lägger "Så fungerar det" direkt efter heron med fyra steg i en ordnad lista', () => {
		const how = sectionOf('how-title');
		expect(body.indexOf('aria-labelledby="how-title"')).toBeLessThan(
			body.indexOf('aria-labelledby="map-title"')
		);
		expect(how).toContain(
			'I ett anteckningsblock ligger det du skrivit kvar, men du får själv leta upp det. Här möter'
		);
		expect(how).toMatch(/<ol class="place-map how-steps[^"]*" role="list">/);
		const steps = [...how.matchAll(/<li>\s*<h3>([^<]+)<\/h3>\s*<p>([^<]+)<\/p>\s*<\/li>/g)].map(
			([, title, text]) => [title, text.replace(/\s+/g, ' ')]
		);
		expect(steps).toEqual([
			['Skriv.', 'Några ord eller en hel sida. Det finns inget rätt sätt.'],
			['Spara det du vill.', 'Utan konto stannar texten i din webbläsare. Med konto sparar du det du väljer.'],
			['Kom tillbaka när du vill.', 'Ingenting börjar om för att det gått en tid.'],
			['Se vad som återkommer.', 'Dina egna ord sammanställda — ingen mätning av hur du sköter dig.']
		]);
	});

	// "Resten försvinner när du stänger fliken" stämmer inte för en utloggad
	// besökare: GuestQuickEntry autosparar till localStorage var tredje sekund
	// och vid beforeunload. Formuleringen får inte komma tillbaka.
	it('lovar inte att osparad text försvinner när fliken stängs', () => {
		expect(body).not.toContain('försvinner när du stänger fliken');
	});

	it('har platskartan efter stegen och chatten som en fjärde, kort rad utanför ställena', () => {
		const map = sectionOf('map-title');
		expect(map).toContain('Tre ställen, inte fler.');
		expect([...map.matchAll(/<li>/g)]).toHaveLength(3);
		for (const place of ['Mitt Hem', 'Kvällsstugan', 'Följeslagaren']) {
			expect(map).toContain(`<h3>${place}</h3>`);
		}
		const tool = map.slice(map.indexOf('place-map-tool'));
		expect(tool).toContain('<h3>Chatten</h3>');
		expect(tool).toContain(
			'Vill du hellre prata fram tankarna finns en chatt. Du kan använda MittPsyke helt utan den.'
		);
		// Chatten är en rad i kartan, inte en egen sektion och ingen länk som
		// drar produktberättelsen mot /chat.
		expect(tool).not.toContain('href=');
		expect(body).not.toContain('Hjälp att sortera, när du vill ha det');
	});

	it('har exakt en trygghetssektion med avsändare, gränser, akutvägar och integritetslänk', () => {
		const trust = sectionOf('trust-title');
		expect(trust).toContain(
			'MittPsyke är ett stöd för reflektion — inte vård, behandling, diagnos eller akuthjälp.'
		);
		expect(trust).toContain('Robert Claesson, som också driver Stödlinjer.se.');
		expect(trust).toContain('<a href="tel:112">112</a>');
		expect(trust).toContain('href="https://www.1177.se"');
		expect(trust).toMatch(/href="https:\/\/stodlinjer\.se" target="_blank" rel="noopener noreferrer"/);
		expect(trust).toMatch(/href="\/integritet"[^>]*>\s*Så hanteras det du skriver/);

		// Gränsdragningen och akutlänken fanns tidigare på fyra ställen.
		expect(body.match(/inte vård/gi)).toHaveLength(1);
		expect(body.match(/href="tel:112"/g)).toHaveLength(1);
		expect(body).not.toContain('Inte vård. Inte behandling. Inte akuthjälp.');
		expect(body).not.toContain('Behöver du akut stöd?');
	});

	it('avslutar med en CTA där kontot kommer efter skrivandet', () => {
		const closing = sectionOf('closing-title');
		// Sidans sista sektion är den som bär avslutande CTA.
		const closingStart = body.lastIndexOf('<section', body.indexOf('aria-labelledby="closing-title"'));
		expect(body.lastIndexOf('<section')).toBe(closingStart);
		expect(closing).toContain('Du behöver inte veta vad du vill säga innan du börjar.');
		expect(closing).toMatch(/class="cta-primary" href="\/dagbok\?action=new"[^>]*>Börja skriva<\/a>/);
		expect(closing).toMatch(/class="cta-secondary" href="\/register"[^>]*>\s*Skapa konto för att spara/);
		expect(closing.indexOf('Börja skriva')).toBeLessThan(closing.indexOf('Skapa konto'));
		expect(closing).toContain('Med konto kan du spara det du skrivit och se tillbaka på det senare.');
	});

	it('har inte kvar de sektioner som slogs ihop', () => {
		for (const removed of [
			'Skillnaden mot ett anteckningsblock',
			'Efter ett tag syns mönstren',
			'>Bakom<',
			'id="difference-title"',
			'id="over-time-title"',
			'id="behind-title"',
			'id="chat-title"'
		]) {
			expect(body).not.toContain(removed);
		}
	});

	it('behåller P1 i heron', () => {
		const hero = sectionOf('hero-title');
		expect(hero).not.toContain('class="eyebrow"');
		expect(hero.match(/class="cta-primary"/g)).toHaveLength(1);
		expect(hero).toContain('Se platsen');
		expect(hero).toContain('Inget konto behövs. Texten stannar i din webbläsare.');
		expect(hero).toContain('cabin-proof--scene');
		expect(sectionOf('evening-title')).toContain('cabin-proof--card');
	});

	// Integritetstexten (dataflowCopy.anonymousDiary.short) knyts till
	// startsidan via kommentaren om den borttagna "Börja där du är"-sektionen.
	it('ändrar ingen analytics-spårning utöver att borttagna länkar försvinner', () => {
		expect(source).toContain('dataflowCopy.anonymousDiary.short');
		const closingSource = source.slice(source.indexOf('aria-labelledby="closing-title"'));
		expect(closingSource.slice(0, closingSource.indexOf('</section>'))).not.toContain('trackHomeCta');
	});
});
