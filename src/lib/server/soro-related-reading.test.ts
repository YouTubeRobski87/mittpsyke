import { describe, expect, it } from 'vitest';
import { classifyInternalLink, knownStaticRoutePaths, getPublishedArticles } from './article-content';
import { allSoroRelatedReadingLinks, getSoroRelatedReading } from './soro-related-reading';

// "Läs vidare" i Soro-artiklarna får bara peka på sidor som finns i repot,
// annars skickar vi läsaren som stannat till en 404.
describe('getSoroRelatedReading', () => {
	it('pekar bara på sidor som finns', () => {
		const published = new Set(getPublishedArticles().map((a) => `${a.collection}/${a.slug}`));

		for (const link of allSoroRelatedReadingLinks) {
			const check = classifyInternalLink(link.url);
			if (check.kind === 'blog-article') {
				expect(published.has(`${check.collection}/${check.slug}`), link.url).toBe(true);
			} else if (check.kind === 'dynamic-route') {
				expect(check.valid, link.url).toBe(true);
			} else if (check.kind === 'static-route') {
				expect(knownStaticRoutePaths.has(check.path), link.url).toBe(true);
			} else {
				throw new Error(`${link.url} kan inte verifieras (${check.kind})`);
			}
		}
	});

	it('ger handplockade länkar för de mest besökta artiklarna', () => {
		expect(getSoroRelatedReading('vad-sager-man-i-sorg').map((l) => l.url)).toEqual([
			'/guider/depression/sorg-och-depression',
			'/ovningar/icke-valdsam-kommunikation',
			'/guider/ensamhet/kanner-mig-ensam'
		]);
		expect(getSoroRelatedReading('hjalp-med-bostad-av-socialen')[0].url).toBe(
			'/blogg/amne/relationer-och-samhalle/dina-rattigheter-hos-socialtjansten'
		);
	});

	it('väljer ämne utifrån slugen när artikeln inte är handplockad', () => {
		expect(getSoroRelatedReading('myten-om-missbruk')[0].url).toContain('/guider/beroende/');
		expect(getSoroRelatedReading('vad-ska-jag-skriva-i-dagbok')[0].url).toBe('/ovningar/daglig-reflektionsmall');
		expect(getSoroRelatedReading('nar-tankarna-snurrar')[0].url).toBe(
			'/guider/overtankande/varfor-hjarnan-fastnar-i-loopar'
		);
		expect(getSoroRelatedReading('mans-psykiska-halsa-sverige')[0].url).toContain('mans-ensamhet');
	});

	it('räknar inte "maende" som en artikel om män', () => {
		const urls = getSoroRelatedReading('folja-sitt-maende-over-tid').map((l) => l.url);
		expect(urls.some((url) => url.includes('mans-ensamhet'))).toBe(false);
	});

	it('ger alltid högst tre länkar och en standarduppsättning för okända artiklar', () => {
		const fallback = getSoroRelatedReading('helt-okand-artikel');
		expect(fallback).toHaveLength(3);
		for (const slug of ['vad-sager-man-i-sorg', 'myten-om-missbruk', 'helt-okand-artikel']) {
			expect(getSoroRelatedReading(slug).length).toBeLessThanOrEqual(3);
		}
	});

	it('lägger inte till läsning på akutsidan', () => {
		expect(getSoroRelatedReading('vid-akut-kris-ring-nu')).toEqual([]);
	});
});
