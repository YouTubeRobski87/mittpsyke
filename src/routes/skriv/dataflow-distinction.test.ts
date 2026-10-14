import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('skillnaden mellan lokalt skrivande och AI-chatt', () => {
	it('/skriv visar den lokala skrivytan direkt och förklarar AI-alternativet separat', () => {
		const source = projectFile('./+page.svelte');

		expect(source).toContain('<GuestQuickEntry />');
		expect(source).toContain('<h1>Börja skriva direkt</h1>');
		expect(source).toContain('Öppna AI-chatten');
		expect(source).toContain('dataflowCopy.anonymousDiary.short');
		expect(source).toContain('dataflowCopy.guestChat.aiTransfer');
		expect(source).not.toContain('Skriv av dig anonymt</h1>');
	});

	it('guiden kopplar inte AI-reflektion till lokalt skrivande utan konto', () => {
		const source = projectFile('../guider/dagbok-och-reflektion/+page.svelte');

		expect(source).toContain('dataflowCopy.anonymousDiary.short');
		expect(source).toContain('dataflowCopy.guestChat.aiTransfer');
		expect(source).toContain('aktivt välja');
		expect(source).toContain('separat samtycke');
		expect(source).not.toContain(
			'Skriv anonymt direkt utan konto och få AI-reflektion på det du skriver.'
		);
	});

	it('blandytan för AI-stöd och dagbok förklarar båda dataflödena', () => {
		const pageSource = projectFile('../ai-samtalsstod-online/+page.svelte');
		const metadataSource = projectFile('../ai-samtalsstod-online/+page.js');

		expect(pageSource).toContain('AI-samtalsstöd online och lokal dagbok');
		expect(pageSource).toContain('dataflowCopy.anonymousDiary.short');
		expect(pageSource).toContain('dataflowCopy.guestChat.aiTransfer');
		expect(metadataSource).toContain('Lokal text stannar i webbläsaren');
		expect(metadataSource).not.toContain('helt anonymt');
	});
});
