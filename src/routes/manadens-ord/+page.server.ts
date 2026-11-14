import { error } from '@sveltejs/kit';
import { formatMonthLabel, getCurrentMonthlyWord } from '$lib/data/manadens-ord';
import { getPublishedArticles } from '$lib/server/article-content';
import type { PageServerLoad } from './$types';

// Sidan läser bara innehållsfilen och artikellistan. Inget om besökaren
// hämtas, sparas eller mäts här.
export const load: PageServerLoad = () => {
	const entry = getCurrentMonthlyWord();
	if (!entry) throw error(404, 'Månadens ord är inte publicerat än.');

	// Artikelns titel hämtas från artikeln själv, så den inte kan glida isär
	// från det som står på artikelsidan. Saknas artikeln visas sidan utan länk.
	const article = getPublishedArticles().find((candidate) => candidate.url === entry.articlePath);

	return {
		title: `Månadens ord: ${entry.word}`,
		description: `${entry.reflection.split('. ')[0]}. Ett ord, en kort reflektion och en öppen fråga – utan konto och utan krav.`,
		entry: {
			word: entry.word,
			reflection: entry.reflection,
			question: entry.question,
			monthLabel: formatMonthLabel(entry.month)
		},
		article: article ? { title: article.title, url: article.url } : null
	};
};
