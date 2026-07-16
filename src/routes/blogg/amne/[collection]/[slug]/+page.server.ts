import { error } from '@sveltejs/kit';
import {
	getArticleDateLabel,
	getArticleTopics,
	getPublishedArticle,
	renderArticleMarkdown
} from '$lib/server/article-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const topic = getArticleTopics().find((item) => item.slug === params.collection);
	if (!topic) throw error(404, 'Ämnet kunde inte hittas.');

	const article = getPublishedArticle(params.collection, params.slug);
	if (!article) throw error(404, 'Artikeln kunde inte hittas.');

	return {
		title: article.title,
		description: article.description,
		ogType: 'article',
		article: {
			...article,
			dateLabel: getArticleDateLabel(article),
			updatedLabel: article.updated ? getArticleDateLabel({ date: article.updated }) : null,
			content: renderArticleMarkdown(article.body, article.title)
		},
		topic
	};
};
