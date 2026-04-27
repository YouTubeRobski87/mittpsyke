import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const SORO_TOKEN = '7741c36b-abe9-4f95-8557-3430345576e4';
const SORO_EMBED_SRC = `https://app.trysoro.com/api/embed/${SORO_TOKEN}?theme=dark`;

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

const HUMOR_TRACKING_SLUG = 'humorsparning-app-psykisk-halsa';

function normalizeSlug(value: string) {
	try {
		const decoded = decodeURIComponent(value);
		const url = decoded.startsWith('http') ? new URL(decoded) : null;
		const path = (url?.pathname ?? decoded).replace(/^\/+|\/+$/g, '');
		return path.startsWith('blogg/') ? path.slice('blogg/'.length) : path;
	} catch {
		const path = value.replace(/^\/+|\/+$/g, '');
		return path.startsWith('blogg/') ? path.slice('blogg/'.length) : path;
	}
}

function extractArticles(embedScript: string) {
	const match = embedScript.match(/var SORO_ARTICLES = (\[[\s\S]*?\]);/);
	if (!match) return [];
	return JSON.parse(match[1]) as SoroArticleListItem[];
}

function enhanceHumorTrackingArticle(content: string) {
	return content
		.replace(
			'</p>\n<p>Det låter enkelt att "följa sitt mående"',
			'</p>\n<p>Du behöver inte börja perfekt. En enkel notering räcker.</p>\n<p>Det låter enkelt att "följa sitt mående"'
		)
		.replace(
			'Du behöver inte formulera en lång dagboksanteckning varje gång.',
			'Du behöver inte <a href="/dagbok">skriva dagbok online</a> i långa pass varje gång.'
		)
		.replace(
			'Det här är inte behandling och det ersätter inte professionell hjälp när sådan behövs.',
			'Det här är inte behandling och det ersätter inte professionell hjälp när sådan behövs. Om du vill läsa mer om <a href="/ansvar">när en app inte räcker</a> finns det stöd att ta vidare.'
		)
		.replace(
			'För många är integritet avgörande.',
			'För många är integritet avgörande, särskilt om du vill <a href="/skriv">skriva av dig anonymt</a> först.'
		)
		.replace(
			'MittPsyke är ett exempel på en sådan väg in, där du kan börja i lugn takt med textbaserad reflektion, humörspårning och egna anteckningar utan att göra det större än det behöver vara.',
			'MittPsyke är byggt just för detta. Här kan du börja anonymt i text, följa ditt mående över tid och kombinera humörspårning med egna reflektioner — utan att göra det mer avancerat än det behöver vara. Om du vill kan du också läsa fler <a href="/guider">guider</a> i lugn takt.'
		)
		.concat(
			'\n<h2>Vill du testa själv?</h2>\n<p>Du kan börja direkt utan konto och skriva av dig i lugn takt.</p>\n<p><a href="/skriv">Börja skriva anonymt</a></p>'
		);
}

export const load: PageServerLoad = async ({ fetch, params }) => {
	const requestedSlug = normalizeSlug(params.slug).toLowerCase();
	const embedResponse = await fetch(`${SORO_EMBED_SRC}&cb=${Date.now()}`, {
		headers: {
			accept: 'application/javascript,*/*',
			'user-agent': 'Mozilla/5.0'
		}
	});

	if (!embedResponse.ok) {
		throw error(502, 'Kunde inte hämta artikeln just nu.');
	}

	const embedScript = await embedResponse.text();
	const articles = extractArticles(embedScript);
	const article = articles.find((item) => normalizeSlug(item.slug).toLowerCase() === requestedSlug);

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

	const articleSlug = normalizeSlug(article.slug).toLowerCase();
	const content =
		articleSlug === HUMOR_TRACKING_SLUG
			? enhanceHumorTrackingArticle(contentPayload.content)
			: contentPayload.content;

	return {
		article: {
			...article,
			slug: normalizeSlug(article.slug),
			content
		}
	};
};
