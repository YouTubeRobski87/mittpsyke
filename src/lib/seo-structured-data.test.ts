import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layoutSource = readFileSync(new URL('../routes/+layout.svelte', import.meta.url), 'utf8');
const breadcrumbSource = readFileSync(new URL('./components/BreadcrumbSchema.svelte', import.meta.url), 'utf8');

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
});
