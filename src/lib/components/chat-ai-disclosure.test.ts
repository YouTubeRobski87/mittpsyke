import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ChatWindow from './ChatWindow.svelte';

// Chatten ska aldrig kunna misstas för en människa. Vyn säger det rakt ut,
// varje svar är märkt som AI-stöd, och den gamla etiketten "Mitt stöd" får
// inte komma tillbaka någonstans där användaren ser den.

function text(html: string) {
	return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function renderChat() {
	return render(ChatWindow, {
		props: { category: 'samtal', initialMessages: [], initialConversationId: null }
	}).body;
}

describe('AI-märkningen i chatten', () => {
	it('säger i chattens huvud att det är en AI, även innan något skrivits', () => {
		const body = renderChat();
		expect(body).toMatch(/data-testid="chat-ai-notice"/);
		expect(text(body)).toContain('Du chattar med en AI, inte en människa.');
	});

	it('förklarar kort vad AI-stödet kan och inte kan i tomt läge', () => {
		const visible = text(renderChat());
		expect(visible).toContain('AI-stödet kan hjälpa dig att resonera och sätta ord på det du tänker.');
		expect(visible).toContain('Det ersätter inte vård eller en människa att prata med.');
		expect(visible).not.toContain('så börjar vi prata');
	});

	it('märker varje AI-svar som AI-stöd men inte användarens egna meddelanden', () => {
		// Meddelandena läses in först i webbläsaren, så etiketten kontrolleras i
		// mallen: den ligger i blocket som bara renderas för AI-svar, direkt före
		// bubblan, inuti loopen över alla meddelanden.
		const source = readFileSync(join(process.cwd(), 'src/lib/components/ChatWindow.svelte'), 'utf8');
		const loop = source.slice(source.indexOf('{#each messages as msg, i}'), source.indexOf('{/each}', source.indexOf('{#each messages as msg, i}')));
		expect(loop).toMatch(/\{#if msg\.role === 'assistant'\}\s*<div class="assistant-label[^"]*">✦ AI-stöd<\/div>\s*\{\/if\}/);
		expect(loop.indexOf('✦ AI-stöd')).toBeLessThan(loop.indexOf('message-bubble'));
		expect((loop.match(/AI-stöd/g) ?? []).length).toBe(1);
	});
});

describe('den gamla etiketten är borta', () => {
	function sourceFiles(dir: string): string[] {
		const files: string[] = [];
		for (const name of readdirSync(join(process.cwd(), dir))) {
			const path = `${dir}/${name}`;
			if (statSync(join(process.cwd(), path)).isDirectory()) files.push(...sourceFiles(path));
			else if (/\.(svelte|ts)$/.test(name) && !name.endsWith('.test.ts')) files.push(path);
		}
		return files;
	}

	it('finns inte kvar i någon användarsynlig källfil', () => {
		for (const file of sourceFiles('src')) {
			expect(readFileSync(join(process.cwd(), file), 'utf8'), file).not.toMatch(/Mitts? stöd/);
		}
	});

	it('låter inte laddningsraden låta som en människa som tänker', () => {
		const source = readFileSync(join(process.cwd(), 'src/lib/components/ChatWindow.svelte'), 'utf8');
		expect(source).toContain('AI-stödet formulerar ett svar…');
		expect(source).not.toContain('tar en stund och formulerar');
	});
});

describe('samtyckesgrinden', () => {
	const source = readFileSync(join(process.cwd(), 'src/lib/components/ChatWindow.svelte'), 'utf8').replace(/\s+/g, ' ');

	it('säger AI i rubriken och nämner OpenAI och AI-minnet i samtycket', () => {
		expect(source).toContain('title="Innan du chattar med AI"');
		expect(source).toContain('serviceLabel="MittPsyke och OpenAI för att skapa ett svar"');
		expect(source).toContain('att MittPsyke och OpenAI behandlar meddelanden jag väljer att skicka i chatten');
		expect(source).toContain('att chatten sparar ett kort AI-minne när jag är inloggad');
		expect(source).toContain('memoryHref="/integritet#ai-minne"');
		expect(source).toContain('showEmergencyGuidance');
	});
});
