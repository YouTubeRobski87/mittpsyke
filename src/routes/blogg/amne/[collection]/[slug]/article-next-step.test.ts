import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('https://mittpsyke.se/blogg/amne/oro-och-stress/testartikel') }
}));

// Samma väg vidare som Soro-artiklarna, efter läs vidare-länkarna.
describe('/blogg/amne/[collection]/[slug] efter artikeltexten', () => {
	const data = {
		article: {
			url: '/blogg/amne/oro-och-stress/testartikel',
			title: 'Testartikel',
			description: 'En beskrivning.',
			image: null,
			imageAlt: null,
			dateLabel: '1 september 2026',
			updatedLabel: null,
			readingTime: null,
			type: 'article',
			content: '<p id="article-end">Sista stycket.</p>',
			faqs: [],
			references: [],
			relatedArticles: [{ url: '/blogg/amne/oro-och-stress/annan', title: 'En annan artikel' }]
		},
		topic: { slug: 'oro-och-stress', label: 'Oro och stress' },
		jsonLd: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'Testartikel' }
	};

	it('erbjuder nästa steg och akutraden efter läs vidare-länkarna', () => {
		const { body } = render(Page, { props: { data } as never });
		const related = body.indexOf('id="related-heading"');
		const nextStep = body.indexOf('aria-label="Nästa steg"');

		expect(body.indexOf('id="article-end"')).toBeGreaterThan(-1);
		expect(related).toBeGreaterThan(-1);
		expect(nextStep).toBeGreaterThan(related);

		const tail = body.slice(nextStep);
		for (const href of ['/chat', '/dagbok', '/ovningar', 'https://stodlinjer.se', 'tel:112', 'https://www.1177.se']) {
			expect(tail).toContain(`href="${href}"`);
		}
	});

	it('visar nästa steg även utan läs vidare-länkar', () => {
		const { body } = render(Page, {
			props: { data: { ...data, article: { ...data.article, relatedArticles: [] } } } as never
		});
		expect(body).toContain('aria-label="Nästa steg"');
	});
});
