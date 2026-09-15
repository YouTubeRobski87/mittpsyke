import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildArticleJsonLd } from '$lib/server/article-content';
import {
	buildAuthorJsonLd,
	EDITORIAL_METHOD_HREF,
	EDITORIAL_REVIEW_STATUS,
	EDITORIAL_TEAM_NAME,
	FOUNDER_NAME,
	normalizeAuthorName
} from '$lib/editorial';

// MittPsyke har ingen medicinsk granskare och ingen klinisk redaktion. Därför
// får varken strukturerad data eller synlig text signalera medicinsk
// faktagranskning, och schemats avsändare ska vara samma som sidans byline.

const ROOT = process.cwd();

function sourceFiles(dir: string, extensions = /\.(svelte|ts)$/): string[] {
	const files: string[] = [];
	for (const name of readdirSync(join(ROOT, dir))) {
		const path = `${dir}/${name}`;
		if (statSync(join(ROOT, path)).isDirectory()) files.push(...sourceFiles(path, extensions));
		else if (extensions.test(name) && !name.endsWith('.test.ts')) files.push(path);
	}
	return files;
}

const allSources = sourceFiles('src');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

describe('inga medicinska auktoritetssignaler i strukturerad data', () => {
	it('använder inte MedicalWebPage, MedicalCondition, MedicalAudience eller specialty', () => {
		for (const file of allSources) {
			const source = read(file);
			expect(source, file).not.toContain('MedicalWebPage');
			expect(source, file).not.toContain('MedicalAudience');
			expect(source, file).not.toContain('MedicalCondition');
			expect(source, file).not.toContain('schema.org/Psychiatric');
			expect(source, file).not.toMatch(/\bspecialty:/);
			// reviewedBy/lastReviewed kräver en namngiven granskare.
			expect(source, file).not.toMatch(/reviewedBy|lastReviewed/);
		}
	});
});

describe('ingen text påstår medicinsk granskning', () => {
	const claimPattern = /(?:medicinskt|kliniskt)\s+(?:fakta)?granskad|medicinsk\s+faktagranskning|faktagranskad av/gi;

	it('nämner medicinsk granskning bara som en negation', () => {
		for (const file of [...allSources, ...sourceFiles('src/content', /\.md$/)]) {
			const source = read(file);
			for (const match of source.matchAll(claimPattern)) {
				const before = source.slice(Math.max(0, match.index - 40), match.index);
				expect(before, `${file}: "${match[0]}"`).toMatch(/\b(inte|ej|icke|inga)\b[^.]*$/i);
			}
		}
	});

	it('ger ingen klinisk titel åt avsändaren', () => {
		for (const file of allSources) {
			expect(read(file), file).not.toMatch(
				/legitimerad (psykolog|psykoterapeut|läkare)|vår(a|t)? (medicinska|kliniska) (redaktion|granskare|team)|medicinsk redaktör/i
			);
		}
	});
});

describe('strukturerad data går fortfarande att tolka', () => {
	// Bara de statiska objektliteralerna kan läsas ur källan; sidor som bygger
	// schemat av laddad data (t.ex. /angest) täcks av svelte-check och bygget.
	const jsonLdSchema = z.object({
		'@context': z.literal('https://schema.org'),
		'@type': z.enum([
			'WebPage',
			'Article',
			'BlogPosting',
			'CollectionPage',
			'AboutPage',
			'FAQPage',
			'BreadcrumbList',
			'WebApplication',
			'Organization',
			'ItemList'
		]),
		publisher: z.unknown().optional()
	});

	// Literaler som hämtar värden ur laddad data kastar ReferenceError här och
	// hoppas över; de som går att tolka fristående kontrolleras.
	const literals = allSources.flatMap((file) => {
		const source = read(file);
		return [...source.matchAll(/JSON\.stringify\((\{[\s\S]*?\})\)\}<\\\/script>/g)].flatMap(
			(match) => {
				try {
					return [{ file, value: Function(`"use strict"; return (${match[1]});`)() as unknown }];
				} catch {
					return [];
				}
			}
		);
	});

	it('hittar statiska JSON-LD-block att kontrollera', () => {
		expect(literals.length).toBeGreaterThan(8);
	});

	it('parsar varje statiskt block till giltig strukturerad data', () => {
		for (const { file, value } of literals) {
			const parsed = jsonLdSchema.safeParse(value);
			expect(parsed.success, `${file}: ${parsed.error?.message ?? ''}`).toBe(true);
			expect(JSON.stringify(value), file).not.toMatch(/Medical|Psychiatric|specialty/);
		}
	});
});

describe('avsändaren i schemat är densamma som på sidan', () => {
	it('gör bara den namngivna grundaren till en Person', () => {
		expect(buildAuthorJsonLd(FOUNDER_NAME)).toEqual({
			'@type': 'Person',
			name: FOUNDER_NAME,
			url: 'https://mittpsyke.se/om-skaparen'
		});
		for (const name of [EDITORIAL_TEAM_NAME, 'MittPsyke', 'MittPsyke redaktion', '']) {
			expect(buildAuthorJsonLd(name)).toEqual({
				'@type': 'Organization',
				name: EDITORIAL_TEAM_NAME,
				url: `https://mittpsyke.se${EDITORIAL_METHOD_HREF}`
			});
		}
	});

	it('skriver redaktionsnamnet likadant överallt', () => {
		for (const variant of ['MittPsyke', 'MittPsyke redaktion', 'MittPsyke-redaktion', '  ']) {
			expect(normalizeAuthorName(variant)).toBe(EDITORIAL_TEAM_NAME);
		}
		expect(normalizeAuthorName(FOUNDER_NAME)).toBe(FOUNDER_NAME);
	});

	it('bygger artikelschemat med artikelns egen författare', () => {
		const base = {
			title: 'Rubrik',
			description: 'Beskrivning',
			url: '/blogg/amne/oro-och-stress/test',
			image: undefined,
			date: '2026-01-01',
			updated: null,
			type: 'article'
		};
		const topic = { label: 'Oro och stress' };

		for (const author of [FOUNDER_NAME, EDITORIAL_TEAM_NAME]) {
			const jsonLd = buildArticleJsonLd(
				{ ...base, author } as Parameters<typeof buildArticleJsonLd>[0],
				topic
			);
			expect(jsonLd.author).toEqual(buildAuthorJsonLd(author));
			expect(jsonLd.author.name).toBe(author);
		}
	});

	it('visar samma avsändare som schemat på artikel- och guidesidor', () => {
		const localArticle = read('src/routes/blogg/amne/[collection]/[slug]/+page.svelte');
		expect(localArticle).toContain('<EditorialByline author={article.author} />');

		const soroArticle = read('src/routes/blogg/[slug]/+page.svelte');
		expect(soroArticle).toContain('const SORO_ARTICLE_AUTHOR = EDITORIAL_TEAM_NAME;');
		expect(soroArticle).toContain('author: buildAuthorJsonLd(SORO_ARTICLE_AUTHOR)');
		expect(soroArticle).toContain('<EditorialByline author={SORO_ARTICLE_AUTHOR} />');

		const guide = read('src/routes/guider/[pillar]/[guide]/+page.svelte');
		expect(guide).toContain('const GUIDE_AUTHOR_NAME = FOUNDER_NAME;');
		expect(guide).toContain('author: buildAuthorJsonLd(GUIDE_AUTHOR_NAME)');
		expect(guide).toContain('<EditorialByline author={GUIDE_AUTHOR_NAME} showStatus={false} />');
		// Guidens status står i källblocket i stället, så den syns ändå.
		expect(guide).toContain('<ContentTrustBlock');
	});
});

describe('granskningsstatusen visas där sidan har källor eller datum', () => {
	const byline = read('src/lib/components/EditorialByline.svelte');

	it('säger redaktionellt granskad men inte medicinskt faktagranskad, med länk till metoden', () => {
		expect(EDITORIAL_REVIEW_STATUS).toBe('Redaktionellt granskad, ej medicinskt faktagranskad');
		expect(byline).toContain('{EDITORIAL_REVIEW_STATUS}');
		expect(byline).toContain('href={EDITORIAL_METHOD_HREF}');
		expect(EDITORIAL_METHOD_HREF).toBe('/redaktionell-metod');
	});

	it('finns i varje källblock och i de delade förtroendeblocken', () => {
		for (const file of ['src/lib/components/ContentTrustBlock.svelte', 'src/lib/components/PublicTrustPanel.svelte']) {
			expect(read(file), file).toContain('<EditorialByline />');
		}

		const pagesWithSources = allSources.filter(
			(file) =>
				file.startsWith('src/routes/') &&
				/class="(source-block|sources)"/.test(read(file))
		);
		expect(pagesWithSources.length).toBeGreaterThanOrEqual(13);
		for (const file of pagesWithSources) {
			expect(read(file), file).toContain('<EditorialByline />');
		}
	});
});
