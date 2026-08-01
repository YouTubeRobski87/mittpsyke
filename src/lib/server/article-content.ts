import matter from 'gray-matter';
import { marked, type Tokens } from 'marked';
import { z } from 'zod';
import { getGuideBySlugs, getPillarBySlug } from '$lib/seo-kit/content';
import { getToolBySlug } from '$lib/data/seo-architecture';
import { getPortalByKey } from '$lib/data/portals';
import { CHAT_CATEGORY_TO_SLUG, CHAT_SLUG_TO_CATEGORY } from '$lib/data/chat-slugs';

const DEFAULT_ARTICLE_TITLE = 'Artikel';
const DEFAULT_ARTICLE_AUTHOR = 'MittPsyke';
const MISSING_DATE_LABEL = 'Datum saknas';

function getOptionalString(value: unknown, fallback = '') {
	return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getOptionalDate(value: unknown) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
	if (typeof value !== 'string' && typeof value !== 'number') return null;

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function getBoolean(value: unknown) {
	return value === true || value === 'true';
}

function getSafeArticleUrl(value: unknown) {
	const url = getOptionalString(value);
	if (!url) return null;
	if (url.startsWith('/') && !url.startsWith('//')) return url;

	try {
		const parsed = new URL(url);
		return ['http:', 'https:'].includes(parsed.protocol) ? url : null;
	} catch {
		return null;
	}
}

function getReferenceFromText(value: string) {
	const lines = value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	const url = lines.map(getSafeArticleUrl).find((candidate) => candidate !== null);
	if (!url) return null;

	const label = lines.find((line) => getSafeArticleUrl(line) === null) ?? url;
	return { label, url };
}

const articleSchema = z.object({
	title: z.preprocess((value) => getOptionalString(value, DEFAULT_ARTICLE_TITLE), z.string()),
	description: z.preprocess((value) => getOptionalString(value), z.string()),
	image: z.preprocess((value) => getOptionalString(value) || undefined, z.string().optional()),
	imageAlt: z.preprocess((value) => getOptionalString(value) || undefined, z.string().optional()),
	date: z.preprocess(getOptionalDate, z.date().nullable()),
	updated: z.preprocess(getOptionalDate, z.date().nullable()),
	author: z.preprocess((value) => getOptionalString(value, DEFAULT_ARTICLE_AUTHOR), z.string()),
	collection: z.string().min(1),
	tags: z.preprocess(
		(value) => (Array.isArray(value) ? value.map((tag) => getOptionalString(tag)).filter(Boolean) : []),
		z.array(z.string())
	),
	readingTime: z.preprocess((value) => getOptionalString(value) || undefined, z.string().optional()),
	faqs: z.preprocess(
		(value) => (Array.isArray(value) ? value : []),
		z.array(z.object({ question: z.unknown().optional(), answer: z.unknown().optional() }))
	).transform((faqs) =>
		faqs.flatMap((faq) => {
			const question = getOptionalString(faq.question);
			const answer = getOptionalString(faq.answer);
			return question && answer ? [{ question, answer }] : [];
		})
	),
	references: z
		.preprocess(
			(value) => (Array.isArray(value) ? value : []),
			z.array(z.union([z.string(), z.object({ label: z.unknown(), url: z.unknown() })]))
		)
		.transform((references) =>
			references.flatMap((reference) => {
				if (typeof reference === 'string') {
					const parsed = getReferenceFromText(reference);
					return parsed ? [parsed] : [];
				}

				const label = getOptionalString(reference.label);
				const url = getSafeArticleUrl(reference.url);
				return label && url ? [{ label, url }] : [];
			})
		),
	relatedArticles: z
		.preprocess(
			(value) => (Array.isArray(value) ? value : []),
			z.array(z.object({ title: z.unknown().optional(), url: z.unknown().optional() }))
		)
		.transform((relatedArticles) =>
			relatedArticles.flatMap((relatedArticle) => {
				const title = getOptionalString(relatedArticle.title);
				const url = getSafeArticleUrl(relatedArticle.url);
				return title && url ? [{ title, url }] : [];
			})
		),
	type: z.enum(['article', 'guide']).default('article'),
	draft: z.preprocess(getBoolean, z.boolean())
});

const articleTopicSchema = z.object({
	slug: z.string().min(1),
	label: z.string().min(1),
	description: z.string().min(1),
	icon: z.string(),
	color: z.string(),
	order: z.number().int()
});

export type Article = z.infer<typeof articleSchema> & {
	slug: string;
	url: string;
	body: string;
};

export type ArticleTopic = z.infer<typeof articleTopicSchema>;

const articleFiles = import.meta.glob('/src/content/articles/**/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

const topicFiles = import.meta.glob('/src/content/article-topics/*.json', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

function getArticlePathParts(path: string) {
	const relativePath = path.replace('/src/content/articles/', '');
	const parts = relativePath.split('/');
	const filename = parts.pop();
	const collection = parts.join('/');
	if (!filename || !collection || !filename.endsWith('.md')) {
		throw new Error(`Ogiltig sökväg för artikel: ${path}`);
	}

	return { collection, slug: filename.slice(0, -'.md'.length) };
}

function formatDate(date: Date) {
	return new Intl.DateTimeFormat('sv-SE', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(date);
}

export function getArticleTopics(): ArticleTopic[] {
	return Object.entries(topicFiles)
		.map(([path, raw]) => {
			try {
				return articleTopicSchema.parse(JSON.parse(raw));
			} catch (cause) {
				throw new Error(`Ogiltigt ämne i ${path}: ${cause instanceof Error ? cause.message : cause}`);
			}
		})
		.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'sv'));
}

export function parseArticleFrontmatter(data: unknown, collection: string) {
	const parsed = articleSchema.parse(data);
	if (parsed.collection !== collection) {
		throw new Error(`Frontmatter collection does not match "${collection}"`);
	}

	return parsed;
}

export type ArticleFileValidation =
	| { path: string; collection: string; slug: string; valid: true; article: Article }
	| { path: string; collection: string; slug: string; valid: false; error: string };

// Validerar varje artikelfil oberoende av varandra, så att ett trasigt
// frontmatter i en fil kan upptäckas (t.ex. i test eller build) utan att
// tystas ner av felhanteringen i getArticles().
export function validateArticleFiles(): ArticleFileValidation[] {
	const topics = new Set(getArticleTopics().map((topic) => topic.slug));

	return Object.entries(articleFiles).map(([path, raw]) => {
		const { collection, slug } = getArticlePathParts(path);
		try {
			const parsed = parseArticleFrontmatter(matter(raw).data, collection);
			if (!topics.has(parsed.collection)) {
				throw new Error(`okänt ämne "${parsed.collection}"`);
			}

			return {
				path,
				collection,
				slug,
				valid: true,
				article: {
					...parsed,
					slug,
					url: `/blogg/amne/${collection}/${slug}`,
					body: matter(raw).content.trim()
				}
			};
		} catch (cause) {
			return {
				path,
				collection,
				slug,
				valid: false,
				error: cause instanceof Error ? cause.message : String(cause)
			};
		}
	});
}

const SITE_HOSTNAMES = new Set(['www.mittpsyke.se', 'mittpsyke.se']);

// Alla konkreta (icke-dynamiska) sidor i src/routes, t.ex. "/ansvarsfull-ai".
// Byggs från samma import.meta.glob-mekanism som resten av modulen så att
// listan alltid speglar de rutter som faktiskt finns.
const routePageModules = import.meta.glob('/src/routes/**/+page.svelte');
const routeServerModules = import.meta.glob('/src/routes/**/+server.ts');
export const knownStaticRoutePaths = new Set(
	[...Object.keys(routePageModules), ...Object.keys(routeServerModules)].map((path) => {
		const withoutPrefix = path.replace(/^\/src\/routes/, '').replace(/\/\+(page\.svelte|server\.ts)$/, '');
		return withoutPrefix || '/';
	})
);

export type InternalLinkCheck =
	| { kind: 'blog-article'; collection: string; slug: string }
	| { kind: 'static-route'; path: string }
	| { kind: 'dynamic-route'; path: string; valid: boolean }
	| { kind: 'unverifiable' }
	| { kind: 'external' };

// Kontrollerar dynamiska ruttfamiljer (/guider/[pillar]/[guide] osv.) mot de
// datakällor som faktiskt styr respektive rutt, så att en länk till en
// obefintlig pelare/guide/övning fångas i stället för att tystas ner som
// "static-route" (vilket bara känner till de bokstavliga mapp-namnen).
function classifyDynamicRoute(pathname: string): InternalLinkCheck | null {
	const guiderMatch = pathname.match(/^\/(guider|guider-seo)\/([^/]+)(?:\/([^/]+))?$/);
	if (guiderMatch) {
		const [, , pillarSlug, guideSlug] = guiderMatch;
		const pillar = getPillarBySlug(decodeURIComponent(pillarSlug));
		const valid = guideSlug
			? !!pillar && !!getGuideBySlugs(decodeURIComponent(pillarSlug), decodeURIComponent(guideSlug))
			: !!pillar;
		return { kind: 'dynamic-route', path: pathname, valid };
	}

	const ovningarMatch = pathname.match(/^\/ovningar\/([^/]+)$/);
	if (ovningarMatch) {
		return {
			kind: 'dynamic-route',
			path: pathname,
			valid: !!getToolBySlug(decodeURIComponent(ovningarMatch[1]))
		};
	}

	const portalMatch = pathname.match(/^\/portal\/([^/]+)$/);
	if (portalMatch) {
		return {
			kind: 'dynamic-route',
			path: pathname,
			valid: !!getPortalByKey(decodeURIComponent(portalMatch[1]))
		};
	}

	const chatMatch = pathname.match(/^\/chat\/([^/]+)$/);
	if (chatMatch) {
		const segment = decodeURIComponent(chatMatch[1]);
		return {
			kind: 'dynamic-route',
			path: pathname,
			valid: segment in CHAT_SLUG_TO_CATEGORY || segment in CHAT_CATEGORY_TO_SLUG
		};
	}

	const blogTopicMatch = pathname.match(/^\/blogg\/amne\/([^/]+)$/);
	if (blogTopicMatch) {
		const topics = new Set(getArticleTopics().map((topic) => topic.slug));
		return {
			kind: 'dynamic-route',
			path: pathname,
			valid: topics.has(decodeURIComponent(blogTopicMatch[1]))
		};
	}

	return null;
}

export function classifyInternalLink(url: string): InternalLinkCheck {
	let pathname: string;

	if (url.startsWith('/')) {
		// Klipp bort query och hash så att t.ex. "/dagbok?tab=x" eller "/#kontakt"
		// klassas mot samma rutt som den bokstavliga sökvägen.
		pathname = url.split(/[?#]/)[0] || '/';
	} else {
		try {
			const parsed = new URL(url);
			if (!SITE_HOSTNAMES.has(parsed.hostname)) return { kind: 'external' };
			pathname = parsed.pathname;
		} catch {
			return { kind: 'external' };
		}
	}

	pathname = pathname.replace(/\/+$/, '') || '/';

	const blogArticleMatch = pathname.match(/^\/blogg\/amne\/([^/]+)\/([^/]+)$/);
	if (blogArticleMatch) {
		return {
			kind: 'blog-article',
			collection: decodeURIComponent(blogArticleMatch[1]),
			slug: decodeURIComponent(blogArticleMatch[2])
		};
	}

	// Övriga /blogg/*-länkar pekar på det externa Soro-drivna blogginnehållet,
	// som inte finns i det här repot och därför inte kan verifieras vid build.
	if (pathname.startsWith('/blogg/')) {
		return { kind: 'unverifiable' };
	}

	// En bokstavlig statisk rutt vinner alltid över ett dynamiskt mönster, t.ex.
	// är /guider/anonym-dagbok-online en egen statisk sida, inte /guider/[pillar].
	if (knownStaticRoutePaths.has(pathname)) {
		return { kind: 'static-route', path: pathname };
	}

	const dynamicRoute = classifyDynamicRoute(pathname);
	if (dynamicRoute) return dynamicRoute;

	return { kind: 'static-route', path: pathname };
}

export type BrokenRelatedArticleLink = {
	sourcePath: string;
	sourceTitle: string;
	linkTitle: string;
	url: string;
	reason: string;
};

// Kontrollerar "Läs vidare"-länkarna (relatedArticles) för varje giltig artikel
// och rapporterar länkar som pekar på ett okänt ämne, en opublicerad artikel
// eller en rutt som inte finns i src/routes.
export function findBrokenRelatedArticleLinks(): BrokenRelatedArticleLink[] {
	const publishedByKey = new Set(
		getPublishedArticles().map((article) => `${article.collection}/${article.slug}`)
	);

	return validateArticleFiles().flatMap((result) => {
		if (!result.valid) return [];

		return result.article.relatedArticles.flatMap((related) => {
			const check = classifyInternalLink(related.url);

			if (check.kind === 'blog-article') {
				const key = `${check.collection}/${check.slug}`;
				if (!publishedByKey.has(key)) {
					return [{
						sourcePath: result.path,
						sourceTitle: result.article.title,
						linkTitle: related.title,
						url: related.url,
						reason: `pekar på en okänd eller opublicerad artikel ("${check.collection}/${check.slug}")`
					}];
				}
			}

			if (check.kind === 'static-route' && !knownStaticRoutePaths.has(check.path)) {
				return [{
					sourcePath: result.path,
					sourceTitle: result.article.title,
					linkTitle: related.title,
					url: related.url,
					reason: `pekar på en rutt som inte finns ("${check.path}")`
				}];
			}

			if (check.kind === 'dynamic-route' && !check.valid) {
				return [{
					sourcePath: result.path,
					sourceTitle: result.article.title,
					linkTitle: related.title,
					url: related.url,
					reason: `pekar på en rutt som inte finns ("${check.path}")`
				}];
			}

			return [];
		});
	});
}

const MARKDOWN_LINK_PATTERN = /(!?)\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

// Plockar ut länk-URL:er ur Markdown-länksyntax i artikeltexten (bildlänkar,
// dvs "![alt](url)", räknas inte som interna sidlänkar och hoppas över).
export function extractMarkdownLinkUrls(markdown: string): string[] {
	return [...markdown.matchAll(MARKDOWN_LINK_PATTERN)]
		.filter(([, bang]) => bang !== '!')
		.map(([, , url]) => url);
}

export type BrokenArticleBodyLink = {
	sourcePath: string;
	sourceTitle: string;
	url: string;
	reason: string;
};

// Kontrollerar länkar skrivna direkt i artikeltexten (till skillnad från de
// kurerade "Läs vidare"-länkarna i relatedArticles).
export function findBrokenArticleBodyLinks(): BrokenArticleBodyLink[] {
	const publishedByKey = new Set(
		getPublishedArticles().map((article) => `${article.collection}/${article.slug}`)
	);

	return validateArticleFiles().flatMap((result) => {
		if (!result.valid || result.article.draft) return [];

		return extractMarkdownLinkUrls(result.article.body).flatMap((url) => {
			const check = classifyInternalLink(url);

			if (check.kind === 'blog-article') {
				const key = `${check.collection}/${check.slug}`;
				if (!publishedByKey.has(key)) {
					return [{
						sourcePath: result.path,
						sourceTitle: result.article.title,
						url,
						reason: `pekar på en okänd eller opublicerad artikel ("${key}")`
					}];
				}
			}

			if (check.kind === 'static-route' && !knownStaticRoutePaths.has(check.path)) {
				return [{
					sourcePath: result.path,
					sourceTitle: result.article.title,
					url,
					reason: `pekar på en rutt som inte finns ("${check.path}")`
				}];
			}

			if (check.kind === 'dynamic-route' && !check.valid) {
				return [{
					sourcePath: result.path,
					sourceTitle: result.article.title,
					url,
					reason: `pekar på en rutt som inte finns ("${check.path}")`
				}];
			}

			return [];
		});
	});
}

export function getArticles(): Article[] {
	return validateArticleFiles()
		.flatMap((result) => {
			if (!result.valid) {
				console.error('[articles] Skipped invalid article', {
					path: result.path,
					reason: result.error
				});
				return [];
			}

			return [result.article];
		})
		.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

export function getPublishedArticles() {
	return getArticles().filter((article) => !article.draft);
}

export function getPublishedArticle(collection: string, slug: string) {
	return getPublishedArticles().find(
		(article) => article.collection === collection && article.slug === slug
	);
}

const renderer = new marked.Renderer();

// Innehållet kommer från Git-baserad redigering. Rå HTML tillåts inte så att Markdown
// inte kan bära med sig script eller inbäddningar till artikelvyn.
renderer.html = () => '';
renderer.heading = function ({ tokens, depth }: Tokens.Heading) {
	const level = depth <= 1 ? 2 : Math.min(depth, 3);
	return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
};

function escapeHtmlAttribute(value: string) {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isSafeArticleHref(href: string) {
	if (href.startsWith('/') && !href.startsWith('//')) return true;
	if (href.startsWith('#') || href.startsWith('?')) return true;

	try {
		const url = new URL(href);
		return ['http:', 'https:', 'mailto:'].includes(url.protocol);
	} catch {
		return false;
	}
}

renderer.link = function ({ href, title, tokens }: Tokens.Link) {
	const text = this.parser.parseInline(tokens);
	if (!href || !isSafeArticleHref(href)) return text;

	const titleAttribute = title ? ` title="${escapeHtmlAttribute(title)}"` : '';
	return `<a href="${escapeHtmlAttribute(href)}"${titleAttribute}>${text}</a>`;
};

function unwrapMarkdownDocumentFence(markdown: string) {
	const fencedDocument = markdown
		.trim()
		.match(/^```(?:markdown|md)\s*\r?\n([\s\S]*?)\r?\n```\s*$/i);

	return fencedDocument ? fencedDocument[1].trim() : markdown;
}

function normalizeHeading(value: string) {
	return value
		.trim()
		.replace(/[–—]/g, '-')
		.replace(/\s+/g, ' ')
		.toLocaleLowerCase('sv-SE');
}

function removeLeadingDuplicateTitle(markdown: string, title?: string) {
	if (!title) return markdown;

	const heading = markdown.match(/^#\s+([^\r\n]+)\r?\n?/);
	if (!heading || normalizeHeading(heading[1]) !== normalizeHeading(title)) return markdown;

	return markdown.slice(heading[0].length).replace(/^\s*\r?\n/, '');
}

export function renderArticleMarkdown(markdown: string, title?: string) {
	const content = removeLeadingDuplicateTitle(unwrapMarkdownDocumentFence(markdown), title);
	const html = marked.parse(content, { async: false, gfm: true, renderer });
	return typeof html === 'string' ? html : '';
}

export function getArticleDateLabel(article: Pick<Article, 'date'>) {
	return article.date ? formatDate(article.date) : MISSING_DATE_LABEL;
}

const SITE_URL = 'https://www.mittpsyke.se';

// Bygger samma BlogPosting/HowTo-schema som artikelsidan lägger i <script type="application/ld+json">.
// Delad funktion så att både sidan och testerna använder exakt samma logik.
export function buildArticleJsonLd(article: Article, topic: Pick<ArticleTopic, 'label'>) {
	return {
		'@context': 'https://schema.org' as const,
		'@type': article.type === 'guide' ? ('HowTo' as const) : ('BlogPosting' as const),
		headline: article.title,
		description: article.description,
		image: article.image ? `${SITE_URL}${article.image}` : `${SITE_URL}/og-image.png`,
		datePublished: article.date,
		dateModified: article.updated ?? article.date,
		inLanguage: 'sv-SE' as const,
		author: { '@type': 'Person' as const, name: article.author },
		publisher: {
			'@type': 'Organization' as const,
			name: 'MittPsyke',
			logo: { '@type': 'ImageObject' as const, url: `${SITE_URL}/logo.png` }
		},
		articleSection: topic.label,
		mainEntityOfPage: { '@type': 'WebPage' as const, '@id': `${SITE_URL}${article.url}` }
	};
}

// Validerar den serialiserade formen (så som den faktiskt hamnar i sidans
// JSON-LD-script) mot de fält schema.org/Google kräver för BlogPosting/HowTo.
export const articleJsonLdSchema = z.object({
	'@context': z.literal('https://schema.org'),
	'@type': z.enum(['BlogPosting', 'HowTo']),
	headline: z.string().min(1),
	description: z.string().min(1),
	image: z.string().url(),
	datePublished: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'ogiltigt datum'),
	dateModified: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'ogiltigt datum'),
	inLanguage: z.literal('sv-SE'),
	author: z.object({ '@type': z.literal('Person'), name: z.string().min(1) }),
	publisher: z.object({
		'@type': z.literal('Organization'),
		name: z.string().min(1),
		logo: z.object({ '@type': z.literal('ImageObject'), url: z.string().url() })
	}),
	articleSection: z.string().min(1),
	mainEntityOfPage: z.object({ '@type': z.literal('WebPage'), '@id': z.string().url() })
});
