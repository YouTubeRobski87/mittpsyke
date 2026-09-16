import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EVENING_CLUSTER_GUIDES, guides } from '$lib/seo-kit/content';
import { legacyBlogRedirects, mergedGuideRedirects } from '$lib/server/legacy-redirects';
import { replaceRedirectedSitemapPath } from '$lib/server/sitemap-redirects';

// Kvällsklustret konsoliderades till sex målsidor. Testerna vaktar att de
// hopslagna adresserna leder vidare, att ingen intern länk pekar på en
// borttagen sida och att målsidorna bär innehållet de tog över.

const guideHrefs = new Set(guides.map((guide) => `/guider/${guide.pillarSlug}/${guide.slug}`));
const MERGED_SLUGS = [
	'angest-och-somn',
	'nar-tankarna-inte-stannar',
	'mycket-tankar-pa-kvallen',
	'altande-pa-kvallen',
	'nattlig-oro'
];

describe('de hopslagna kvällsguiderna är borta', () => {
	it('finns inte kvar som egna guider', () => {
		for (const slug of MERGED_SLUGS) {
			expect(guides.some((guide) => guide.slug === slug), slug).toBe(false);
		}
	});

	it('har en 301 till sin målsida', () => {
		expect(Object.keys(mergedGuideRedirects).sort()).toEqual(
			[
				'/guider/angest/angest-och-somn',
				'/guider/angest/nar-tankarna-inte-stannar',
				'/guider/sovproblem/altande-pa-kvallen',
				'/guider/sovproblem/nattlig-oro',
				'/guider/stress/mycket-tankar-pa-kvallen'
			].sort()
		);

		for (const [from, to] of Object.entries(mergedGuideRedirects)) {
			expect(guideHrefs.has(from), `${from} ska vara borttagen`).toBe(false);
			expect(guideHrefs.has(to), `${to} ska finnas kvar`).toBe(true);
		}

		const hooks = readFileSync(join(process.cwd(), 'src/hooks.server.ts'), 'utf8');
		expect(hooks).toContain('mergedGuideRedirects[normalizedPathname]');
		expect(hooks).toContain('throw redirect(301, mergedGuideTarget)');
		// Hooks och sitemap läser samma karta, ingen egen kopia här.
		expect(hooks).not.toMatch(/const legacyBlogRedirects: Record/);
	});

	it('har inga interna länkar kvar till de borttagna adresserna', () => {
		for (const guide of guides) {
			for (const related of guide.relatedArticles ?? []) {
				expect(mergedGuideRedirects[related.href], `${guide.slug} -> ${related.href}`).toBeUndefined();
			}
			for (const merged of Object.keys(mergedGuideRedirects)) {
				expect(guide.content ?? '', `${guide.slug} innehåll`).not.toContain(merged);
			}
		}
	});

	it('länkar inte till sig själv och pekar bara på sidor som finns', () => {
		for (const guide of guides) {
			const self = `/guider/${guide.pillarSlug}/${guide.slug}`;
			const hrefs = (guide.relatedArticles ?? []).map((related) => related.href);
			expect(hrefs, self).not.toContain(self);
			expect(new Set(hrefs).size, `${self} har dubbletter`).toBe(hrefs.length);
			for (const href of hrefs) {
				// Bara djupa guidelänkar kontrolleras; pelarsidor har egna rutter.
				if (href.split('/').length === 4 && href.startsWith('/guider/')) {
					expect(guideHrefs.has(href), `${self} -> ${href}`).toBe(true);
				}
			}
		}
	});
});

describe('målsidorna bär innehållet de tog över', () => {
	const byKey = new Map(guides.map((guide) => [`${guide.pillarSlug}/${guide.slug}`, guide]));

	it('har alla sex kvarvarande kvällssidor', () => {
		for (const key of EVENING_CLUSTER_GUIDES) {
			expect(byKey.has(key), key).toBe(true);
		}
	});

	it('har brödtext, frågor och källor på de sidor som tog emot en hopslagning', () => {
		const sleep = byKey.get('sovproblem/svart-att-somna-angest');
		expect(sleep?.content ?? '').toContain('Varför natten kan bli svårare');
		expect(sleep?.faqs.some((faq) => faq.question.includes('väcka mig under natten'))).toBe(true);

		const overthinking = byKey.get('overtankande/sluta-overtanka-pa-kvallen');
		expect(overthinking?.faqs.length ?? 0).toBeGreaterThanOrEqual(4);
		expect(overthinking?.sources?.length ?? 0).toBeGreaterThan(0);
		expect(overthinking?.faqs.some((faq) => faq.question.includes('ältande'))).toBe(true);

		const night = byKey.get('angest/vaknar-med-angest');
		expect(night?.faqs.some((faq) => faq.question.includes('stiga upp'))).toBe(true);
	});

	it('skiljer pelarsidan från akutsidan i titel och intention', () => {
		const pillar = byKey.get('angest/angest-pa-kvallen');
		const now = byKey.get('angest/hjalp-vid-oro-pa-kvallen');
		expect(pillar?.title).toBe('Kvällsångest – varför får jag ångest på kvällen?');
		expect(now?.title).toBe('Oro på kvällen – tre saker att göra just nu');
		expect(now?.content ?? '').toContain('/guider/angest/angest-pa-kvallen');
		expect(now?.title).not.toContain('Kvällsångest');
	});

	it('ger kvällssidorna en lågmäld väg till Kvällstugan, inte chatten', () => {
		const flagged = guides.filter((guide) => guide.eveningSupport);
		expect(flagged.map((guide) => `${guide.pillarSlug}/${guide.slug}`).sort()).toEqual(
			[...EVENING_CLUSTER_GUIDES].sort()
		);

		const page = readFileSync(
			join(process.cwd(), 'src/routes/guider/[pillar]/[guide]/+page.svelte'),
			'utf8'
		);
		const block = page.slice(
			page.indexOf('{#if data.guide.eveningSupport}'),
			page.indexOf('{/if}', page.indexOf('{#if data.guide.eveningSupport}'))
		);
		expect(block).toContain('Kvällstugan');
		expect(block).toContain('href={EVENING_CHECKIN_HREF}');
		expect(page).toContain("const EVENING_CHECKIN_HREF = '/login?redirect=/dashboard/kvallsstugan';");
		expect(block).not.toContain('/chat');
		// Ingen hård konverteringscopy.
		expect(block).not.toMatch(/gratis|kom igång nu|skapa konto|prova nu/i);
	});
});

describe('artikeln om kvälls- och nattångest är hopslagen med pelaren', () => {
	const PILLAR = '/guider/angest/angest-pa-kvallen';
	const pillar = guides.find((guide) => guide.slug === 'angest-pa-kvallen');

	it('finns inte kvar som egen artikel', () => {
		expect(
			existsSync(join(process.cwd(), 'src/content/articles/oro-och-stress/kvallsangest-och-nattangest.md'))
		).toBe(false);
	});

	it('låter alla kvällsångest-varianter leda direkt till pelaren, utan kedja', () => {
		for (const from of [
			'/blogg/amne/oro-och-stress/kvallsangest-och-nattangest',
			'/blogg/kvallasangest',
			'/blogg/kvallsangest'
		]) {
			expect(legacyBlogRedirects[from], from).toBe(PILLAR);
			// Målet får inte själv vara en omdirigerad adress.
			expect(legacyBlogRedirects[PILLAR]).toBeUndefined();
			expect(mergedGuideRedirects[PILLAR]).toBeUndefined();
		}
	});

	it('bär artikelns unika innehåll', () => {
		const content = pillar?.content ?? '';
		expect(content).toContain('5-4-3-2-1');
		expect(content).toContain('Ge oron en egen tid tidigare på kvällen');
		expect(content).toContain('Sängen behöver inte bli platsen där du kämpar');
		expect(content).toContain('Låt kvällen bli förutsägbar');
		expect(content).toContain('paniksyndrom');
		expect(pillar?.sources?.some((source) => source.url.includes('paniksyndrom'))).toBe(true);
		expect(pillar?.faqs.some((faq) => faq.question === 'Kan jag följa mönster över tid?')).toBe(true);
	});

	it('behåller ingången till systerartiklarna', () => {
		const content = pillar?.content ?? '';
		for (const slug of [
			'vaknar-med-panik-pa-natten',
			'angest-nar-man-ska-lagga-sig',
			'hjartklappning-pa-kvallen',
			'radd-for-att-somna',
			'varfor-blir-tankarna-varre-nar-det-blir-tyst'
		]) {
			expect(content, slug).toContain(`/blogg/amne/oro-och-stress/${slug}`);
		}
	});

	it('har inga interna länkar kvar till den hopslagna artikeln', () => {
		const files = [
			...readdirSync(join(process.cwd(), 'src/content/articles/oro-och-stress'))
				.filter((name) => name.endsWith('.md'))
				.map((name) => join('src/content/articles/oro-och-stress', name)),
			'src/lib/seo-kit/content.ts',
			'src/lib/data/seo-architecture.ts'
		];

		for (const file of files) {
			expect(readFileSync(join(process.cwd(), file), 'utf8'), file).not.toContain(
				'kvallsangest-och-nattangest'
			);
		}
	});
});

describe('sitemap och Soro-dubbletter', () => {
	it('annonserar inte de hopslagna guidernas adresser', () => {
		for (const from of Object.keys(mergedGuideRedirects)) {
			expect(guideHrefs.has(from), from).toBe(false);
		}
	});

	it('pekar om Soro-artiklar som svarade på samma fråga som en kvällsguide', () => {
		const soro = {
			'/blogg/kvallsangest': '/guider/angest/angest-pa-kvallen',
			'/blogg/oro-pa-kvallar': '/guider/angest/hjalp-vid-oro-pa-kvallen',
			'/blogg/oro-infor-natten': '/guider/sovproblem/svart-att-somna-angest'
		};

		for (const [from, to] of Object.entries(soro)) {
			expect(legacyBlogRedirects[from], from).toBe(to);
			expect(replaceRedirectedSitemapPath(from), from).toBe(to);
			expect(guideHrefs.has(to), to).toBe(true);
		}
	});
});
