import { describe, expect, it } from 'vitest';
import { canonicalRequestUrl } from '$lib/seo';
import { buildBlogIndexSeo } from './blog-index-seo';

describe('buildBlogIndexSeo', () => {
	it('låter första sidan peka på /blogg', () => {
		const seo = buildBlogIndexSeo(1, 10);

		expect(seo.canonicalPath).toBe('/blogg');
		expect(seo.title).toBe('Artiklar om psykiskt mående | MittPsyke');
		expect(seo.description).not.toMatch(/Sida \d/);
	});

	it('ger senare sidor egen canonical, titel och beskrivning', () => {
		const seo = buildBlogIndexSeo(9, 10);

		expect(canonicalRequestUrl(seo.canonicalPath)).toBe('https://mittpsyke.se/blogg?page=9');
		expect(seo.title).toBe('Artiklar om psykiskt mående – sida 9 | MittPsyke');
		expect(seo.description).toMatch(/Sida 9 av 10\.$/);
	});

	it('ger varje sida en unik titel och canonical', () => {
		const pages = Array.from({ length: 10 }, (_, index) => buildBlogIndexSeo(index + 1, 10));

		expect(new Set(pages.map((page) => page.title)).size).toBe(10);
		expect(new Set(pages.map((page) => page.canonicalPath)).size).toBe(10);
	});
});
