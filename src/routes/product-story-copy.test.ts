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
		expect(aboutPage).toContain('skriva, spara det man vill och se vad som återkommer över tid');
		expect(aboutPage).toContain('Mitt Hem');
		expect(aboutPage).toContain('Kvällsstugan');
		expect(aboutPage).toContain('Följeslagaren');
		expect(aboutPage).not.toContain('I centrum finns ett AI-baserat samtalsstöd');
	});

	it('gör inte ett val mellan äldre samtalsspår obligatoriskt', () => {
		expect(chatPage).toContain("page.params.category ?? 'samtal'");
		expect(normalizeCategory(undefined)).toBe(NEUTRAL_CATEGORY);
		expect(aboutPage).toContain('öppna AI-chatten utan att välja tema');
		expect(aboutPage).not.toContain('Ångest, Depression eller Trauma');
	});

	it('skiljer lokalt skrivande från AI-chatt utan konto', () => {
		expect(howPage).toContain('dataflowCopy.anonymousDiary.short');
		expect(howPage).toContain('dataflowCopy.guestChat.aiTransfer');
		expect(howPage).toContain('dataflowCopy.guestChat.retention');
		expect(howPage).not.toContain('Anonymt läge och konto');
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
