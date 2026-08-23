import { describe, expect, it } from 'vitest';
import {
	canonical,
	canonicalRequestUrl,
	canonicalUrl,
	normalizeStructuredDataSiteUrls,
	PUBLIC_SITE_ORIGIN
} from './seo';

describe('canonical SEO URLs', () => {
	it('uses the www HTTPS origin for generated paths', () => {
		expect(PUBLIC_SITE_ORIGIN).toBe('https://www.mittpsyke.se');
		expect(canonical('/framsteg/')).toBe('https://www.mittpsyke.se/framsteg');
		expect(canonical('/angest')).toBe('https://www.mittpsyke.se/angest');
	});

	it('normalizes legacy hosts without retaining query strings or fragments', () => {
		expect(canonicalUrl('http://www.mittpsyke.se/guider/angest/?source=old#intro')).toBe(
			'https://www.mittpsyke.se/guider/angest'
		);
		expect(canonicalUrl('https://mittpsyke.se/angest')).toBe('https://www.mittpsyke.se/angest');
		expect(canonicalUrl('https://www.mittpsyke.se/angest')).not.toContain('www.www.');
	});

	it('keeps request query strings when redirecting a legacy host', () => {
		expect(canonicalRequestUrl('http://www.mittpsyke.se/guider/angest/?source=old#intro')).toBe(
			'https://www.mittpsyke.se/guider/angest?source=old'
		);
	});

	it('normalizes legacy URLs in structured data without touching other hosts', () => {
		expect(
			normalizeStructuredDataSiteUrls(
				'{"url":"https://mittpsyke.se/angest","sameAs":"https://example.com"}'
			)
		).toBe('{"url":"https://www.mittpsyke.se/angest","sameAs":"https://example.com"}');
		expect(
			normalizeStructuredDataSiteUrls(
				'{"url":"https://www.mittpsyke.se/angest","sameAs":"https://example.com"}'
			)
		).toBe('{"url":"https://www.mittpsyke.se/angest","sameAs":"https://example.com"}');
	});
});
