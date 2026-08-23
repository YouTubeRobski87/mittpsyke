import { describe, expect, it } from 'vitest';
import {
	canonical,
	canonicalRequestUrl,
	canonicalUrl,
	normalizeStructuredDataSiteUrls,
	PUBLIC_SITE_ORIGIN
} from './seo';

describe('canonical SEO URLs', () => {
	it('uses the apex HTTPS origin for generated paths', () => {
		expect(PUBLIC_SITE_ORIGIN).toBe('https://mittpsyke.se');
		expect(canonical('/framsteg/')).toBe('https://mittpsyke.se/framsteg');
		expect(canonical('/angest')).toBe('https://mittpsyke.se/angest');
	});

	it('normalizes www inputs to apex without retaining query strings or fragments', () => {
		expect(canonicalUrl('http://www.mittpsyke.se/guider/angest/?source=old#intro')).toBe(
			'https://mittpsyke.se/guider/angest'
		);
		expect(canonicalUrl('https://mittpsyke.se/angest')).toBe('https://mittpsyke.se/angest');
		expect(canonicalUrl('https://www.mittpsyke.se/angest')).toBe('https://mittpsyke.se/angest');
		expect(canonicalUrl('https://www.www.mittpsyke.se/angest')).toBe('https://mittpsyke.se/angest');
	});

	it('keeps request query strings when normalizing a www request URL', () => {
		expect(canonicalRequestUrl('http://www.mittpsyke.se/guider/angest/?source=old#intro')).toBe(
			'https://mittpsyke.se/guider/angest?source=old'
		);
	});

	it('normalizes www URLs in structured data without touching other hosts', () => {
		expect(
			normalizeStructuredDataSiteUrls(
				'{"url":"https://www.mittpsyke.se/angest","sameAs":"https://example.com"}'
			)
		).toBe('{"url":"https://mittpsyke.se/angest","sameAs":"https://example.com"}');
		expect(
			normalizeStructuredDataSiteUrls(
				'{"url":"https://www.www.mittpsyke.se/angest","sameAs":"https://example.com"}'
			)
		).toBe('{"url":"https://mittpsyke.se/angest","sameAs":"https://example.com"}');
	});
});
