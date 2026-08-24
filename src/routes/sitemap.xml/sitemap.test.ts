import { beforeAll, describe, expect, it, vi } from 'vitest';
import { legacyBlogRedirects } from '$lib/server/legacy-redirects';
import { replaceRedirectedSitemapPath } from '$lib/server/sitemap-redirects';
import { GET } from './+server';

describe('sitemap.xml', () => {
	const soroScript = (articles: unknown[]) =>
		`var SORO_ARTICLES = ${JSON.stringify(articles)};`;
	const soroArticle = (slug: string, isoDate = '2026-08-01') => ({
		id: `id-${slug}`,
		title: 'Testartikel',
		slug,
		excerpt: 'Testingress',
		date: isoDate,
		isoDate
	});

	const getSitemap = (body: string, status = 200) =>
		GET({
			fetch: vi.fn().mockResolvedValue(new Response(body, { status }))
		} as never);

	let normalXml = '';

	beforeAll(async () => {
		const response = await getSitemap(
			soroScript([
				soroArticle('soro-artikel', '2026-08-02'),
				soroArticle('https://www.mittpsyke.se/blogg/soro-artikel'),
				soroArticle('blogg/amne/ai-och-mental-halsa/ai-inom-psykisk-halsa-mojligheter-och-granser')
			])
		);
		expect(response.status).toBe(200);
		normalXml = await response.text();
	}, 30_000);

	it('emits the final URL for every legacy blog route', () => {
		for (const [legacyPath, targetPath] of Object.entries(legacyBlogRedirects)) {
			expect(replaceRedirectedSitemapPath(legacyPath)).toBe(targetPath);
		}
	});

	it('keeps paths without a redirect unchanged', () => {
		expect(replaceRedirectedSitemapPath('/guider/angest')).toBe('/guider/angest');
	});

	it('uses the apex domain for every generated URL', () => {
		const xml = normalXml;
		const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

		expect(locations.length).toBeGreaterThan(0);
		expect(locations.every((location) => location.startsWith('https://mittpsyke.se/'))).toBe(true);
		expect(xml).not.toContain('https://www.mittpsyke.se');
	});

	it('fails closed when Soro returns an HTTP error', async () => {
		const response = await getSitemap('', 503);
		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.text()).not.toContain('<urlset');
	});

	it('fails closed when Soro returns an empty article list', async () => {
		const response = await getSitemap(soroScript([]));
		expect(response.status).toBe(503);
	});

	it('removes the known stale article slug from sitemap redirects', () => {
		expect(replaceRedirectedSitemapPath('/blogg/textstod-eller-terapi-online-vad-passar-dig')).toBe(
			'/blogg/ar-textstod-lika-hjalpsamt-som-samtal'
		);
		expect(normalXml).not.toContain('/blogg/ar-textstod-lika-hjalpsamt-samtal</loc>');
	});

	it('normalizes www input, deduplicates paths, and preserves lastmod', () => {
		const locations = [...normalXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
		const soroLocations = locations.filter((entry) => entry.includes('/blogg/soro-artikel'));

		expect(soroLocations).toHaveLength(1);
		expect(soroLocations[0]).toContain('<loc>https://mittpsyke.se/blogg/soro-artikel</loc>');
		expect(soroLocations[0]).toContain('<lastmod>2026-08-02</lastmod>');
	});

	it('excludes private and noindex route families and keeps legacy redirects out', () => {
		expect(normalXml).not.toContain('https://mittpsyke.se/dashboard');
		expect(normalXml).not.toContain('https://mittpsyke.se/login');
		expect(normalXml).not.toContain('https://mittpsyke.se/register');
		expect(normalXml).not.toContain('https://mittpsyke.se/portal/');
		expect(normalXml).not.toContain('https://mittpsyke.se/blogg/ar-textstod-lika-hjalpsamt-samtal');
	});
});
