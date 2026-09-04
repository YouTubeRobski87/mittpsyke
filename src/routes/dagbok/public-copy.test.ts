import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { writable } from 'svelte/store';
import Page from './+page.svelte';
import { dataflowCopy } from '$lib/dataflow-copy';

vi.mock('$app/stores', () => ({
	page: writable({ url: new URL('https://mittpsyke.se/dagbok?action=new') })
}));

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const plainText = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('publik dagbok: utkast, kontosparande och integritet', () => {
	it('visar skrivytan utan konto och förklarar lokal lagring och dess begränsningar', () => {
		const { body } = render(Page);
		expect(body).toContain('<textarea');
		expect(body).toContain(dataflowCopy.anonymousDiary.transfer);
		expect(plainText(body)).toMatch(/lokalt utkast/);
		expect(plainText(body)).toMatch(/laddar om sidan.*stänger webbläsaren/);
		expect(plainText(body)).toContain('privat läge');
	});

	it('skiljer registrering från att aktivt spara ett kontoinlägg', () => {
		const text = plainText(render(Page).body);
		expect(text).toContain('Skapa konto för att spara inlägg');
		expect(text).toMatch(/blir ett dagboksinlägg först när du.*väljer att spara/);
		expect(text).not.toContain('Med ett konto sparas det du skriver');
		const guest = source('../../lib/components/GuestQuickEntry.svelte');
		expect(guest).toMatch(/aria-live="polite">Lokalt utkast<\/span>/);
		expect(guest).not.toMatch(/aria-live="polite">(?:Sparat|Utkast sparat lokalt)<\/span>/);
		const register = source('../register/+page.svelte');
		expect(register).toContain('Utkastet stannar i den här webbläsaren');
		expect(register).toContain('väljer att spara i dagboken');
	});

	it('ger samma korrekta FAQ-svar i sidan och dess strukturerade data', () => {
		const { body, head } = render(Page);
		const json = head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
		expect(json).toBeDefined();
		const schema = JSON.parse(json!) as {
			mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
		};
		const account = schema.mainEntity.find((item) => item.name === 'Behöver jag skapa ett konto?');
		expect(account?.acceptedAnswer.text).toMatch(/skriva ett lokalt utkast utan konto/);
		expect(account?.acceptedAnswer.text).toMatch(/spara dagboksinlägg.*konto/);
		for (const item of schema.mainEntity) {
			expect(plainText(body)).toContain(item.acceptedAnswer.text);
		}
		expect(body).not.toContain('Du kan läsa om funktionen utan att logga in');
	});

	it('förklarar system- och leverantörsbehandling utan absoluta åtkomstlöften', () => {
		const body = render(Page).body;
		expect(body).toContain('MittPsykes system och Supabase');
		expect(body).toContain('AI-reflektioner är valfria och kräver separat samtycke');
		expect(body).toContain('href="/integritet"');
		for (const text of [body, source('../blogg/kvallasangest/+page.svelte')]) {
			expect(text).not.toMatch(/ingen annan kan läsa|ingen kan se|endast du|ingen tredje part|skickas aldrig|helt anonym|Nej\. Dina dagboksinlägg är privata för dig/i);
		}
	});
});
