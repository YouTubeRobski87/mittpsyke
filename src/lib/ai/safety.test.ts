import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveChatSupportLevel } from './safety';

const chatWindow = readFileSync(new URL('../components/ChatWindow.svelte', import.meta.url), 'utf8');

describe('resolveChatSupportLevel', () => {
	it('ger standard när inget sagts', () => {
		expect(resolveChatSupportLevel('')).toBe('standard');
		expect(resolveChatSupportLevel('Hej, jag ville bara skriva av mig')).toBe('standard');
	});

	it('låter urlyfta fraser höja panelen i stället för att bryta samtalet', () => {
		expect(resolveChatSupportLevel('Jag orkar inte mer med plugget just nu')).toBe('elevated');
		expect(resolveChatSupportLevel('Det känns som att ingen bryr sig om mig på jobbet')).toBe(
			'elevated'
		);
	});

	it('behåller ChatWindows tidigare närvarosignaler', () => {
		expect(resolveChatSupportLevel('Jag känner mig ensam')).toBe('elevated');
		expect(resolveChatSupportLevel('Allt är för mycket just nu')).toBe('elevated');
		expect(resolveChatSupportLevel('Jag vill prata med någon')).toBe('elevated');
		expect(resolveChatSupportLevel('Texten räcker inte')).toBe('elevated');
	});

	it('låter akut vinna över förhöjd', () => {
		expect(resolveChatSupportLevel('Jag orkar inte leva')).toBe('acute');
		expect(resolveChatSupportLevel('Jag vet inte om jag orkar längre')).toBe('acute');
	});

	it('håller tredjepartsrisk separat', () => {
		expect(resolveChatSupportLevel('Jag är rädd att jag ska skada någon annan')).toBe(
			'acute-third-party'
		);
	});

	it('visar inte stödpanel för vardagliga dämpningsfraser', () => {
		expect(resolveChatSupportLevel('Läkaren sa att jag ska ta tabletter mot huvudvärken')).toBe(
			'standard'
		);
		expect(resolveChatSupportLevel('Jag funderar på att hoppa av utbildningen')).toBe('standard');
	});

	it('träffar inte vill do inuti vill dölja', () => {
		expect(resolveChatSupportLevel('Jag vill dölja hur jag mår för mina vänner')).toBe('standard');
	});
});

describe('ChatWindow använder den gemensamma källan', () => {
	it('äger inte en egen ordlista', () => {
		expect(chatWindow).toContain("import { resolveChatSupportLevel } from '$lib/ai/safety'");
		expect(chatWindow).toContain('resolveChatSupportLevel(latestUserMessageContent())');
		expect(chatWindow).not.toContain('elevatedSupportKeywords');
		expect(chatWindow).not.toContain('.includes(keyword)');
	});
});
