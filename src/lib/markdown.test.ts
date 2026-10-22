import { describe, expect, it, vi } from 'vitest';
import { hostileDiaryMarkdown, ordinaryDiaryMarkdown } from '../../tests/runtime/diary-markdown-cases';

vi.mock('$app/environment', () => ({ browser: false }));
import { renderDiaryMarkdown } from './markdown';

describe('production diary markdown during SSR (escaped text, not DOMPurify)', () => {
	it('preserves Swedish text, emoji, markdown text and line breaks without active HTML', () => {
		const html = renderDiaryMarkdown(ordinaryDiaryMarkdown);
		expect(html).toContain('Återhämtning äöå 🌿<br>En ny rad<br><br>**Vila** och *lugn*');
		expect(html).toContain('- Promenad<br>- Sömn');
	});
	it.each(hostileDiaryMarkdown)('escapes hostile input %s', (input) => {
		const html = renderDiaryMarkdown(input);
		// Only the fallback's own <br> elements may be markup on the server.
		expect(html.replaceAll('<br>', '')).not.toMatch(/[<>]/);
	});
	it('does not decode already escaped markup a second time', () => {
		expect(renderDiaryMarkdown('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;');
	});
	it('accepts empty and absent content', () => {
		for (const input of ['', '  ', null, undefined]) expect(renderDiaryMarkdown(input)).toBe('');
	});
});
