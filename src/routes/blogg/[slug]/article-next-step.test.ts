import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('https://mittpsyke.se/blogg/testartikel') }
}));

// Artikeln slutade tidigare med texten och inget mer. Den som läst klart
// ska ha en lugn väg vidare och en akutrad, i den ordningen.
describe('/blogg/[slug] efter artikeltexten', () => {
	const data = {
		canonical: 'https://mittpsyke.se/blogg/testartikel',
		article: {
			slug: 'testartikel',
			title: 'Testartikel',
			excerpt: 'En beskrivning.',
			date: '1 september 2026',
			isoDate: '2026-09-01',
			image: null,
			content: '<p id="article-end">Sista stycket.</p>'
		}
	};

	function afterArticle(): string {
		const { body } = render(Page, { props: { data } as never });
		const end = body.indexOf('id="article-end"');
		expect(end, 'artikeltexten renderades inte').toBeGreaterThan(-1);
		return body.slice(end);
	}

	it('erbjuder chatt, dagbok, övning och stödlinjer när artikeln är slut', () => {
		const tail = afterArticle();
		expect(tail).toContain('aria-label="Nästa steg"');
		expect(tail).toContain('href="/chat"');
		expect(tail).toContain('href="/dagbok"');
		expect(tail).toContain('href="/ovningar"');
		expect(tail).toContain('href="https://stodlinjer.se"');
	});

	it('visar akutraden efter artikeln', () => {
		const tail = afterArticle();
		expect(tail).toContain('href="tel:112"');
		expect(tail).toContain('href="https://www.1177.se"');
	});
});
