import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Allt i app.html skickas med i varje sidas HTML. Utvecklaranteckningar hör
// hemma i docs/app-html.md, inte i källkoden som besökare kan se.
const appHtml = readFileSync(join(process.cwd(), 'src/app.html'), 'utf8');

describe('app.html', () => {
	it('har inga HTML-kommentarer', () => {
		expect(appHtml.includes('<!--')).toBe(false);
	});

	it('har inga radkommentarer i inbäddade skript', () => {
		const scripts = [...appHtml.matchAll(/<script(?![^>]*type="text\/plain")[^>]*>([\s\S]*?)<\/script>/g)].map(
			([, body]) => body
		);
		expect(scripts.length).toBeGreaterThan(0);
		for (const body of scripts) {
			expect(/^\s*\/\//m.test(body)).toBe(false);
		}
	});

	it('har förklaringarna kvar i dokumentationen', () => {
		const doc = readFileSync(join(process.cwd(), 'docs/app-html.md'), 'utf8');
		expect(doc).toContain('interactive-widget=resizes-content');
		expect(doc).toContain('Similarweb');
	});
});
