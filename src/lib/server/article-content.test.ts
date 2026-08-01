import { describe, expect, it } from 'vitest';
import {
	articleJsonLdSchema,
	buildArticleJsonLd,
	findBrokenArticleBodyLinks,
	findBrokenRelatedArticleLinks,
	getArticleTopics,
	getPublishedArticle,
	getPublishedArticles,
	parseArticleFrontmatter,
	validateArticleFiles
} from './article-content';

const MENS_LONELINESS_SLUG = 'mans-ensamhet-den-tysta-kanslan-som-fa-vagar-prata-om';

describe('parseArticleFrontmatter', () => {
	it('keeps an article renderable when optional metadata is incomplete', () => {
		const article = parseArticleFrontmatter(
			{
				collection: 'oro-och-stress',
				relatedArticles: [{}, { title: 'Läs mer', url: '/blogg/amne/oro-och-stress/oro' }],
				references: [
					{},
					{ label: '1177', url: 'https://www.1177.se/' },
					'Mind – Ensamhet\nhttps://mind.se/stod-kunskap/fakta/ensamhet/\nLäs mer om ensamhet.'
				],
				tags: ['oro', null, ''],
				date: 'inte-ett-datum',
				updated: null,
				image: null,
				description: null,
				author: null
			},
			'oro-och-stress'
		);

		expect(article).toMatchObject({
			title: 'Artikel',
			description: '',
			author: 'MittPsyke',
			image: undefined,
			date: null,
			updated: null,
			tags: ['oro'],
			relatedArticles: [{ title: 'Läs mer', url: '/blogg/amne/oro-och-stress/oro' }],
			references: [
				{ label: '1177', url: 'https://www.1177.se/' },
				{ label: 'Mind – Ensamhet', url: 'https://mind.se/stod-kunskap/fakta/ensamhet/' }
			]
		});
	});

	it('rejects a structural collection mismatch without affecting other articles', () => {
		expect(() => parseArticleFrontmatter({ collection: 'annat' }, 'oro-och-stress')).toThrow(
			'Frontmatter collection does not match'
		);
	});
});

describe('article discovery', () => {
	it('includes the published mens loneliness article in the blog article list', () => {
		const article = getPublishedArticles().find(({ slug }) => slug === MENS_LONELINESS_SLUG);

		expect(article).toMatchObject({
			slug: MENS_LONELINESS_SLUG,
			collection: 'relationer-och-samhalle',
			draft: false
		});
		expect(article?.references).toHaveLength(3);
		expect(
			getPublishedArticle('relationer-och-samhalle', MENS_LONELINESS_SLUG)?.slug
		).toBe(MENS_LONELINESS_SLUG);
	});
});

describe('every article file in src/content/articles', () => {
	const results = validateArticleFiles();

	it('has frontmatter that parses without error', () => {
		const failures = results.filter((result) => !result.valid);

		expect(failures, failures.map((f) => `${f.path}: ${(f as { error: string }).error}`).join('\n')).toEqual([]);
	});

	it('reaches the blog index whenever it is not a draft', () => {
		const publishedSlugs = new Set(
			getPublishedArticles().map((article) => `${article.collection}/${article.slug}`)
		);

		const missing = results
			.filter((result) => result.valid && !result.article.draft)
			.map((result) => `${result.collection}/${result.slug}`)
			.filter((key) => !publishedSlugs.has(key));

		expect(missing).toEqual([]);
	});

	it('has no broken "Läs vidare"-links', () => {
		const broken = findBrokenRelatedArticleLinks();

		expect(
			broken,
			broken
				.map((link) => `${link.sourcePath} → "${link.linkTitle}" (${link.url}) ${link.reason}`)
				.join('\n')
		).toEqual([]);
	});

	it('has no broken links written directly in the article body', () => {
		const broken = findBrokenArticleBodyLinks();

		expect(
			broken,
			broken.map((link) => `${link.sourcePath}: "${link.url}" ${link.reason}`).join('\n')
		).toEqual([]);
	});

	it('produces JSON-LD that satisfies the schema.org BlogPosting/HowTo fields Google expects', () => {
		const topicsBySlug = new Map(getArticleTopics().map((topic) => [topic.slug, topic]));

		const invalid = results.flatMap((result) => {
			if (!result.valid || result.article.draft) return [];

			const topic = topicsBySlug.get(result.article.collection);
			if (!topic) return [`${result.path}: okänt ämne "${result.article.collection}"`];

			const jsonLd = JSON.parse(JSON.stringify(buildArticleJsonLd(result.article, topic)));
			const parsed = articleJsonLdSchema.safeParse(jsonLd);
			if (parsed.success) return [];

			return [`${result.path}: ${parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join(', ')}`];
		});

		expect(invalid).toEqual([]);
	});

	// Titel, beskrivning och datum matas rakt in i <title>, <meta name="description">
	// och artikelns JSON-LD (BlogPosting). Schemat tillåter tekniskt sett att de
	// saknas (tomma strängar/null), men det gör metadata och strukturerad data
	// ofullständig utan att build eller "frontmatter parses"-testet slår larm.
	it('has metadata that keeps <title>, <meta description> and JSON-LD complete', () => {
		const incomplete = results.flatMap((result) => {
			if (!result.valid || result.article.draft) return [];

			const problems: string[] = [];
			if (!result.article.title || result.article.title === 'Artikel') problems.push('saknar en riktig titel');
			if (!result.article.description) problems.push('saknar description');
			if (!result.article.date) problems.push('saknar ett giltigt datum');

			return problems.length > 0 ? [`${result.path}: ${problems.join(', ')}`] : [];
		});

		expect(incomplete).toEqual([]);
	});
});
