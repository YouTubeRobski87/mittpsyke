import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layoutSource = readFileSync(new URL('../routes/+layout.svelte', import.meta.url), 'utf8');
const breadcrumbSource = readFileSync(new URL('./components/BreadcrumbSchema.svelte', import.meta.url), 'utf8');
const articlePageSource = readFileSync(new URL('../routes/blogg/[slug]/+page.svelte', import.meta.url), 'utf8');

	describe('public structured-data URLs', () => {
	it('uses the central apex origin for organization and web application schema', () => {
		expect(layoutSource).toContain("import { canonicalUrl, PUBLIC_SITE_ORIGIN } from '$lib/seo';");
		expect(layoutSource).toContain('url: PUBLIC_SITE_ORIGIN,');
		expect(layoutSource).toContain("logo: canonicalUrl('/logo.png'),");
		expect(layoutSource).not.toContain('https://www.mittpsyke.se');
	});

	it('normalizes breadcrumb schema URLs through the central canonical helper', () => {
		expect(breadcrumbSource).toContain("import { canonicalUrl, PUBLIC_SITE_ORIGIN } from '$lib/seo';");
		expect(breadcrumbSource).toContain('return canonicalUrl(url);');
		expect(breadcrumbSource).not.toContain('https://www.mittpsyke.se');
	});

	it('reuses an article canonical URL for og:url instead of the raw request path', () => {
		expect(layoutSource).toContain('const pageCanonical = $derived(page.data?.canonical ?? canonicalUrl(page.url.pathname));');
		expect(layoutSource).toContain('<meta property="og:url" content={pageCanonical} />');
		expect(layoutSource).not.toContain('rel="canonical"');
		expect(articlePageSource).toContain('const canonical = $derived(data.canonical);');
		expect(articlePageSource.match(/<SEO \{canonical\} \/>/g)).toHaveLength(1);
	});
});
