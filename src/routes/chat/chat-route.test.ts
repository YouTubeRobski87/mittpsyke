import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveChatCategory, resolveChatSlug } from '$lib/data/chat-slugs';
import { getChatTopic, sanitizeChatMessages } from '$lib/state/chat-memory';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const entry = read('./+page.svelte');
const categoryRoute = read('./[category]/+page.svelte');
const chatPage = read('../../lib/components/ChatPage.svelte');
const chatWindow = read('../../lib/components/ChatWindow.svelte');
const consentGate = read('../../lib/components/ConsentGate.svelte');
const layout = read('../+layout.svelte');

describe('direkt ingång till den befintliga chatten', () => {
	it('renderar samma chattsida direkt på /chat och kategorirutterna', () => {
		for (const route of [entry, categoryRoute]) {
			expect(route).toContain("import ChatPage from '$lib/components/ChatPage.svelte'");
			expect(route).toContain('<ChatPage />');
			expect(route).not.toMatch(/goto\(|redirect\(|<form|<textarea|planChatStart/);
		}
		expect(chatPage.match(/<ChatWindow\b/g)).toHaveLength(1);
	});

	it('tar bort hela startsteget, även introduktionskortet före chatten', () => {
		for (const source of [entry, categoryRoute, chatPage, chatWindow]) {
			expect(source).not.toMatch(/Vad vill du prata om idag|Börja samtalet|Så går det till|chat-starter/);
		}
	});

	it('öppnar neutralt utan förhandsinmatning eller syntetiska meddelanden', () => {
		expect(chatPage).toContain("page.params.category ?? 'samtal'");
		expect(getChatTopic(resolveChatCategory('samtal'))).toBe('allmant');
		expect(chatPage).toContain('$state<ChatMessage[]>([])');
		expect(chatPage).not.toMatch(/planChatStart|hero_quick_start|\.send\(|\.push\(/);
		expect(sanitizeChatMessages([])).toEqual([]);
		expect(sanitizeChatMessages([{ role: 'user', content: '  ' }])).toEqual([]);
	});

	it('låter huvudnavigationen och produktlänkar öppna /chat med chattlayout', () => {
		expect(layout.match(/\{ href: '\/chat', label: 'Chatta' \}/g)).toHaveLength(2);
		expect(layout).toContain("page.url.pathname === '/chat' || page.url.pathname.startsWith('/chat/')");
		for (const path of ['../../lib/components/home/SignedInHome.svelte', '../dashboard/+page.svelte', '../ai-samtalsstod-online/+page.svelte']) {
			expect(read(path)).toContain('href="/chat"');
		}
	});

	it('bevarar historikval och kontrollerar ägare innan explicit historik läses', () => {
		expect(chatWindow).toContain('<RecentConversations />');
		expect(chatPage).toContain("page.url.searchParams.get('id')");
		expect(chatPage).toContain(".eq('user_id', session.user.id)");
		expect(chatPage.indexOf("if (!conversation) return")).toBeLessThan(chatPage.indexOf(".from('messages')"));
		expect(chatPage).toContain('initialMessages={initialMessages}');
		expect(chatPage).toContain('initialConversationId={initialConversationId}');
	});

	it('behåller samtyckesgrinden och mikrofonens autosändning', () => {
		expect(chatWindow).toContain('<ConsentGate');
		expect(chatWindow).toContain("payload.status === 'granted'");
		expect(chatWindow).toContain('<VoiceInput');
		expect(chatWindow).toContain('autoSend={autoSendVoice}');
		expect(chatWindow).toContain('if (!hasSensitiveDataConsent)');
	});

	it('har exakt ett samtyckesbeslut, och det är det serververifierade', () => {
		// Helskärmsrutan framför chatten är borta. Kvar finns ConsentGate inne i
		// ChatWindow, och den enda vägen till hasSensitiveDataConsent = true går
		// via ett OK-svar från servern.
		expect(chatPage).not.toContain('HealthConsent');
		expect(chatPage).not.toContain('hasConsent');
		expect(chatWindow.match(/<ConsentGate\b/g)).toHaveLength(1);

		for (const match of chatWindow.matchAll(/hasSensitiveDataConsent = (.+);/g)) {
			expect(['$state(false)', 'false', 'response.ok', "payload.status === 'granted'"]).toContain(
				match[1]
			);
		}
	});

	it('kräver fortfarande en aktiv kryssruta innan samtycket kan lämnas', () => {
		expect(chatWindow).toContain('requireExplicitConfirmation');
		expect(chatWindow).toContain('Jag samtycker uttryckligen till att MittPsyke och OpenAI behandlar');
		expect(consentGate).toContain('bind:checked={confirmed}');
		expect(consentGate).toContain('disabled={submitting || !canAccept}');
		// Utan flaggan beter sig grinden som förut för de andra ytorna.
		expect(consentGate).toContain('requireExplicitConfirmation = false');
		expect(consentGate).toContain('if (submitting || !canAccept) return;');
	});

	it('ger samtyckesrutan plats på små skärmar och håller handlingen synlig', () => {
		// Utan detta hamnade kryssrutan och knappen under vecket i den inre
		// skrollrutan på 320px, eftersom rutan blev högre när den tog över
		// innehållet från helskärmsrutan.
		expect(chatWindow).toContain('class:chat-input-area--consent={!hasSensitiveDataConsent}');
		expect(chatWindow).toContain('.chat-input-area--consent {');
		expect(consentGate).toContain('.consent-actions {');
		expect(consentGate).toContain('position: sticky;');
		// Kryssruta och knapp måste ligga i samma fastklistrade block.
		const actions = consentGate.slice(
			consentGate.indexOf('<div class="consent-actions">'),
			consentGate.indexOf('<style>')
		);
		expect(actions).toContain('type="checkbox"');
		expect(actions).toContain('<button');
	});

	it('skriver den lokala samtyckesposten för både gäst och inloggad, men bara efter serverns ja', () => {
		const accept = chatWindow.slice(
			chatWindow.indexOf('async function acceptSensitiveConsent()'),
			chatWindow.indexOf('function requireConsentAgain()')
		);

		expect(accept.match(/grantSensitiveConsent\(\)/g)).toHaveLength(2);
		expect(accept).toContain('if (response.ok) grantSensitiveConsent();');
		// grantSensitiveConsent får aldrig ligga före fetch-anropet i någon gren.
		expect(accept.indexOf('grantSensitiveConsent()')).toBeGreaterThan(accept.indexOf('fetch('));
	});

	it('låter portalkortens CTA gå direkt till beskrivande chattrutter', () => {
		for (const path of ['../../lib/components/PortalCard.svelte', '../portal/[slug]/+page.svelte']) {
			expect(read(path)).toContain('href="/chat/{resolveChatSlug(portal.key)}"');
		}
		expect(resolveChatSlug('a')).toBe('angest');
	});
});
