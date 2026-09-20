import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ambientSource = readFileSync(new URL('./AmbientWorld.svelte', import.meta.url), 'utf8');
const progressSource = readFileSync(
	new URL('../../../routes/framsteg/+page.svelte', import.meta.url),
	'utf8'
);

describe('AmbientWorld vegetation wind', () => {
	it('ger befintliga gräslager växtsilhuetter med rotförankrad rörelse', () => {
		expect(ambientSource).toContain('.grass-left,\n\t.grass-bank');
		expect(ambientSource).toContain('.grass-left { transform-origin: 26% 100%; }');
		expect(ambientSource).toContain('.grass-bank { transform-origin: 64% 100%; }');
		expect(ambientSource).toContain('calc(-0.82px * (0.55 + var(--depth, 0.5)))');
	});

	it('har stiltje och en separat lågmäld pust i vegetationscykeln', () => {
		expect(ambientSource).toContain('0%, 18%, 46%, 58%, 100%');
		expect(ambientSource).toContain('74%, 82% { transform: rotate(calc((-1.9deg');
		expect(ambientSource).toContain('0%, 20%, 48%, 60%, 100%');
	});

	it('stänger av kontinuerlig vind vid reduced motion', () => {
		expect(ambientSource).toMatch(
			/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.world-effect \{ animation: none !important;/
		);
		expect(progressSource).toMatch(
			/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.companion-media::before,[\s\S]*?animation: none !important;/
		);
	});
});
