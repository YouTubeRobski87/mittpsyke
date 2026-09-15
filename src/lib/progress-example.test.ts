import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ProgressExamplePreview from '$lib/components/progress/ProgressExamplePreview.svelte';
import HomePage from '../routes/+page.svelte';
import { MIN_THEME_COUNT, MIN_THEME_WEEKS } from '$lib/server/progress-analysis';
import { findForbiddenProgressPhrase } from '$lib/progress-language';
import {
	EXAMPLE_PREVIEW_HEADING,
	LIGHTER_DAYS_EXAMPLE,
	RECURRING_THEME_EXAMPLE,
	RECURRING_THEME_EXAMPLE_COUNT,
	RECURRING_THEME_EXAMPLE_OBSERVATION
} from '$lib/progress-example';

// Exemplet "Så här kan det se ut efter en månad" gör kärnlöftet - se vad som
// återkommer - synligt för den som inte har konto. Det måste vara omisskännligt
// påhittat, observerande och aldrig lova mer än den riktiga analysen gör.

const REAL_DATE = /20\d\d-\d\d-\d\d|\b\d{1,2} (januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\b/i;

function text(html: string) {
	return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const home = render(ProgressExamplePreview, { props: { headingLevel: 3, context: 'home' } }).body;
const progress = render(ProgressExamplePreview, { props: {} }).body;

describe('exemplet är omisskännligt ett exempel', () => {
	for (const [name, body] of [['startsidan', home], ['Framsteg', progress]] as const) {
		it(`märks som påhittat på ${name}`, () => {
			const visible = text(body);
			expect(visible).toContain(EXAMPLE_PREVIEW_HEADING);
			expect(visible).toContain('Exempel');
			expect(visible).toContain('Påhittat exempel.');
			expect(visible).toContain('inte dina och kommer inte från någon riktig person');
			expect(visible).toContain('Exempel · Det som återkommer');
			// Varje citat är märkt och varje dag heter "Exempeldag".
			for (const quote of RECURRING_THEME_EXAMPLE.quotes) {
				expect(visible).toContain(`${quote.day} Exempeltext: ${quote.text}`);
			}
			expect(visible).not.toMatch(REAL_DATE);
		});
	}

	it('har inga suddiga eller låsta kort', () => {
		for (const body of [home, progress]) {
			expect(body).not.toMatch(/blur|account-preview-content|aria-disabled|locked/i);
		}
	});

	it('visar lättare dagar bara i Framstegs version', () => {
		expect(text(progress)).toContain('Exempel · Det som ofta fanns med under lättare dagar');
		expect(text(home)).not.toContain('lättare dagar');
	});

	it('följer sidans rubrikhierarki', () => {
		expect(home).toMatch(/<h3[^>]*id="example-preview-heading-home"[^>]*>\s*Så här kan det se ut efter en månad/);
		expect(home).toMatch(/<h4[^>]*class="example-card-title[^"]*"[^>]*>\s*Sömn/);
		expect(progress).toMatch(/<h2[^>]*id="example-preview-heading-progress"/);
	});
});

describe('exemplet visar något konkret och sant mot produkten', () => {
	it('anger tema, hur ofta och under vilken period', () => {
		expect(RECURRING_THEME_EXAMPLE_COUNT).toBe('Återkom i 6 av 14 texter under 30 dagar, spritt över 4 veckor.');
		expect(RECURRING_THEME_EXAMPLE_OBSERVATION).toBe('Nämndes 2 gånger under första halvan av månaden och 4 gånger under andra halvan.');
	});

	it('går ihop och klarar samma trösklar som den riktiga analysen', () => {
		const example = RECURRING_THEME_EXAMPLE;
		expect(example.firstHalf + example.secondHalf).toBe(example.count);
		expect(example.count).toBeLessThanOrEqual(example.total);
		expect(example.count).toBeGreaterThanOrEqual(MIN_THEME_COUNT);
		expect(example.weekCount).toBeGreaterThanOrEqual(MIN_THEME_WEEKS);
	});

	it('beskriver bara vad som återkom, fanns med eller nämndes', () => {
		expect(RECURRING_THEME_EXAMPLE_COUNT).toMatch(/^Återkom /);
		expect(RECURRING_THEME_EXAMPLE_OBSERVATION).toMatch(/^Nämndes /);
		expect(LIGHTER_DAYS_EXAMPLE.note).toContain('fanns med');
	});

	it('innehåller inga identitets-, diagnos- eller orsaksformuleringar', () => {
		for (const body of [home, progress]) {
			const visible = text(body);
			expect(findForbiddenProgressPhrase(visible), visible).toBeNull();
			expect(visible).not.toMatch(/du är|hjälper dig|må bättre|beror på/i);
		}
	});

	it('kör ingen AI och hämtar inga data', () => {
		const source = readFileSync('src/lib/components/progress/ProgressExamplePreview.svelte', 'utf8');
		expect(source).not.toMatch(/fetch\(|supabase|generateAIText|\/api\//);
	});
});

describe('placeringen på startsidan', () => {
	it('visar exemplet direkt efter steget "Se vad som återkommer."', () => {
		// Samma minimala data som home-p2-structure.test.ts: bara den publika grenen.
		const body = render(HomePage, { props: { data: { isSignedInHome: false } as never } }).body;
		const how = body.slice(body.indexOf('aria-labelledby="how-title"'), body.indexOf('aria-labelledby="map-title"'));
		const step = how.indexOf('Se vad som återkommer.');
		const example = how.indexOf(EXAMPLE_PREVIEW_HEADING);

		expect(step).toBeGreaterThan(-1);
		expect(example).toBeGreaterThan(step);
		expect(how).toContain('data-context="home"');
	});
});
