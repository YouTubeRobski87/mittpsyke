import { describe, expect, it } from 'vitest';
import { legacyBlogRedirects } from '$lib/server/legacy-redirects';
import { replaceRedirectedSitemapPath } from '$lib/server/sitemap-redirects';

describe('sitemap redirect handling', () => {
	it('emits the final URL for every legacy blog route', () => {
		for (const [legacyPath, targetPath] of Object.entries(legacyBlogRedirects)) {
			expect(replaceRedirectedSitemapPath(legacyPath)).toBe(targetPath);
		}
	});

	it('keeps paths without a redirect unchanged', () => {
		expect(replaceRedirectedSitemapPath('/guider/angest')).toBe('/guider/angest');
	});
});
