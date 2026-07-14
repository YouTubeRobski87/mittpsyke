import { error } from '@sveltejs/kit';
import { getArticleTopics, getPublishedArticles } from '$lib/server/article-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const topic = getArticleTopics().find((item) => item.slug === params.collection);
	if (!topic) throw error(404, 'Ämnet kunde inte hittas.');

	const articles = getPublishedArticles().filter((article) => article.collection === topic.slug);

	return {
		title: topic.label,
		description: topic.description,
		topic,
		articles
	};
};
