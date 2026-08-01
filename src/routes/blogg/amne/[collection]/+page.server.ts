import { error } from '@sveltejs/kit';
import { getArticleTopics, getPublishedArticles } from '$lib/server/article-content';
import { getFeaturedPagesForCollection } from '$lib/data/featured-pages';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const topic = getArticleTopics().find((item) => item.slug === params.collection);
	if (!topic) throw error(404, 'Ämnet kunde inte hittas.');

	const markdownArticles = getPublishedArticles()
		.filter((article) => article.collection === topic.slug)
		.map((article) => ({
			url: article.url,
			title: article.title,
			description: article.description,
			isoDate: article.date?.toISOString() ?? ''
		}));

	// Kurerade fristående sidor i samma ämne, med sin egen adress.
	const curatedPages = getFeaturedPagesForCollection(topic.slug).map((page) => ({
		url: page.url,
		title: page.title,
		description: page.description,
		isoDate: new Date(page.date).toISOString()
	}));

	const articles = [...markdownArticles, ...curatedPages].sort(
		(a, b) => Date.parse(b.isoDate) - Date.parse(a.isoDate)
	);

	return {
		title: topic.label,
		description: topic.description,
		topic,
		articles
	};
};
