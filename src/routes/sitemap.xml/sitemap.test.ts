import { describe, expect, it } from 'vitest';
import { legacyBlogRedirects } from '$lib/server/legacy-redirects';
import { replaceRedirectedSitemapPath } from '$lib/server/sitemap-redirects';
import { GET } from './+server';

describe('sitemap redirect handling', () => {
	it('emits the final URL for every legacy blog route', () => {
		for (const [legacyPath, targetPath] of Object.entries(legacyBlogRedirects)) {
			expect(replaceRedirectedSitemapPath(legacyPath)).toBe(targetPath);
		}
	});

	it('keeps paths without a redirect unchanged', () => {
		expect(replaceRedirectedSitemapPath('/guider/angest')).toBe('/guider/angest');
	});

	it('emits only apex URLs', async () => {
		const response = await GET({
			fetch: async () => new Response('', { status: 503 })
		} as unknown as Parameters<typeof GET>[0]);
		const sitemap = await response.text();
		const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

		expect(locations.length).toBeGreaterThan(0);
		expect(locations.every((location) => location.startsWith('https://mittpsyke.se/'))).toBe(true);
		expect(sitemap).not.toContain('https://www.mittpsyke.se');
	}, 15_000);
});
