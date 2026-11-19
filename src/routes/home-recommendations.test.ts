import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

// Samarbeten och rekommendationer på den publika startsidan. Testerna läser
// den renderade sidan, så det är länkarna besökaren faktiskt får.
const body = render(Page, {
	props: { data: { isSignedInHome: false } as never }
}).body.replace(/\s?svelte-[a-z0-9]+/g, '');

const start = body.indexOf('aria-labelledby="recommendations-title"');
const section = body.slice(start, body.indexOf('</section>', start));
const externalLinks = [...section.matchAll(/<a\b[^>]*href="(https?:[^"]+)"[^>]*>/g)];

describe('Fler platser att upptäcka', () => {
	it('har överrubrik, rubrik och ingress', () => {
		expect(section).toContain('Samarbeten &amp; rekommendationer');
		expect(section).toContain('Fler platser att upptäcka');
		expect(section).toContain('Webbplatser och initiativ som vi gärna vill lyfta fram.');
	});

	it('länkar bara till de tre verifierade domänerna, utan spårningsparametrar', () => {
		expect(externalLinks.map(([, href]) => href)).toEqual([
			'https://www.stodlinjer.se/',
			'https://oftabraefter.se/',
			'https://www.systrarnahalldin.com/'
		]);
	});

	it('märker externa länkar och öppnar dem säkert i ny flik', () => {
		for (const [tag] of externalLinks) {
			expect(tag).toContain('target="_blank"');
			expect(tag).toContain('rel="noopener noreferrer"');
		}
		expect(section.match(/\(extern webbplats, öppnas i ny flik\)/g)).toHaveLength(3);
	});

	it('visar Stödlinjer.se först som extern stödresurs och öppet om avsändaren', () => {
		expect(section.indexOf('Stödlinjer.se')).toBeLessThan(section.indexOf('Ofta bra efter'));
		expect(section).toContain('Extern stödresurs');
		expect(section).toContain('drivs av samma avsändare som MittPsyke');
		expect(section).toContain('varken vård eller akutjour');
	});

	it('märker relationerna som de faktiskt ser ut', () => {
		const ofta = section.slice(section.indexOf('Ofta bra efter') - 400, section.indexOf('Ofta bra efter'));
		expect(ofta).toContain('Samarbete');
		expect(section).toContain('Rekommenderad webbplats');
		expect(section).not.toMatch(/sponsr|annons/i);
	});

	it('upprepas inte i sidfoten', () => {
		const layout = readFileSync(new URL('./+layout.svelte', import.meta.url), 'utf8');
		const footer = layout.slice(layout.indexOf('<footer class="site-footer'), layout.indexOf('</footer>'));
		expect(footer).not.toContain('oftabraefter');
		expect(footer).not.toContain('systrarnahalldin');
	});
});
