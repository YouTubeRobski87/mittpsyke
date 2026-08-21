import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getPublishedArticles } from '$lib/server/article-content';
import { load } from './+page.server';

// Soro-artiklarna hämtas över nätet och ska inte påverka det här testet. En
// fetch som misslyckas ger { articles: [], loadError: true } i fetchSoroArticles,
// vilket isolerar testet till de markdown-artiklar som finns i repot.
const failingFetch: typeof fetch = () => Promise.reject(new Error('Soro avstängt i test'));

type BlogIndexEvent = Parameters<typeof load>[0];

function createEvent(page: number): BlogIndexEvent {
	const url = new URL('https://www.mittpsyke.se/blogg');
	if (page > 1) url.searchParams.set('page', String(page));

	return {
		url,
		fetch: failingFetch,
		setHeaders: () => {}
	} as unknown as BlogIndexEvent;
}

// Formen på ett artikelkort så som bloggindex bygger det. Laddaren kan kasta
// redirect, så dess returtyp innehåller void — därför den egna typen här.
type IndexArticle = {
	href: string;
	title: string;
	excerpt: string;
	isoDate: string;
};

type IndexPageData = {
	articles: IndexArticle[];
	pagination: { totalPages: number; totalArticles: number };
};

async function loadIndexPage(page: number): Promise<IndexPageData> {
	const result = await load(createEvent(page));
	if (!result || !('articles' in result)) {
		throw new Error(`Bloggindex returnerade ingen data för sida ${page}`);
	}

	return result as IndexPageData;
}

// Kör den riktiga laddaren för /blogg och samlar ihop varje sida i pagineringen,
// så att en artikel som hamnar på sida 2 eller senare räknas som hittad.
async function loadAllIndexHrefs() {
	const firstPage = await loadIndexPage(1);
	const hrefs = firstPage.articles.map((article) => article.href);

	for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
		const result = await loadIndexPage(page);
		hrefs.push(...result.articles.map((article) => article.href));
	}

	return { hrefs, pagination: firstPage.pagination };
}

describe('/blogg index-laddaren', () => {
	it('har en tydlig väg från artiklar till det befintliga guideindexet', () => {
		const page = readFileSync(resolve(process.cwd(), 'src/routes/blogg/+page.svelte'), 'utf8');

		expect(page).toContain('aria-label="Växla mellan artiklar och guider"');
		expect(page).toContain('href="/blogg" aria-current="page"');
		expect(page).toContain('href="/guider">Guider</a>');
		expect(page).toContain('class="article-grid"');
	});

	it('visar varje publicerad markdown-artikel någonstans i pagineringen', async () => {
		const { hrefs } = await loadAllIndexHrefs();
		const indexHrefs = new Set(hrefs);

		const missing = getPublishedArticles()
			.filter((article) => !indexHrefs.has(article.url))
			.map((article) => `${article.url} (${article.title})`);

		expect(missing, `Publicerade artiklar som saknas i bloggindex:\n${missing.join('\n')}`).toEqual(
			[]
		);
	});

	it('listar varje artikel exakt en gång över alla sidor', async () => {
		const { hrefs, pagination } = await loadAllIndexHrefs();

		const duplicates = hrefs.filter((href, index) => hrefs.indexOf(href) !== index);

		expect(duplicates, `Dubblerade poster i bloggindex: ${duplicates.join(', ')}`).toEqual([]);
		expect(hrefs).toHaveLength(pagination.totalArticles);
	});

	it('ger varje kort en titel, en ingress och ett giltigt datum', async () => {
		const { articles } = await loadIndexPage(1);

		const incomplete = articles.flatMap((article) => {
			const problems: string[] = [];
			if (!article.title.trim()) problems.push('saknar titel');
			if (!article.excerpt.trim()) problems.push('saknar ingress');
			if (Number.isNaN(Date.parse(article.isoDate))) problems.push('saknar giltigt isoDate');

			return problems.length > 0 ? [`${article.href}: ${problems.join(', ')}`] : [];
		});

		expect(incomplete).toEqual([]);
	});
});
