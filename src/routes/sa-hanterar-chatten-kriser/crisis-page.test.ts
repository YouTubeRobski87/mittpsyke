import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CRISIS_RESPONSE, THIRD_PARTY_RISK_RESPONSE } from '$lib/ai/crisis-responses';

// Sidan beskriver hur krisspärren fungerar i dag. Testerna binder de
// påståenden som lättast blir fel när koden ändras.
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const page = read('./+page.svelte');
const chatServer = read('../api/chat/+server.ts');
const guard = read('../../lib/ai/crisis-guard.ts');

describe('/sa-hanterar-chatten-kriser', () => {
	it('visar akutnumren först', () => {
		const firstH2 = page.indexOf('<h2');
		expect(page.slice(firstH2, firstH2 + 200)).toContain('Om du är i fara just nu');
		for (const value of ['tel:112', 'tel:90101', 'tel:1177', 'https://stodlinjer.se']) {
			expect(page).toContain(value);
		}
	});

	it('hänvisar till samma nummer som säkerhetssvaren', () => {
		for (const value of ['112', '90101', '1177', 'Stödlinjer.se']) {
			expect(CRISIS_RESPONSE).toContain(value);
		}
		for (const value of ['112', '1177', 'Stödlinjer.se']) {
			expect(THIRD_PARTY_RISK_RESPONSE).toContain(value);
		}
	});

	it('påstår bara kontroll av det senaste meddelandet så länge spärren tar ett enda meddelande', () => {
		expect(guard).toMatch(/resolveDeterministicRiskGuard\(message: string\)/);
		expect(page).toContain('Den tittar bara på det senaste meddelandet');
	});

	it('stämmer med ordningen i chatten: spärren före lagring, rate limit och AI', () => {
		const guardAt = chatServer.indexOf('_resolveDeterministicChatGuard(message)');
		const rateLimitAt = chatServer.indexOf('// Rate limit');
		const insertAt = chatServer.indexOf(".from('messages').insert");
		expect(guardAt).toBeGreaterThan(0);
		expect(rateLimitAt).toBeGreaterThan(guardAt);
		expect(insertAt).toBeGreaterThan(guardAt);
	});

	it('loggar inte meddelandets text när spärren slår till', () => {
		const logBlock = chatServer.slice(
			chatServer.indexOf("'[chat] deterministic risk guard matched'"),
			chatServer.indexOf('return json({', chatServer.indexOf("'[chat] deterministic risk guard matched'"))
		);
		expect(logBlock).toContain('messageLength: message.length');
		expect(logBlock).not.toMatch(/message[,\s}]|content/);
		expect(page).toContain('Texten i meddelandet loggas inte.');
	});

	it('länkas från Ansvarsfull AI och finns i sitemapen', () => {
		expect(read('../ansvarsfull-ai/+page.svelte')).toContain('href="/sa-hanterar-chatten-kriser"');
		expect(read('../sitemap.xml/+server.ts')).toContain("path: '/sa-hanterar-chatten-kriser'");
	});
});
