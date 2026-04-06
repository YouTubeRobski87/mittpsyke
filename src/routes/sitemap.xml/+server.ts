import { guides, pillars } from '$lib/seo-kit/content';
import { canonical } from '$lib/seo-kit/seo';
import { tools } from '$lib/data/seo-architecture';
import { seoSupportPagePaths } from '$lib/data/seo-support-pages';
import type { RequestHandler } from './$types';

const STATIC_CONTENT_LASTMOD = '2026-03-29';
const SEO_SUPPORT_LASTMOD = '2026-04-04';
const GUIDE_FALLBACK_LASTMOD = '2026-03-14';
const TOOL_LASTMOD = '2026-03-29';
const BLOG_LASTMOD = '2026-03-29';
const LEGAL_LASTMOD = '2026-03-22';
const KBT_LASTMOD = '2026-03-21';

type SitemapEntry = {
	path: string;
	lastmod: string;
	changefreq: 'weekly' | 'monthly' | 'yearly';
	priority: '1.0' | '0.9' | '0.8' | '0.7' | '0.6' | '0.5' | '0.3';
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

export const GET: RequestHandler = async () => {
	const standalonePages: SitemapEntry[] = [
		{ path: '/', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'weekly', priority: '1.0' },
		{ path: '/chat', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'weekly', priority: '0.9' },
		{ path: '/chat/a', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'weekly', priority: '0.8' },
		{ path: '/chat/b', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'weekly', priority: '0.8' },
		{ path: '/chat/e', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'weekly', priority: '0.8' },
		{ path: '/dagbok', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'weekly', priority: '0.9' },
		{ path: '/guider', lastmod: latestGuideLastmod, changefreq: 'weekly', priority: '0.8' },
		{ path: '/ovningar', lastmod: TOOL_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/blogg', lastmod: BLOG_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{ path: '/om-mittpsyke', lastmod: STATIC_CONTENT_LASTMOD, changefreq: 'monthly', priority: '0.5' },
		{ path: '/ansvar', lastmod: LEGAL_LASTMOD, changefreq: 'yearly', priority: '0.3' },
		{ path: '/integritet', lastmod: LEGAL_LASTMOD, changefreq: 'yearly', priority: '0.3' },
		{ path: '/sa-arbetar-vi-med-innehall', lastmod: LEGAL_LASTMOD, changefreq: 'yearly', priority: '0.3' },
		{
			path: '/4-7-8-andning-ovning',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/ai-samtalsstod-online',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/andningsovningar-mot-angest',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/anonym-dagbok-online',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/digital-dagbok-for-maende',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/exponering-ovningar-mot-angest',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/hjalp-vid-angest-online',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.7'
		},
		{
			path: '/humorsparning',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		},
		{
			path: '/journalforing',
			lastmod: STATIC_CONTENT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		},
		{ path: '/angest', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.8' },
		{
			path: '/depression',
			lastmod: GUIDE_FALLBACK_LASTMOD,
			changefreq: 'weekly',
			priority: '0.8'
		},
		{ path: '/ensamhet', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{ path: '/kbt', lastmod: KBT_LASTMOD, changefreq: 'monthly', priority: '0.7' },
		{
			path: '/nedstamdhet',
			lastmod: GUIDE_FALLBACK_LASTMOD,
			changefreq: 'weekly',
			priority: '0.7'
		},
		{ path: '/oro', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{
			path: '/panikattack',
			lastmod: GUIDE_FALLBACK_LASTMOD,
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/sjalvkansla',
			lastmod: GUIDE_FALLBACK_LASTMOD,
			changefreq: 'weekly',
			priority: '0.7'
		},
		{
			path: '/sovproblem',
			lastmod: GUIDE_FALLBACK_LASTMOD,
			changefreq: 'weekly',
			priority: '0.7'
		},
		{ path: '/stress', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{ path: '/trauma', lastmod: GUIDE_FALLBACK_LASTMOD, changefreq: 'weekly', priority: '0.7' },
		{
			path: '/samtalsstod-utan-vantetid/samtalsstod-vid-trauma',
			lastmod: SEO_SUPPORT_LASTMOD,
			changefreq: 'monthly',
			priority: '0.6'
		}
	];

	const seoSupportEntries: SitemapEntry[] = seoSupportPagePaths.map((path) => ({
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

	const guiderSeoPillarPages: SitemapEntry[] = pillars.map((pillar) => ({
		path: `/guider-seo/${pillar.slug}`,
		lastmod: getPillarLastmod(pillar.slug),
		changefreq: 'weekly',
		priority: '0.8'
	}));

	const guiderSeoGuidePages: SitemapEntry[] = guides.map((guide) => ({
		path: `/guider-seo/${guide.pillarSlug}/${guide.slug}`,
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

	const blogPages: SitemapEntry[] = [
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

	const urls = dedupeEntries([
		...standalonePages,
		...seoSupportEntries,
		...guidePillarPages,
		...guidePages,
		...guiderSeoPillarPages,
		...guiderSeoGuidePages,
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
