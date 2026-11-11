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
		relatedReading: [{ title: 'Orostankar som snurrar', url: '/guider/angest/orostankar' }],
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

	it('visar Läs vidare efter texten och före nästa steg', () => {
		const tail = afterArticle();
		const related = tail.indexOf('id="related-reading-heading"');
		expect(related, 'Läs vidare saknas').toBeGreaterThan(-1);
		expect(tail).toContain('href="/guider/angest/orostankar"');
		expect(related).toBeLessThan(tail.indexOf('aria-label="Nästa steg"'));
	});

	it('visar ingen tom Läs vidare när artikeln saknar länkar', () => {
		const { body } = render(Page, { props: { data: { ...data, relatedReading: [] } } as never });
		expect(body).not.toContain('related-reading-heading');
	});

	it('visar en kort ämnesrad en bit in i en lång artikel', () => {
		const long = [1, 2, 3, 4, 5, 6].map((n) => `<h2>Avsnitt ${n}</h2><p>Text ${n}.</p>`).join('');
		const { body } = render(Page, {
			props: { data: { ...data, article: { ...data.article, slug: 'overtanker-allt', content: long } } } as never
		});
		const early = body.indexOf('aria-label="Ett litet nästa steg"');
		expect(early, 'raden saknas').toBeGreaterThan(-1);
		expect(early).toBeGreaterThan(body.indexOf('Avsnitt 2'));
		expect(early).toBeLessThan(body.indexOf('Avsnitt 3'));
		expect(body).toContain('href="/ovningar/tankefallor-kartlaggning"');
		expect(body).toContain('Nästa steg vid övertänkande');
	});

	it('visar ingen ämnesrad i en kort artikel', () => {
		const { body } = render(Page, { props: { data } as never });
		expect(body).not.toContain('Ett litet nästa steg');
	});

	it('lämnar akutsidan utan ämnesrad och med den generella rutan', () => {
		const long = [1, 2, 3, 4, 5, 6].map((n) => `<h2>Avsnitt ${n}</h2><p>Text ${n}.</p>`).join('');
		const { body } = render(Page, {
			props: { data: { ...data, article: { ...data.article, slug: 'vid-akut-kris-ring-nu', content: long } } } as never
		});
		expect(body).not.toContain('Ett litet nästa steg');
		expect(body).toContain('Nästa steg i lugn takt');
		expect(body).toContain('href="tel:112"');
	});

	it('visar akutraden efter artikeln', () => {
		const tail = afterArticle();
		expect(tail).toContain('href="tel:112"');
		expect(tail).toContain('href="https://www.1177.se"');
	});
});
