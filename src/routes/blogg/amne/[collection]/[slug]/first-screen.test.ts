import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('https://mittpsyke.se/blogg/amne/oro-och-stress/testartikel') }
}));

// På mobil tog brödsmulor, en separat tillbaka-länk och cookierutan hela
// första skärmen, så ingressen syntes inte. Brödsmulorna räcker som väg
// tillbaka till ämnet.
describe('/blogg/amne/[collection]/[slug] överst på sidan', () => {
	const data = {
		article: {
			slug: 'testartikel',
			collection: 'oro-och-stress',
			url: '/blogg/amne/oro-och-stress/testartikel',
			title: 'Testartikel om oro',
			description: 'En beskrivning.',
			image: null,
			imageAlt: null,
			dateLabel: '1 september 2026',
			updatedLabel: null,
			readingTime: null,
			type: 'article',
			content: '<p>Text.</p>',
			faqs: [],
			references: [],
			relatedArticles: []
		},
		topic: { slug: 'oro-och-stress', label: 'Oro och stress' },
		jsonLd: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'Testartikel om oro' }
	};

	function head(): { body: string; head: string } {
		const result = render(Page, { props: { data } as never });
		return { body: result.body.slice(0, result.body.indexOf('<h1')), head: result.head };
	}

	it('har ingen separat tillbaka-länk ovanför rubriken', () => {
		expect(head().body).not.toContain('Tillbaka till');
	});

	it('länkar fortfarande tillbaka till ämnet via brödsmulorna', () => {
		const { body } = head();
		expect(body).toContain('aria-label="Brödsmulor"');
		expect(body).toContain('href="/blogg/amne/oro-och-stress"');
	});

	it('behåller hela rubriken i BreadcrumbList-JSON-LD', () => {
		const { head: htmlHead } = head();
		expect(htmlHead).toContain('"BreadcrumbList"');
		expect(htmlHead).toContain('"name":"Testartikel om oro"');
	});
});
