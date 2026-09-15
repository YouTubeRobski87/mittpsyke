import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NEUTRAL_CATEGORY, normalizeCategory } from '$lib/ai/chat-categories';

const projectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const aboutPage = projectFile('./om-mittpsyke/+page.svelte');
const howPage = projectFile('./sa-fungerar-mittpsyke/+page.svelte');
const chatPage = projectFile('../lib/components/ChatPage.svelte');
const layout = projectFile('./+layout.svelte');

describe('MittPsykes produktberättelse och dataflöden', () => {
	it('beskriver skrivande, sparande och mönster som produktens sammanhang', () => {
		expect(aboutPage.replace(/\s+/g, ' ')).toContain('en lugn plats för att skriva av sig, reflektera och kunna återvända till sina egna ord över tid');
		expect(aboutPage).toContain('Mitt Hem');
		expect(aboutPage).toContain('Kvällstugan');
		expect(aboutPage).toContain('Balder är MittPsykes enda följeslagare.');
		expect(aboutPage).not.toContain('I centrum finns ett AI-baserat samtalsstöd');
	});

	it('gör inte ett val mellan äldre samtalsspår obligatoriskt', () => {
		expect(chatPage).toContain("page.params.category ?? 'samtal'");
		expect(normalizeCategory(undefined)).toBe(NEUTRAL_CATEGORY);
		expect(aboutPage.replace(/\s+/g, ' ')).toContain('Du kan öppna chatten utan konto och utan att välja tema.');
		expect(aboutPage).not.toContain('Ångest, Depression eller Trauma');
	});

	it('skiljer lokalt skrivande från AI-chatt utan konto', () => {
		expect(howPage).toContain('dataflowCopy.anonymousDiary.short');
		expect(howPage).toContain('dataflowCopy.guestChat.aiTransfer');
		expect(howPage).toContain('dataflowCopy.guestChat.retention');
		expect(howPage).not.toContain('Anonymt läge och konto');
	});

	it('lägger kärnloopen först på Så fungerar MittPsyke och chatten sist bland delarna', () => {
		const order = [
			'<h3>Skriv.</h3>',
			'<h3>Spara det du vill.</h3>',
			'<h3>Kom tillbaka när du vill.</h3>',
			'<h3>Se vad som återkommer.</h3>',
			'<h3>Dagboken</h3>',
			'<h3>Kvällstugan och Kvällsincheckningen</h3>',
			'<h3>Balder, din följeslagare</h3>',
			'<h3>Chatten – ett valfritt AI-verktyg</h3>',
			'<h2 id="limits-title">Det här är MittPsyke inte</h2>'
		].map((heading) => howPage.indexOf(heading));

		expect(order.every((index) => index > -1)).toBe(true);
		expect([...order].sort((a, b) => a - b)).toEqual(order);
		// AI nämns inte före kärnloopen.
		expect(howPage.indexOf('AI', howPage.indexOf('<main'))).toBeGreaterThan(order[3]);
	});

	it('beskriver Kvällstugan, Balder och chatten konkret och utan löften', () => {
		const text = howPage.replace(/\s+/g, ' ');
		expect(text).toContain('Där inne finns Kvällsincheckningen: fyra korta steg');
		expect(text).toContain('Balder är MittPsykes enda följeslagare.');
		expect(text).toContain('Han påverkas inte av hur du mår');
		expect(text).toContain('Svaren skapas av AI, kan bli fel och ersätter inte vård eller en människa att prata med.');
		expect(text).not.toMatch(/profilbild|avatar|Kvällslugn|Kvällsstugan|hjälper dig|må bättre|vad som påverkar dig/i);
	});

	it('följer produktidentiteten på Om MittPsyke: varför, kärnan, delarna, gränser, integritet', () => {
		const order = [
			'<h2 id="why-title">Varför MittPsyke finns</h2>',
			'<h2 id="core-title">Kärnan</h2>',
			'<h2 id="parts-title">Delarna</h2>',
			'<h2 id="limits-title">Vad MittPsyke inte är</h2>',
			'<h2 id="privacy-title">Integritet och kontroll</h2>',
			'<h2 id="company-title">Vem står bakom MittPsyke</h2>'
		].map((heading) => aboutPage.indexOf(heading));
		expect(order.every((index) => index > -1)).toBe(true);
		expect([...order].sort((a, b) => a - b)).toEqual(order);

		const text = aboutPage.replace(/\s+/g, ' ');
		for (const part of ['Dagboken', 'Kvällstugan och Kvällsincheckningen', 'Balder', 'AI-chatten, om du vill']) {
			expect(aboutPage).toContain(`<h3>${part}</h3>`);
		}
		for (const limit of ['Inte vård eller akuthjälp.', 'Inte terapi.', 'Ingen diagnos.', 'Ingen prestationsmätning.', 'Ingen streak.']) {
			expect(text).toContain(`<strong>${limit}</strong>`);
		}
		expect(aboutPage).toContain('<a href="/integritet">Läs integritetspolicyn</a>');
		// Chatten är en av fyra delar, inte positioneringen.
		expect(text).not.toMatch(/AI-baserat (stöd|samtalsstöd)|Trygg chat|KBT|psykoedukation|grounding|Kvällslugn|Kvällsstugan|profilbild|avatar/i);
		// Synlig text, utan skript, stilar, kommentarer och attribut.
		const visible = aboutPage
			.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '')
			.replace(/<[^>]+>/g, ' ');
		expect((visible.match(/chatt/gi) ?? []).length).toBeLessThanOrEqual(4);
	});

	it('beskriver inte den lokala dagboken som AI-driven i global metadata', () => {
		expect(layout).toContain('självreflektion, dagbok och AI-baserat samtalsstöd');
		expect(layout).toContain('dagbok, reflektion, mönster över tid och AI-chatt');
		expect(layout).not.toContain('AI-driven dagbok');
	});

	it('behåller tydliga vård- och säkerhetsgränser', () => {
		for (const source of [aboutPage, howPage]) {
			expect(source).toMatch(/inte vård/i);
			expect(source).toContain('112');
			expect(source).toContain('1177');
		}
	});
});
