import { error } from '@sveltejs/kit';
import { SORO_EMBED_SRC, SORO_TOKEN } from '$lib/soro';
import type { PageServerLoad } from './$types';

const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
const LOCAL_FEATURED_IMAGE_BY_SLUG = new Map([['ai-dagbok', '/storify-og-image.png']]);
const LOCAL_TITLE_BY_SLUG = new Map([['chatta-anonymt-utan-konto', 'Chatta anonymt utan konto – börja direkt']]);

type SoroArticleListItem = {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	date: string;
	isoDate: string;
	image: string | null;
};

type SoroArticleContentResponse = {
	content?: string;
};

function normalizeSlug(value: string) {
	try {
		const decoded = decodeURIComponent(value);
		const url = decoded.startsWith('http') ? new URL(decoded) : null;
		const path = (url?.pathname ?? decoded).replace(/^\/+|\/+$/g, '');
		return (path.startsWith('blogg/') ? path.slice('blogg/'.length) : path).toLowerCase();
	} catch {
		const path = value.replace(/^\/+|\/+$/g, '');
		return (path.startsWith('blogg/') ? path.slice('blogg/'.length) : path).toLowerCase();
	}
}

function extractArticles(embedScript: string) {
	const match = embedScript.match(/var SORO_ARTICLES = (\[[\s\S]*?\]);/);
	if (!match) return [];
	return JSON.parse(match[1]) as SoroArticleListItem[];
}

// Soro-innehåll kan innehålla länkar utan protokoll (t.ex. href="www.1177.se").
// Utan https:// tolkas de relativt och blir /blogg/www.1177.se (404). Lägg på https://.
function fixProtocolLessLinks(html: string): string {
	return html.replace(/(href=["'])(www\.)/gi, '$1https://$2');
}

// Soro-innehållet inleds med en egen <h1> (artikelrubriken). Mallen renderar redan
// <h1>{article.title}</h1> i headern, så den ledande H1:an i innehållet ger en dubbel H1.
// Strippa den ledande H1:an för samtliga artiklar så att varje sida har exakt en H1.
function stripLeadingH1(html: string): string {
	return html.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, '');
}

function toAbsoluteUrl(path: string): string {
	return path.startsWith('http') ? path : `https://www.mittpsyke.se${path}`;
}

function normalizeYoungMentalHealthArticleContent(content: string) {
	return content
		.replace(/^<h1>[\s\S]*?<\/h1>\s*/, '')
		.replace(
			'<p>Men om du mår så dåligt att skolan, sömnen, relationerna eller vardagen påverkas under längre tid är det klokt att ta kontakt med någon vuxen eller vården. 1177 beskriver att vårdcentralen kan vara en väg in vid psykiska besvär som oro, sömnsvårigheter, stress, ångest och nedstämdhet, särskilt när besvären påverkat vardagen under några veckor eller längre (1177, u.å.-b).</p>',
			'<p>Men om du mår så dåligt att skolan, sömnen, relationerna eller vardagen påverkas under längre tid är det klokt att ta kontakt med någon vuxen eller vården. 1177 beskriver att vårdcentralen kan vara en väg in vid psykiska besvär som oro, sömnsvårigheter, stress, ångest och nedstämdhet, särskilt när besvären påverkat vardagen under några veckor eller längre (1177, u.å.-b). Socialstyrelsen betonar också behovet av tidig och enkel kontakt med vården för barn och unga med psykisk ohälsa (Socialstyrelsen, 2026).</p>'
		)
		.replace(
			'<ol><li>(u.å.-a). <em>När barn och unga mår dåligt – stöd och vård vid psykisk ohälsa</em>. 1177 Vårdguiden. Hämtad 7 juni 2026, från https://www.1177.se/liv--halsa/psykisk-halsa/att-soka-stod-och-hjalp/stod-och-vard-vid-psykisk-ohalsa--nar-barn-och-unga-mar-daligt/</li></ol>',
			'<p>1177. (u.å.-a). <em>När barn och unga mår dåligt – stöd och vård vid psykisk ohälsa</em>. 1177 Vårdguiden. Hämtad 7 juni 2026, från https://www.1177.se/liv--halsa/psykisk-halsa/att-soka-stod-och-hjalp/stod-och-vard-vid-psykisk-ohalsa--nar-barn-och-unga-mar-daligt/</p>'
		)
		.replace(
			'<ol><li>(u.å.-b). <em>Söka vård för psykiska besvär</em>. 1177 Vårdguiden. Hämtad 7 juni 2026, från https://www.1177.se/liv--halsa/psykisk-halsa/att-soka-stod-och-hjalp/soka-psykiatrisk-vard/</li></ol>',
			'<p>1177. (u.å.-b). <em>Söka vård för psykiska besvär</em>. 1177 Vårdguiden. Hämtad 7 juni 2026, från https://www.1177.se/liv--halsa/psykisk-halsa/att-soka-stod-och-hjalp/soka-psykiatrisk-vard/</p>'
		)
		.replace(
			'<p>Socialstyrelsen. (2026). <em>Psykisk ohälsa: fler barn och unga behöver tidig och enkel kontakt med vården</em>. https://www.socialstyrelsen.se/aktuellt/psykisk-ohalsa-fler-barn-och-unga-behover-tidig-och-enkel-kontakt-med-varden/ ```</p>',
			'<p>Socialstyrelsen. (2026). <em>Psykisk ohälsa: fler barn och unga behöver tidig och enkel kontakt med vården</em>. https://www.socialstyrelsen.se/aktuellt/psykisk-ohalsa-fler-barn-och-unga-behover-tidig-och-enkel-kontakt-med-varden/</p>'
		);
}

async function fetchArticleList(fetcher: typeof fetch, fresh = false) {
	const embedResponse = await fetcher(fresh ? `${SORO_EMBED_SRC}&cb=${Date.now()}` : SORO_EMBED_SRC, {
		headers: {
			accept: 'application/javascript,*/*',
			'user-agent': 'Mozilla/5.0'
		}
	});

	if (!embedResponse.ok) {
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}

	return extractArticles(await embedResponse.text());
}

export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	const requestedSlug = normalizeSlug(params.slug).toLowerCase();
	let articles = await fetchArticleList(fetch);
	let article = articles.find((item) => normalizeSlug(item.slug).toLowerCase() === requestedSlug);

	if (!article) {
		articles = await fetchArticleList(fetch, true);
		article = articles.find((item) => normalizeSlug(item.slug).toLowerCase() === requestedSlug);
	}

	if (!article) {
		throw error(404, 'Artikeln kunde inte hittas.');
	}

	const contentResponse = await fetch(
		`https://app.trysoro.com/api/embed/${SORO_TOKEN}/article/${article.id}`,
		{
			headers: {
				accept: 'application/json,*/*',
				'user-agent': 'Mozilla/5.0'
			}
		}
	);

	if (!contentResponse.ok) {
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}

	const contentPayload = (await contentResponse.json()) as SoroArticleContentResponse;

	if (!contentPayload.content) {
		throw error(404, 'Artikeln saknar innehåll.');
	}

	setHeaders({
		'cache-control': CACHE_CONTROL
	});

	const normalizedSlug = normalizeSlug(article.slug);
	const title = LOCAL_TITLE_BY_SLUG.get(normalizedSlug) ?? article.title;
	const content = fixProtocolLessLinks(
		stripLeadingH1(
			normalizedSlug === 'psykisk-ohalsa-unga'
				? normalizeYoungMentalHealthArticleContent(contentPayload.content)
				: contentPayload.content
		)
	);

	const featuredImage = LOCAL_FEATURED_IMAGE_BY_SLUG.get(normalizedSlug) ?? article.image;
	const ogImage = featuredImage
		? toAbsoluteUrl(featuredImage)
		: 'https://www.mittpsyke.se/og-image.png';

	return {
		title,
		description: article.excerpt,
		ogType: 'article',
		ogImage,
		article: {
			...article,
			slug: normalizedSlug,
			title,
			image: featuredImage,
			content
		}
	};
};
