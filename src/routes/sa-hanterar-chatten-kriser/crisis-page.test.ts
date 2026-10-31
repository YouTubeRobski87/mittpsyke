import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CRISIS_RESPONSE, THIRD_PARTY_RISK_RESPONSE } from '$lib/ai/crisis-responses';
import { CHAT_CONTEXT_LIMIT, sanitizeChatMessages } from '$lib/state/chat-memory';

// Sidan beskriver hur krisspärren fungerar i dag. Testerna binder de
// påståenden som lättast blir fel när koden ändras.
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const page = read('./+page.svelte');
const chatServer = read('../api/chat/+server.ts');
const guard = read('../../lib/ai/crisis-guard.ts');
const chatWindow = read('../../lib/components/ChatWindow.svelte');

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

	it('skiljer serverns lagring från chattfönstrets historik', () => {
		// Servern: spärren svarar innan något skrivs till messages (se testet ovan).
		// Klienten: meddelandet och säkerhetssvaret hamnar ändå i meddelandelistan.
		const send = chatWindow.slice(
			chatWindow.indexOf('async function send()'),
			chatWindow.indexOf('async function send()') + 6000
		);
		expect(send).toContain("messages.push({ role: 'user', content: text });");
		expect(send).toMatch(/messages\.push\(\{\s*role: 'assistant',\s*content: assistantReply,\s*crisis: data\?\.crisis \?\? false/);

		// Krismarkerade meddelanden filtreras inte bort ur historiken.
		const kept = sanitizeChatMessages([
			{ role: 'user', content: 'meddelande' },
			{ role: 'assistant', content: CRISIS_RESPONSE, crisis: true }
		]);
		expect(kept).toHaveLength(2);

		// Historiken sparas för inloggade (localStorage + chat_history), inte för gäster.
		const persist = chatWindow.slice(
			chatWindow.indexOf('async function persistHistory('),
			chatWindow.indexOf('async function clearHistory()')
		);
		const guestReturn = persist.indexOf('if (!userId) return;');
		expect(guestReturn).toBeGreaterThan(0);
		const localWrite = persist.indexOf('writeLocalHistory(normalized, userId)');
		const upsert = persist.indexOf(".from('chat_history').upsert(");
		expect(localWrite).toBeGreaterThan(guestReturn);
		expect(upsert).toBeGreaterThan(guestReturn);
		expect(chatWindow).toMatch(/void persistHistory\(messages, persistenceUserId\)/);
		expect(chatWindow).toContain('Rensa historik');

		// Synken till kontot är ett försök: den lokala kopian skrivs före upsert,
		// och ett fel fångas och lämnar den lokala kopian kvar (skrivs igen).
		expect(localWrite).toBeLessThan(upsert);
		const syncFailure = persist.slice(persist.indexOf('} catch (error) {', upsert));
		expect(syncFailure).toMatch(/^\} catch \(error\) \{[\s\S]*?writeLocalHistory\(normalized, userId\);/);
		expect(syncFailure).not.toMatch(/removeStorageValue|writeLocalHistory\(\[\]/);

		// Rensa historik tar bort den lokala kopian och försöker radera i kontot;
		// ett fel vid raderingen loggas men stoppar inte rensningen.
		const clear = chatWindow.slice(
			chatWindow.indexOf('async function clearHistory()'),
			chatWindow.indexOf('async function clearHistory()') + 1200
		);
		expect(clear).toContain('writeLocalHistory([], persistenceUserId);');
		expect(clear).toContain("await deletePersistedChatHistory(persistenceUserId, 'clear-history');");
		const remove = chatWindow.slice(
			chatWindow.indexOf('async function deletePersistedChatHistory('),
			chatWindow.indexOf('async function loadPersistedHistory(')
		);
		expect(remove).toContain(".from('chat_history')");
		expect(remove).toMatch(/if \(error\) \{\s*logChatCleanupError/);

		// Sidan beskriver båda flödena och upprepar inte det felaktiga påståendet.
		expect(page).not.toContain('sparas inte i samtalshistoriken, inte heller om du är inloggad');
		expect(page).toContain('Servern sparar inte meddelandet eller säkerhetssvaret');
		expect(page).toContain('Är du inloggad sparas chatthistoriken i din webbläsare.');
		expect(page).toMatch(/Chattfönstret försöker även synka historiken till ditt\s+konto\./);
		expect(page).toMatch(/Om synkningen misslyckas finns den\s+lokala kopian kvar/);
		expect(page).toMatch(/ta bort den lokala kopian och försöka radera den från kontot/);
		expect(page).toMatch(/Som\s+gäst sparas chatten inte i någon beständig historik/);

		// Varken den ursprungliga eller den första rättade formuleringen får komma
		// tillbaka: båda påstod något om kontot som inte alltid stämmer.
		const flat = page.replace(/\s+/g, ' ');
		expect(flat).not.toContain('sparas inte i samtalshistoriken, inte heller om du är inloggad');
		expect(flat).not.toContain('sparar i din webbläsare och i ditt konto');
	});

	it('beskriver att krismeddelandet kan följa med som sammanhang till AI:n senare', () => {
		// Själva träffen gör inget AI-anrop, men listan i chattfönstret skickas
		// som kontext med nästa meddelande och används av servern i AI-anropet.
		expect(CHAT_CONTEXT_LIMIT).toBe(10);
		expect(chatWindow).toContain('const contextMessages = sanitizeChatMessages(messages, CHAT_CONTEXT_LIMIT);');
		expect(chatWindow).toMatch(/body: JSON\.stringify\(\{[\s\S]*?contextMessages[\s\S]*?\}\)/);
		expect(chatServer).toContain('getChatContextMessages(body.contextMessages, CHAT_CONTEXT_LIMIT)');
		expect(chatServer).toMatch(/const modelContext = contextMessages\.map/);

		expect(page).not.toContain('<li>Meddelandet skickas inte till AI-modellen.</li>');
		expect(page).toContain('Meddelandet skickas inte till AI-modellen för att skapa ett svar.');
		expect(page).toMatch(/upp till tio av de senaste meddelandena som sammanhang/);
		expect(page).toMatch(/krismeddelandet och säkerhetssvaret följa med till AI-modellen/);
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
