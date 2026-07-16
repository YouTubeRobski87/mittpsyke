import matter from 'gray-matter';
import { marked, type Tokens } from 'marked';
import { z } from 'zod';

const articleSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	image: z.string().min(1).optional(),
	imageAlt: z.string().min(1).optional(),
	date: z.coerce.date(),
	updated: z.coerce.date().optional(),
	author: z.string().min(1),
	collection: z.string().min(1),
	tags: z.array(z.string()).default([]),
	readingTime: z.string().optional(),
	references: z
		.array(
			z.object({
				label: z.string().min(1),
				url: z.string().url()
			})
		)
		.default([]),
	relatedArticles: z
		.array(z.object({ title: z.string().min(1), url: z.string().min(1) }))
		.default([]),
	type: z.enum(['article', 'guide']).default('article'),
	draft: z.boolean().default(false)
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

export function getArticles(): Article[] {
	const topics = new Set(getArticleTopics().map((topic) => topic.slug));

	return Object.entries(articleFiles)
		.map(([path, raw]) => {
			const { collection, slug } = getArticlePathParts(path);
			try {
				const parsed = articleSchema.parse(matter(raw).data);
				if (parsed.collection !== collection) {
					throw new Error(`frontmatter.collection måste vara "${collection}"`);
				}
				if (!topics.has(parsed.collection)) {
					throw new Error(`okänt ämne "${parsed.collection}"`);
				}

				return {
					...parsed,
					slug,
					url: `/blogg/amne/${collection}/${slug}`,
					body: matter(raw).content.trim()
				};
			} catch (cause) {
				throw new Error(`Ogiltig artikel i ${path}: ${cause instanceof Error ? cause.message : cause}`);
			}
		})
		.sort((a, b) => b.date.getTime() - a.date.getTime());
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
	return formatDate(article.date);
}
