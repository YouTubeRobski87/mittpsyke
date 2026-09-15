import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// "Om skaparen" ska bygga förtroende för personen bakom MittPsyke: kort,
// i första person och utan tekniska eller interna noteringar. MittPsyke är
// fortfarande huvudvarumärket.

const source = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const markup = source.slice(source.indexOf('<main'), source.indexOf('</main>'));
const visible = markup
	.replace(/<!--[\s\S]*?-->/g, '')
	.replace(/<[^>]+>/g, ' ')
	.replace(/\s+/g, ' ');

describe('Om skaparen', () => {
	it('har inga interna, tekniska eller utvecklarnoteringar', () => {
		expect(source).not.toMatch(/SvelteKit|Supabase|Vercel|Render|Node-adapter|repo|driftsmiljö|github/i);
		expect(source).not.toMatch(/knowsAbout|techItems|processItems|Utvecklingsprocess|Teknik bakom/);
		expect(visible).not.toMatch(/investerar|aktiv utveckling|UX\b/i);
	});

	it('berättar i första person vem som står bakom, varför och vad ambitionen är', () => {
		expect(visible).toContain('Jag heter Robert Claesson, men de flesta säger Robban.');
		for (const heading of ['Varför jag skapade MittPsyke', 'Vad jag vill med MittPsyke', 'Det jag inte är']) {
			expect(markup).toContain(`>${heading}</h2>`);
		}
	});

	it('säger tydligt att skaparen inte är vårdpersonal och att guiderna inte är granskade', () => {
		expect(visible).toContain('Jag är inte psykolog eller annan vårdpersonal.');
		expect(visible).toContain('inte medicinskt granskade');
		expect(visible).not.toMatch(/legitimerad (psykolog|läkare)|expert på|kliniskt beprövad/i);
	});

	it('länkar vidare till Om MittPsyke, redaktionell metod och integritet', () => {
		for (const href of ['/om-mittpsyke', '/redaktionell-metod', '/integritet']) {
			expect(markup).toContain(`href="${href}"`);
		}
	});

	it('använder sajtens gemensamma kontaktadress', () => {
		expect(source).toContain("import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';");
		expect(source).not.toContain("'support@mittpsyke.se'");
	});
});
