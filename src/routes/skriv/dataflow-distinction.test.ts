import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('skillnaden mellan lokalt skrivande och AI-chatt', () => {
	it('/skriv namnger och förklarar de två flödena var för sig', () => {
		const source = projectFile('./+page.svelte');

		expect(source).toContain('Skriv lokalt utan konto');
		expect(source).toContain('Chatta med AI utan konto');
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
});
