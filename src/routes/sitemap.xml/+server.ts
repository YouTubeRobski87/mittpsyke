import { guides, pillars } from '$lib/seo-kit/content';
import { canonical } from '$lib/seo-kit/seo';
import { tools } from '$lib/data/seo-architecture';
import { seoSupportPagePaths } from '$lib/data/seo-support-pages';
import { SORO_EMBED_SRC } from '$lib/soro';
import { getArticleTopics, getPublishedArticles } from '$lib/server/article-content';
import { getContentLastmod } from '$lib/server/content-freshness';
import { replaceRedirectedSitemapPath } from '$lib/server/sitemap-redirects';
import type { RequestHandler } from './$types';

const STATIC_CONTENT_LASTMOD = '2026-03-29';
const SEO_SUPPORT_LASTMOD = '2026-04-04';
const GUIDE_FALLBACK_LASTMOD = '2026-03-14';
const TOOL_LASTMOD = '2026-03-29';
const BLOG_LASTMOD = '2026-03-29';
const LEGAL_LASTMOD = '2026-03-22';
const FEEDBACK_LASTMOD = '2026-04-13';
const PREMIUM_LASTMOD = '2026-06-10';
const CREATOR_LASTMOD = '2026-06-18';

type SitemapEntry = {
	path: string;
	lastmod: string;
	changefreq: 'weekly' | 'monthly' | 'yearly';
	priority: '1.0' | '0.9' | '0.8' | '0.7' | '0.6' | '0.5' | '0.3';
};

type SoroArticleListItem = {
	slug?: string;
	isoDate?: string;
	date?: string;
};

function xmlEscape(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function getLatestLastmod(values: Array<string | undefined>, fallback: string): string {
	const sortedValues = values.filter((value): value is string => Boolean(value)).sort();
	return sortedValues.at(-1) ?? fallback;
}

function normalizeBlogSlug(value: string): string {
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

function asLastmod(value: string | undefined): string {
	if (!value) return BLOG_LASTMOD;

	const parsed = new Date(value);
	if (!Number.isNaN(parsed.getTime())) {
		return parsed.toISOString().slice(0, 10);
	}

	return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : BLOG_LASTMOD;
}

function extractSoroArticles(embedScript: string): SoroArticleListItem[] {
	const match = embedScript.match(/var SORO_ARTICLES = (\[[\s\S]*?\]);/);
	if (!match) return [];

	try {
		const parsed = JSON.parse(match[1]) as unknown;
		return Array.isArray(parsed) ? (parsed as SoroArticleListItem[]) : [];
	} catch {
		return [];
	}
}

async function loadSoroBlogEntries(fetch: typeof globalThis.fetch): Promise<SitemapEntry[]> {
	try {
		const embedResponse = await fetch(`${SORO_EMBED_SRC}&cb=${Date.now()}`, {
			headers: {
				accept: 'application/javascript,*/*',
				'user-agent': 'Mozilla/5.0'
			}
		});

		if (!embedResponse.ok) return [];

		const embedScript = await embedResponse.text();

		return extractSoroArticles(embedScript)
			.map((article) => {
				const slug = normalizeBlogSlug(article.slug ?? '');
				if (!slug) return null;

				return {
					path: replaceRedirectedSitemapPath(`/blogg/${slug}`),
					lastmod: asLastmod(article.isoDate ?? article.date),
					changefreq: 'monthly',
					priority: '0.6'
				};
			})
			.filter((entry): entry is SitemapEntry => Boolean(entry));
	} catch {
		return [];
	}
}

const latestGuideLastmod = getLatestLastmod(
	guides.map((guide) => guide.updatedAt),
	GUIDE_FALLBACK_LASTMOD
);

function getPillarLastmod(pillarSlug: string): string {
	return getLatestLastmod(
		guides
			.filter((guide) => guide.pillarSlug === pillarSlug)
			.map((guide) => guide.updatedAt),
		latestGuideLastmod
	);
}

function renderUrl({ path, lastmod, changefreq, priority }: SitemapEntry): string {
	return [
		'<url>',
		`<loc>${xmlEscape(canonical(path))}</loc>`,
		`<lastmod>${lastmod}</lastmod>`,
		`<changefreq>${changefreq}</changefreq>`,
		`<priority>${priority}</priority>`,
		'</url>'
	].join('');
}

function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
	const uniqueEntries = new Map<string, SitemapEntry>();

	for (const entry of entries) {
		if (!uniqueEntries.has(entry.path)) {
			uniqueEntries.set(entry.path, entry);
		}
	}

	return [...uniqueEntries.values()].sort((left, right) => {
		if (left.path === '/') return -1;
		if (right.path === '/') return 1;
		return left.path.localeCompare(right.path, 'sv');
	});
}

export const GET: RequestHandler = async ({ fetch }) => {
	const standalonePages: SitemapEntry[] = [
		{
			path: '/',
			lastmod: getContentLastmod(
				['src/routes/+page.svelte', 'src/routes/+page.server.ts'],
				STATIC_CONTENT_LASTMOD
			),
			changefreq: 'weekly',
			priority: '1.0'
		},
		{
			path: '/dagbok',
			lastmod: getContentLastmod(
				['src/routes/dagbok/+page.svelte', 'src/routes/dagbok/+page.server.ts', 'src/routes/dagbok/+page.ts'],
				STATIC_CONTENT_LASTMOD
			),
			changefreq: 'weekly',
			priority: '0.9'
		},
		{
			path: '/anonyma-berattelser',
			lastmod: getContentLastmod(
				['src/routes/anonyma-berattelser/+page.svelte', 'src/routes/anonyma-berattelser/+page.server.ts'],
				STATIC_CONTENT_LASTMOD
			),
			changefreq: 'monthly',
			priority: '0.6'
		},
		{ path: '/guider', lastmod: latestGuideLastmod, changefreq: 'weekly', priority: '0.8' },
		{
			path: '/ovningar',
			lastmod: getContentLastmod('src/routes/ovningar/+page.svelte', TOOL_LASTMOD),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/blogg',
			lastmod: getContentLastmod(
				['src/routes/blogg/+page.svelte', 'src/routes/blogg/+page.server.ts'],
				BLOG_LASTMOD
			),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/om-mittpsyke',
			lastmod: getContentLastmod('src/routes/om-mittpsyke/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.5'
		},
		{
			path: '/for-organisationer',
			lastmod: getContentLastmod('src/routes/for-organisationer/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.5'
		},
		{
			path: '/om-skaparen',
			lastmod: getContentLastmod('src/routes/om-skaparen/+page.svelte', CREATOR_LASTMOD),
			changefreq: 'monthly',
			priority: '0.5'
		},
		{
			path: '/premium',
			lastmod: getContentLastmod(
				['src/routes/premium/+page.svelte', 'src/routes/premium/+page.ts'],
				PREMIUM_LASTMOD
			),
			changefreq: 'monthly',
			priority: '0.5'
		},
		{
			path: '/feedback',
			lastmod: getContentLastmod(
				['src/routes/feedback/+page.svelte', 'src/routes/feedback/+page.server.ts'],
				FEEDBACK_LASTMOD
			),
			changefreq: 'monthly',
			priority: '0.5'
		},
		{
			path: '/ansvar',
			lastmod: getContentLastmod('src/routes/ansvar/+page.svelte', LEGAL_LASTMOD),
			changefreq: 'yearly',
			priority: '0.3'
		},
		{
			path: '/integritet',
			lastmod: getContentLastmod('src/routes/integritet/+page.svelte', LEGAL_LASTMOD),
			changefreq: 'yearly',
			priority: '0.3'
		},
		{
			path: '/redaktionell-metod',
			lastmod: getContentLastmod('src/routes/redaktionell-metod/+page.svelte', LEGAL_LASTMOD),
			changefreq: 'yearly',
			priority: '0.3'
		},
		{
			path: '/ansvarsfull-ai',
			lastmod: getContentLastmod('src/routes/ansvarsfull-ai/+page.svelte', LEGAL_LASTMOD),
			changefreq: 'yearly',
			priority: '0.3'
		},
		{
			path: '/tillganglighet',
			lastmod: getContentLastmod('src/routes/tillganglighet/+page.svelte', LEGAL_LASTMOD),
			changefreq: 'yearly',
			priority: '0.3'
		},
		{
			path: '/skriv',
			lastmod: getContentLastmod('src/routes/skriv/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/4-7-8-andning-ovning',
			lastmod: getContentLastmod(
				['src/routes/4-7-8-andning-ovning/+page.svelte', 'src/routes/4-7-8-andning-ovning/+page.ts'],
				STATIC_CONTENT_LASTMOD
			),
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/ai-samtalsstod-online',
			lastmod: getContentLastmod('src/routes/ai-samtalsstod-online/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/andningsovningar-mot-angest',
			lastmod: getContentLastmod('src/routes/andningsovningar-mot-angest/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/anonym-dagbok-online',
			lastmod: getContentLastmod('src/routes/anonym-dagbok-online/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/guider/anonym-dagbok-online',
			lastmod: getContentLastmod('src/routes/guider/anonym-dagbok-online/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/guider/dagbok-och-reflektion',
			lastmod: getContentLastmod('src/routes/guider/dagbok-och-reflektion/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/digital-dagbok-for-maende',
			lastmod: getContentLastmod('src/routes/digital-dagbok-for-maende/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/exponering-ovningar-mot-angest',
			lastmod: getContentLastmod('src/routes/exponering-ovningar-mot-angest/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/hjalp-vid-angest-online',
			lastmod: getContentLastmod('src/routes/hjalp-vid-angest-online/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/humorsparning',
			lastmod: getContentLastmod('src/routes/humorsparning/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/journalforing',
			lastmod: getContentLastmod('src/routes/journalforing/+page.svelte', STATIC_CONTENT_LASTMOD),
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/angest',
			lastmod: getContentLastmod(
				['src/routes/angest/+page.svelte', 'src/routes/angest/+page.server.ts'],
				GUIDE_FALLBACK_LASTMOD
			),
			changefreq: 'weekly',
			priority: '0.8'
		},
		{
			path: '/depression',
			lastmod: getContentLastmod('src/routes/depression/+page.svelte', GUIDE_FALLBACK_LASTMOD),
			changefreq: 'weekly',
			priority: '0.8'
		},
		{
			path: '/ensamhet',
			lastmod: getContentLastmod('src/routes/ensamhet/+page.svelte', GUIDE_FALLBACK_LASTMOD),
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/nar-familjen-ar-i-kris',
			lastmod: getContentLastmod(
				'src/routes/nar-familjen-ar-i-kris/+page.svelte',
				STATIC_CONTENT_LASTMOD
			),
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/nedstamdhet',
			lastmod: getContentLastmod('src/routes/nedstamdhet/+page.svelte', GUIDE_FALLBACK_LASTMOD),
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/oro',
			lastmod: getContentLastmod('src/routes/oro/+page.svelte', GUIDE_FALLBACK_LASTMOD),
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/panikattack',
			lastmod: getContentLastmod('src/routes/panikattack/+page.svelte', GUIDE_FALLBACK_LASTMOD),
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/sjalvkansla',
			lastmod: getContentLastmod('src/routes/sjalvkansla/+page.svelte', GUIDE_FALLBACK_LASTMOD),
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/sovproblem',
			lastmod: getContentLastmod('src/routes/sovproblem/+page.svelte', GUIDE_FALLBACK_LASTMOD),
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/stress',
			lastmod: getContentLastmod('src/routes/stress/+page.svelte', GUIDE_FALLBACK_LASTMOD),
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/trauma',
			lastmod: getContentLastmod('src/routes/trauma/+page.svelte', GUIDE_FALLBACK_LASTMOD),
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/samtalsstod-utan-vantetid/samtalsstod-vid-trauma',
			lastmod: getContentLastmod(
				'src/routes/samtalsstod-utan-vantetid/samtalsstod-vid-trauma/+page.svelte',
				SEO_SUPPORT_LASTMOD
			),
			changefreq: 'monthly',
			priority: '0.6'
		}
	];

	const seoSupportEntries: SitemapEntry[] = seoSupportPagePaths
		.filter((path) => path !== '/anonym-chatt')
		.map((path) => ({
			path,
			lastmod: SEO_SUPPORT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.7'
		}));

	const guidePillarPages: SitemapEntry[] = pillars.map((pillar) => ({
		path: `/guider/${pillar.slug}`,
		lastmod: getPillarLastmod(pillar.slug),
		changefreq: 'weekly',
		priority: '0.8'
	}));

	const guidePages: SitemapEntry[] = guides.map((guide) => ({
		path: `/guider/${guide.pillarSlug}/${guide.slug}`,
		lastmod: guide.updatedAt ?? latestGuideLastmod,
		changefreq: 'monthly',
		priority: '0.7'
	}));

	const toolPages: SitemapEntry[] = tools.map((tool) => ({
		path: `/ovningar/${tool.slug}`,
		lastmod: TOOL_LASTMOD,
		changefreq: 'monthly',
		priority: '0.6'
	}));

	// /portal/a, /portal/b och /portal/e är tunna, ej länkade genomgångssidor
	// som bara skickar vidare till /chat/[category] (redan noindex). De är
	// medvetet uteslutna ur sitemapen och markerade noindex på sidan själv,
	// se src/routes/portal/[slug]/+page.svelte.

	const fallbackBlogPages: SitemapEntry[] = [
		{
			path: '/blogg/ai-hjalper-dig-bearbeta-kanslor',
			lastmod: BLOG_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/blogg/kbt-dagbok-vs-fri-journalforing',
			lastmod: BLOG_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/blogg/vad-ar-journalterapi',
			lastmod: BLOG_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		}
	];

	const markdownTopicPages: SitemapEntry[] = getArticleTopics().map((topic) => ({
		path: `/blogg/amne/${topic.slug}`,
		lastmod: BLOG_LASTMOD,
		changefreq: 'monthly',
		priority: '0.6'
	}));

	const markdownArticlePages: SitemapEntry[] = getPublishedArticles().map((article) => ({
		path: article.url,
		lastmod: (article.updated ?? article.date)?.toISOString().slice(0, 10) ?? BLOG_LASTMOD,
		changefreq: 'monthly',
		priority: '0.6'
	}));

	const blogPages = [
		...fallbackBlogPages,
		...markdownTopicPages,
		...markdownArticlePages,
		...(await loadSoroBlogEntries(fetch))
	];

	const urls = dedupeEntries([
		...standalonePages,
		...seoSupportEntries,
		...guidePillarPages,
		...guidePages,
		...toolPages,
		...blogPages
	])
		.map((entry) => renderUrl(entry))
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
};
