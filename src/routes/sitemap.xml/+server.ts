import { guides, pillars } from '$lib/seo-kit/content';
import { canonical } from '$lib/seo-kit/seo';
import { tools } from '$lib/data/seo-architecture';
import type { RequestHandler } from './$types';

// Den dynamiska route-versionen är källan för sitemap.xml.
const LASTMOD = '2026-03-29';

type SitemapEntry = {
	path: string;
	changefreq: 'weekly' | 'monthly' | 'yearly';
	priority: '1.0' | '0.9' | '0.7' | '0.5';
};

function xmlEscape(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function renderUrl({ path, changefreq, priority }: SitemapEntry, lastmod: string): string {
	return `<url><loc>${xmlEscape(canonical(path))}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export const GET: RequestHandler = async () => {
	const staticPages: SitemapEntry[] = [
		{ path: '/', changefreq: 'yearly', priority: '1.0' },
		{ path: '/om', changefreq: 'yearly', priority: '0.5' },
		{ path: '/kontakt', changefreq: 'yearly', priority: '0.5' },
		{ path: '/faq', changefreq: 'yearly', priority: '0.5' },
		{ path: '/guider', changefreq: 'yearly', priority: '0.5' },
		{ path: '/ovningar', changefreq: 'yearly', priority: '0.5' }
	];

	const pillarPages: SitemapEntry[] = pillars.map((pillar) => ({
		path: `/guider/${pillar.slug}`,
		changefreq: 'weekly',
		priority: '0.9'
	}));

	const clusterPages: SitemapEntry[] = guides.map((guide) => ({
		path: `/guider/${guide.pillarSlug}/${guide.slug}`,
		changefreq: 'monthly',
		priority: '0.7'
	}));

	const toolPages: SitemapEntry[] = tools.map((tool) => ({
		path: `/ovningar/${tool.slug}`,
		changefreq: 'monthly',
		priority: '0.7'
	}));

	const urls = [...staticPages, ...pillarPages, ...clusterPages, ...toolPages]
		.map((entry) => renderUrl(entry, LASTMOD))
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
};
