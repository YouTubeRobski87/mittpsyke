import { describe, expect, it } from 'vitest';
import { parseArticleFrontmatter } from './article-content';

describe('parseArticleFrontmatter', () => {
	it('keeps an article renderable when optional metadata is incomplete', () => {
		const article = parseArticleFrontmatter(
			{
				collection: 'oro-och-stress',
				relatedArticles: [{}, { title: 'Läs mer', url: '/blogg/amne/oro-och-stress/oro' }],
				references: [{}, { label: '1177', url: 'https://www.1177.se/' }],
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
			references: [{ label: '1177', url: 'https://www.1177.se/' }]
		});
	});

	it('rejects a structural collection mismatch without affecting other articles', () => {
		expect(() => parseArticleFrontmatter({ collection: 'annat' }, 'oro-och-stress')).toThrow(
			'Frontmatter collection does not match'
		);
	});
});
