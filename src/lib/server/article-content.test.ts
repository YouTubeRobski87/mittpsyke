import { describe, expect, it } from 'vitest';
import {
	getPublishedArticle,
	getPublishedArticles,
	parseArticleFrontmatter
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
