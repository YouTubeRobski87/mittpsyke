import { error, redirect } from '@sveltejs/kit';
import { SORO_TOKEN } from '$lib/soro';
import { canonicalUrl } from '$lib/seo';
import { legacyBlogRedirects } from '$lib/server/legacy-redirects';
import { fetchSoroArticles, fetchSoroResponse, normalizeSoroArticleSlug } from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
const LOCAL_FEATURED_IMAGE_BY_SLUG = new Map([['ai-dagbok', '/storify-og-image.png']]);
// SEO-cannibalization-fix (2026-08): artikelns title/H1/ingress fick tidigare Soro-artikelns
// standardvärden, vilket gjorde att title/H1 blev identiska med /chatta-anonymt. Lokala
// overrides gör artikeln tydligt informativ i stället för en andra transaktionell landningssida.
const LOCAL_TITLE_BY_SLUG = new Map([['chatta-anonymt-utan-konto', 'Chatta anonymt utan konto – vad du bör tänka på']]);
const LOCAL_EXCERPT_BY_SLUG = new Map([
	[
		'chatta-anonymt-utan-konto',
		'Vad innebär det att chatta anonymt utan konto? Här får du veta vad du bör tänka på, när det kan passa och hur du kommer igång i din egen takt.'
	]
]);

type SoroArticleContentResponse = {
	content?: string;
};

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
	return path.startsWith('http') ? path : `https://mittpsyke.se${path}`;
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

export const load: PageServerLoad = async ({ fetch, params, setHeaders }) => {
	const requestedSlug = normalizeSoroArticleSlug(params.slug);
	const legacyTarget = legacyBlogRedirects[`/blogg/${requestedSlug}`];
	if (legacyTarget) throw redirect(301, legacyTarget);

	let soroResult = await fetchSoroArticles(fetch);
	let articles = soroResult.articles;
	if (soroResult.loadError) {
		console.error('[blogg/article] Unable to load article list', {
			slug: requestedSlug,
			reason: 'soro_embed',
			classification: soroResult.errorReason
		});
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}
	let article = articles.find((item) => normalizeSoroArticleSlug(item.slug) === requestedSlug);

	if (!article) {
		soroResult = await fetchSoroArticles(fetch, true);
		articles = soroResult.articles;
		if (soroResult.loadError) {
			console.error('[blogg/article] Unable to refresh article list', {
				slug: requestedSlug,
				reason: 'soro_embed',
				classification: soroResult.errorReason
			});
			throw error(502, 'Kunde inte hämta artikeln just nu.');
		}
		article = articles.find((item) => normalizeSoroArticleSlug(item.slug) === requestedSlug);
	}

	if (!article) {
		throw error(404, 'Artikeln kunde inte hittas.');
	}

	const contentRequest = await fetchSoroResponse(
		fetch,
		`https://app.trysoro.com/api/embed/${SORO_TOKEN}/article/${article.id}`,
		{
			headers: {
				accept: 'application/json,*/*',
				'user-agent': 'Mozilla/5.0'
			}
		}
	);

	if (!contentRequest.response) {
		console.error('[blogg/article] Unable to load article content', {
			slug: requestedSlug,
			status: contentRequest.status ?? null,
			classification: contentRequest.failure
		});
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}
	const contentResponse = contentRequest.response;

	let contentPayload: SoroArticleContentResponse;
	try {
		contentPayload = (await contentResponse.json()) as SoroArticleContentResponse;
	} catch (cause) {
		console.error('[blogg/article] Invalid article content response', {
			slug: requestedSlug,
			reason: cause instanceof Error ? cause.name : 'invalid_json'
		});
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}

	if (typeof contentPayload.content !== 'string' || !contentPayload.content.trim()) {
		console.error('[blogg/article] Invalid article content payload', {
			slug: requestedSlug,
			reason: 'missing_content'
		});
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}

	setHeaders({
		'cache-control': CACHE_CONTROL
	});

	const normalizedSlug = normalizeSoroArticleSlug(article.slug);
	const title = LOCAL_TITLE_BY_SLUG.get(normalizedSlug) ?? (article.title || 'Artikel');
	const excerpt = LOCAL_EXCERPT_BY_SLUG.get(normalizedSlug) ?? article.excerpt;
	const content = fixProtocolLessLinks(
		stripLeadingH1(
			normalizedSlug === 'psykisk-ohalsa-unga'
				? normalizeYoungMentalHealthArticleContent(contentPayload.content)
				: contentPayload.content
		)
	);

	const featuredImage = LOCAL_FEATURED_IMAGE_BY_SLUG.get(normalizedSlug) ?? article.imageUrl;
	const ogImage = featuredImage
		? toAbsoluteUrl(featuredImage)
		: 'https://mittpsyke.se/og-image.png';

	return {
		title,
		description: excerpt,
		canonical: canonicalUrl(`/blogg/${normalizedSlug}`),
		ogType: 'article',
		ogImage,
		article: {
			...article,
			slug: normalizedSlug,
			title,
			excerpt,
			image: featuredImage,
			content
		}
	};
};
