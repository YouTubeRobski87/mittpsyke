import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('https://mittpsyke.se/blogg/amne/oro-och-stress/testartikel') }
}));

describe('/blogg/amne/[collection]/[slug] structured data', () => {
	it('renders BlogPosting and FAQPage as separate valid JSON-LD scripts', () => {
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
				content: '<p id="after-json-ld">Synligt innehåll</p>',
				faqs: [{ question: 'En fråga?', answer: 'Ett svar.' }],
				references: [],
				relatedArticles: []
			},
			topic: { slug: 'oro-och-stress', label: 'Oro och stress' },
			jsonLd: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'Testartikel' }
		};
		const { head, body } = render(Page, { props: { data } as never });
		const scripts = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

		const types = scripts.map((match) => JSON.parse(match[1])['@type']);

		expect(scripts).toHaveLength(3);
		expect(types).toContain('BlogPosting');
		expect(types).toContain('FAQPage');
		expect(head).not.toContain('<\\/script>');
		expect(body).toContain('id="after-json-ld"');
		expect(scripts.every((match) => !match[1].includes('after-json-ld'))).toBe(true);
	});
});
