import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveChatCategory, resolveChatSlug } from '$lib/data/chat-slugs';
import { getChatTopic, sanitizeChatMessages } from '$lib/state/chat-memory';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const entry = read('./+page.svelte');
const categoryRoute = read('./[category]/+page.svelte');
const chatPage = read('../../lib/components/ChatPage.svelte');
const chatWindow = read('../../lib/components/ChatWindow.svelte');
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

	it('behåller befintliga samtyckesgrindar och mikrofonens autosändning', () => {
		expect(chatPage).toMatch(/\{#if !hasConsent\}\s*<HealthConsent/);
		expect(chatWindow).toContain('<ConsentGate');
		expect(chatWindow).toContain("payload.status === 'granted'");
		expect(chatWindow).toContain('<VoiceInput');
		expect(chatWindow).toContain('autoSend={autoSendVoice}');
		expect(chatWindow).toContain('if (!hasSensitiveDataConsent)');
	});

	it('låter portalkortens CTA gå direkt till beskrivande chattrutter', () => {
		for (const path of ['../../lib/components/PortalCard.svelte', '../portal/[slug]/+page.svelte']) {
			expect(read(path)).toContain('href="/chat/{resolveChatSlug(portal.key)}"');
		}
		expect(resolveChatSlug('a')).toBe('angest');
	});
});
