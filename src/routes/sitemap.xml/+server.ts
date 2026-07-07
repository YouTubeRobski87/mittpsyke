import { guides, pillars } from '$lib/seo-kit/content';
import { canonical } from '$lib/seo-kit/seo';
import { tools } from '$lib/data/seo-architecture';
import { portals } from '$lib/data/portals';
import { seoSupportPagePaths } from '$lib/data/seo-support-pages';
import { SORO_EMBED_SRC } from '$lib/soro';
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

const SITEMAP_REDIRECT_REPLACEMENTS: Record<string, string> = {
	'/blogg/nar-soka-vard-for-psykiskt-maende': '/ansvar',
	'/blogg/anonym-hjalp-for-oro': '/hjalp-mot-oro-online',
	'/blogg/integritet-i-appar-for-mental-halsa': '/blogg/säkra-maendedata-tjanster'
};

function replaceRedirectedSitemapPath(path: string): string {
	return SITEMAP_REDIRECT_REPLACEMENTS[path] ?? path;
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
		{ path: '/', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'weekly', priority: '1.0' },
		{ path: '/dagbok', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'weekly', priority: '0.9' },
		{
			path: '/anonyma-berattelser',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		},
		{ path: '/guider', lastmod: latestGuideLastmod, changefreq: 'weekly', priority: '0.8' },
		{ path: '/ovningar', lastmod: TOOL_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/blogg', lastmod: BLOG_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/om-mittpsyke', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.5' },
		{ path: '/om-skaparen', lastmod: CREATOR_LASTMOD, changefreq: 'monthly', priority: '0.5' },
		{ path: '/premium', lastmod: PREMIUM_LASTMOD, changefreq: 'monthly', priority: '0.5' },
		{ path: '/feedback', lastmod: FEEDBACK_LASTMOD, changefreq: 'monthly', priority: '0.5' },
		{ path: '/ansvar', lastmod: LEGAL_LASTMOD, changefreq: 'yearly', priority: '0.3' },
		{ path: '/integritet', lastmod: LEGAL_LASTMOD, changefreq: 'yearly', priority: '0.3' },
		{ path: '/redaktionell-metod', lastmod: LEGAL_LASTMOD, changefreq: 'yearly', priority: '0.3' },
		{ path: '/tillganglighet', lastmod: LEGAL_LASTMOD, changefreq: 'yearly', priority: '0.3' },
		{ path: '/skriv', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/4-7-8-andning-ovning', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.6' },
		{ path: '/ai-samtalsstod-online', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/andningsovningar-mot-angest', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.6' },
		{ path: '/anonym-dagbok-online', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/guider/anonym-dagbok-online', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/guider/dagbok-och-reflektion', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/digital-dagbok-for-maende', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/exponering-ovningar-mot-angest', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.6' },
		{ path: '/hjalp-vid-angest-online', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/humorsparning', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.6' },
		{ path: '/journalforing', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.6' },
		{ path: '/angest', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.8' },
		{ path: '/depression', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.8' },
		{ path: '/ensamhet', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{ path: '/nedstamdhet', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{ path: '/oro', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{ path: '/panikattack', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{ path: '/sjalvkansla', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{ path: '/sovproblem', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{ path: '/stress', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{ path: '/trauma', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{
			path: '/samtalsstod-utan-vantetid/samtalsstod-vid-trauma',
			lastmod: SEO_SUPPORT_LASTMOD,
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

	const portalPages: SitemapEntry[] = portals.map((portal) => ({
		path: `/portal/${portal.key}`,
		lastmod: STATIC_CONTENT_LASTMOD,
		changefreq: 'monthly',
		priority: '0.5'
	}));

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

	const blogPages = [...fallbackBlogPages, ...(await loadSoroBlogEntries(fetch))];

	const urls = dedupeEntries([
		...standalonePages,
		...seoSupportEntries,
		...guidePillarPages,
		...guidePages,
		...toolPages,
		...portalPages,
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