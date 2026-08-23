import { describe, expect, it, vi } from 'vitest';
import { legacyBlogRedirects } from '$lib/server/legacy-redirects';
import { replaceRedirectedSitemapPath } from '$lib/server/sitemap-redirects';
import { GET } from './+server';

describe('sitemap.xml', () => {
	it('emits the final URL for every legacy blog route', () => {
		for (const [legacyPath, targetPath] of Object.entries(legacyBlogRedirects)) {
			expect(replaceRedirectedSitemapPath(legacyPath)).toBe(targetPath);
		}
	});

	it('keeps paths without a redirect unchanged', () => {
		expect(replaceRedirectedSitemapPath('/guider/angest')).toBe('/guider/angest');
	});

	it('uses the apex domain for every generated URL', async () => {
		const response = await GET({
			fetch: vi.fn().mockResolvedValue(new Response('', { status: 503 }))
		} as never);
		const xml = await response.text();
		const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

		expect(locations.length).toBeGreaterThan(0);
		expect(locations.every((location) => location.startsWith('https://mittpsyke.se/'))).toBe(true);
		expect(xml).not.toContain('https://www.mittpsyke.se');
	});
});
