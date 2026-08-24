#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SITE_ORIGIN = 'https://mittpsyke.se';
const BLOG_PREFIX = `${SITE_ORIGIN}/blogg/`;
const BLOG_ROUTES_DIR = path.join(process.cwd(), 'src', 'routes', 'blogg');
const SORO_TOKEN = '9a08468b-7239-4e08-bd5f-5bf59e87b3f7';
const SORO_EMBED_SRC = `https://app.trysoro.com/api/embed/${SORO_TOKEN}?theme=dark`;
const REPORT_PATH = path.join(process.cwd(), 'indexering-blogg-rapport.md');
const FALLBACK_STATIC_TITLES = new Map([
	['ai-hjalper-dig-bearbeta-kanslor', 'AI hjalper dig bearbeta kanslor'],
	['kbt-dagbok-vs-fri-journalforing', 'KBT-dagbok vs fri journalforing'],
	['vad-ar-journalterapi', 'Vad ar journalterapi']
]);

function normalizeUrl(value) {
	try {
		const url = new URL(value, SITE_ORIGIN);
		url.hash = '';
		url.search = '';
		url.pathname = url.pathname.replace(/\/+$/, '');
		return url.toString();
	} catch {
		return value.replace(/\/+$/, '');
	}
}

function normalizeSlug(value) {
	try {
		const decoded = decodeURIComponent(value ?? '');
		const url = decoded.startsWith('http') ? new URL(decoded) : null;
		const pathname = (url?.pathname ?? decoded).replace(/^\/+|\/+$/g, '');
		return (pathname.startsWith('blogg/') ? pathname.slice('blogg/'.length) : pathname).toLowerCase();
	} catch {
		const pathname = String(value ?? '').replace(/^\/+|\/+$/g, '');
		return (pathname.startsWith('blogg/') ? pathname.slice('blogg/'.length) : pathname).toLowerCase();
	}
}

function asString(value) {
	return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function titleFromSlug(slug) {
	return slug
		.split('-')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function extractTitleFromSvelte(source, slug) {
	const titleMatch = source.match(/<title>\s*([^<{|]+)/i);
	if (titleMatch?.[1]) return titleMatch[1].trim();

	const h1Match = source.match(/<h1[^>]*>\s*([^<{]+)/i);
	if (h1Match?.[1]) return h1Match[1].trim();

	const constTitleMatch = source.match(/const\s+title\s*=\s*['"`]([^'"`]+)['"`]/i);
	if (constTitleMatch?.[1]) return constTitleMatch[1].trim();

	return FALLBACK_STATIC_TITLES.get(slug) ?? titleFromSlug(slug);
}

async function readStaticBlogArticles() {
	const entries = await readdir(BLOG_ROUTES_DIR, { withFileTypes: true });
	const articles = [];

	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name.startsWith('[')) continue;

		const slug = normalizeSlug(entry.name);
		if (!slug) continue;

		let title = FALLBACK_STATIC_TITLES.get(slug) ?? titleFromSlug(slug);
		try {
			const pagePath = path.join(BLOG_ROUTES_DIR, entry.name, '+page.svelte');
			title = extractTitleFromSvelte(await readFile(pagePath, 'utf8'), slug);
		} catch {
			// Keep the slug-derived fallback title when a static route has no page file.
		}

		articles.push({
			source: 'static route',
			title,
			slug,
			url: `${BLOG_PREFIX}${slug}`
		});
	}

	return articles;
}

function extractSoroArticles(embedScript) {
	const match = embedScript.match(/var SORO_ARTICLES = (\[[\s\S]*?\]);/);
	if (!match) return [];

	try {
		const parsed = JSON.parse(match[1]);
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map((article) => {
				const slug = normalizeSlug(asString(article.slug));
				if (!slug) return null;

				return {
					source: 'Soro',
					title: asString(article.title) || titleFromSlug(slug),
					slug,
					url: `${BLOG_PREFIX}${slug}`
				};
			})
			.filter(Boolean);
	} catch {
		return [];
	}
}

async function fetchSoroArticles() {
	const response = await fetch(`${SORO_EMBED_SRC}&cb=${Date.now()}`, {
		headers: {
			accept: 'application/javascript,*/*',
			'user-agent': 'MittPsyke indexing check'
		}
	});

	if (!response.ok) {
		throw new Error(`Soro svarade ${response.status}`);
	}

	return extractSoroArticles(await response.text());
}

function dedupeArticles(articles) {
	const byUrl = new Map();

	for (const article of articles) {
		const normalizedUrl = normalizeUrl(article.url);
		const existing = byUrl.get(normalizedUrl);
		if (!existing) {
			byUrl.set(normalizedUrl, { ...article, url: normalizedUrl });
			continue;
		}

		if (existing.source !== article.source) {
			existing.source = `${existing.source}, ${article.source}`;
		}
		if (!existing.title && article.title) existing.title = article.title;
	}

	return [...byUrl.values()].sort((left, right) => left.url.localeCompare(right.url, 'sv'));
}

async function fetchSitemapUrls() {
	const response = await fetch(`${SITE_ORIGIN}/sitemap.xml`, {
		headers: { 'user-agent': 'MittPsyke indexing check' }
	});

	if (!response.ok) {
		throw new Error(`Sitemap svarade ${response.status}`);
	}

	const xml = await response.text();
	return new Set(
		[...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
			.map((match) => match[1].trim())
			.filter((url) => url.startsWith(BLOG_PREFIX))
			.map(normalizeUrl)
	);
}

function extractCanonical(html, pageUrl) {
	const match = html.match(/<link\b[^>]*rel=["'][^"']*\bcanonical\b[^"']*["'][^>]*>/i);
	if (!match) return '';

	const href = match[0].match(/\bhref=["']([^"']+)["']/i)?.[1];
	return href ? normalizeUrl(new URL(href, pageUrl).toString()) : '';
}

async function inspectTechnical(article, sitemapUrls) {
	const response = await fetch(article.url, {
		redirect: 'manual',
		headers: { 'user-agent': 'MittPsyke indexing check' }
	});

	const status = response.status;
	const location = response.headers.get('location');
	const redirected = status >= 300 && status < 400;
	const redirectTarget = location ? normalizeUrl(new URL(location, article.url).toString()) : '';
	const inSitemap = sitemapUrls.has(normalizeUrl(article.url));
	let canonical = '';

	if (status === 200) {
		canonical = extractCanonical(await response.text(), article.url);
	}

	const assessments = [];
	if (redirected) assessments.push('Redirect');
	if (status === 404) assessments.push('404');
	if (canonical && canonical !== normalizeUrl(article.url)) assessments.push('Canonical mismatch');
	if (!inSitemap) assessments.push('Saknas i sitemap');
	if (!assessments.length && status === 200) assessments.push('OK');
	if (!assessments.length) assessments.push(`HTTP ${status}`);

	return {
		...article,
		status,
		redirectTarget,
		canonical,
		inSitemap,
		assessment: assessments.join(', ')
	};
}

function findPotentialDuplicateSlugs(articles) {
	const warnings = new Map();

	for (const article of articles) {
		warnings.set(article.url, []);
	}

	for (const left of articles) {
		for (const right of articles) {
			if (left.url === right.url) continue;

			if (left.slug.startsWith(`${right.slug}-`) || right.slug.startsWith(`${left.slug}-`)) {
				warnings.get(left.url).push(`Mojlig slug-dubblett: ${right.slug}`);
			}
		}
	}

	return warnings;
}

function getSearchConsoleConfig() {
	const accessToken =
		process.env.GSC_ACCESS_TOKEN ?? process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN ?? '';
	const siteUrl = process.env.GSC_SITE_URL ?? process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ?? SITE_ORIGIN;

	return accessToken ? { accessToken, siteUrl } : null;
}

async function inspectWithSearchConsole(url, config) {
	const response = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
		method: 'POST',
		headers: {
			authorization: `Bearer ${config.accessToken}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			inspectionUrl: url,
			siteUrl: config.siteUrl,
			languageCode: 'sv-SE'
		})
	});

	if (!response.ok) {
		return { error: `GSC ${response.status}: ${await response.text()}` };
	}

	const payload = await response.json();
	const indexStatus = payload.inspectionResult?.indexStatusResult ?? {};

	return {
		coverageState: indexStatus.coverageState ?? '',
		userCanonical: indexStatus.userCanonical ?? '',
		googleCanonical: indexStatus.googleCanonical ?? '',
		lastCrawlTime: indexStatus.lastCrawlTime ?? '',
		pageFetchState: indexStatus.pageFetchState ?? '',
		robotsTxtState: indexStatus.robotsTxtState ?? '',
		indexingState: indexStatus.indexingState ?? ''
	};
}

function escapeMarkdown(value) {
	return String(value ?? '')
		.replaceAll('|', '\\|')
		.replaceAll('\n', ' ')
		.trim();
}

function renderMarkdownReport({ rows, duplicateWarnings, searchConsoleEnabled }) {
	const generatedAt = new Date().toISOString();
	const lines = [
		'# Indexering blogg rapport',
		'',
		`Genererad: ${generatedAt}`,
		'',
		searchConsoleEnabled
			? 'Google Search Console URL Inspection API anvandes via befintlig access token.'
			: 'Google Search Console URL Inspection API ar inte konfigurerat i projektet. Faktisk Google-indexering kan darfor inte kontrolleras direkt fran koden i denna korning.',
		'',
		'## Sammanfattning',
		'',
		`- Totalt kontrollerade artiklar: ${rows.length}`,
		`- Tekniskt OK: ${rows.filter((row) => row.assessment === 'OK').length}`,
		`- Redirect: ${rows.filter((row) => row.assessment.includes('Redirect')).length}`,
		`- 404: ${rows.filter((row) => row.assessment.includes('404')).length}`,
		`- Canonical mismatch: ${rows.filter((row) => row.assessment.includes('Canonical mismatch')).length}`,
		`- Saknas i sitemap: ${rows.filter((row) => row.assessment.includes('Saknas i sitemap')).length}`,
		'',
		'## Teknisk rapport',
		'',
		'| Titel | URL | HTTP-status | Canonical | Finns i sitemap | Teknisk bedomning |',
		'| --- | --- | --- | --- | --- | --- |'
	];

	for (const row of rows) {
		lines.push(
			`| ${escapeMarkdown(row.title)} | ${escapeMarkdown(row.url)} | ${escapeMarkdown(row.status)} | ${escapeMarkdown(row.canonical || row.redirectTarget || '-')} | ${row.inSitemap ? 'ja' : 'nej'} | ${escapeMarkdown(row.assessment)} |`
		);
	}

	if (searchConsoleEnabled) {
		lines.push(
			'',
			'## Google Search Console',
			'',
			'| URL | coverageState | userCanonical | googleCanonical | lastCrawlTime | pageFetchState | robotsTxtState | indexingState |',
			'| --- | --- | --- | --- | --- | --- | --- | --- |'
		);

		for (const row of rows) {
			const gsc = row.googleInspection ?? {};
			lines.push(
				`| ${escapeMarkdown(row.url)} | ${escapeMarkdown(gsc.coverageState ?? gsc.error ?? '')} | ${escapeMarkdown(gsc.userCanonical ?? '')} | ${escapeMarkdown(gsc.googleCanonical ?? '')} | ${escapeMarkdown(gsc.lastCrawlTime ?? '')} | ${escapeMarkdown(gsc.pageFetchState ?? '')} | ${escapeMarkdown(gsc.robotsTxtState ?? '')} | ${escapeMarkdown(gsc.indexingState ?? '')} |`
			);
		}
	} else {
		lines.push(
			'',
			'## Manuell kontroll i Search Console',
			'',
			'1. Oppna Google Search Console for egendomen `https://mittpsyke.se/`.',
			'2. Anvand URL-inspektion for URL:erna i tabellen ovan.',
			'3. Jamfor Googles valda canonical med sidans canonical och sitemap-statusen i rapporten.',
			'4. For API-korning kan en befintlig OAuth access token sattas som `GSC_ACCESS_TOKEN` och egendomen som `GSC_SITE_URL`.'
		);
	}

	const flaggedRows = rows.filter((row) => {
		const duplicateFlags = duplicateWarnings.get(row.url) ?? [];
		const gsc = row.googleInspection ?? {};
		return (
			row.assessment !== 'OK' ||
			duplicateFlags.length > 0 ||
			(gsc.googleCanonical && gsc.userCanonical && normalizeUrl(gsc.googleCanonical) !== normalizeUrl(gsc.userCanonical))
		);
	});

	lines.push('', '## Extra flaggor', '');
	if (!flaggedRows.length) {
		lines.push('Inga extra flaggor hittades.');
	} else {
		for (const row of flaggedRows) {
			const flags = [row.assessment === 'OK' ? '' : row.assessment, ...(duplicateWarnings.get(row.url) ?? [])]
				.filter(Boolean)
				.join('; ');
			lines.push(`- ${row.url}: ${flags}`);
		}
	}

	return `${lines.join('\n')}\n`;
}

function printTerminalReport(rows, duplicateWarnings, searchConsoleEnabled) {
	console.log('\nMittPsyke bloggindexering - teknisk kontroll\n');
	console.table(
		rows.map((row) => ({
			Titel: row.title,
			URL: row.url,
			'HTTP-status': row.status,
			Canonical: row.canonical || row.redirectTarget || '-',
			'Finns i sitemap': row.inSitemap ? 'ja' : 'nej',
			'Teknisk bedomning': row.assessment
		}))
	);

	if (!searchConsoleEnabled) {
		console.log(
			'\nGoogle Search Console API ar inte konfigurerat. Faktisk Google-indexering kontrollerades inte.'
		);
	}

	const duplicateRows = rows
		.map((row) => ({ url: row.url, warnings: duplicateWarnings.get(row.url) ?? [] }))
		.filter((row) => row.warnings.length > 0);

	if (duplicateRows.length) {
		console.log('\nMojliga slug-dubbletter:');
		for (const row of duplicateRows) {
			console.log(`- ${row.url}: ${row.warnings.join('; ')}`);
		}
	}
}

async function main() {
	const staticArticles = await readStaticBlogArticles();
	let soroArticles = [];

	try {
		soroArticles = await fetchSoroArticles();
	} catch (error) {
		console.warn(`Kunde inte hamta Soro-artiklar: ${error.message}`);
	}

	const articles = dedupeArticles([...staticArticles, ...soroArticles]).filter((article) =>
		article.url.startsWith(BLOG_PREFIX)
	);
	const sitemapUrls = await fetchSitemapUrls();
	const rows = [];

	for (const article of articles) {
		rows.push(await inspectTechnical(article, sitemapUrls));
	}

	const searchConsoleConfig = getSearchConsoleConfig();
	if (searchConsoleConfig) {
		for (const row of rows) {
			row.googleInspection = await inspectWithSearchConsole(row.url, searchConsoleConfig);
		}
	}

	const duplicateWarnings = findPotentialDuplicateSlugs(rows);
	const markdown = renderMarkdownReport({
		rows,
		duplicateWarnings,
		searchConsoleEnabled: Boolean(searchConsoleConfig)
	});

	await writeFile(REPORT_PATH, markdown, 'utf8');
	printTerminalReport(rows, duplicateWarnings, Boolean(searchConsoleConfig));
	console.log(`\nRapport sparad: ${REPORT_PATH}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
