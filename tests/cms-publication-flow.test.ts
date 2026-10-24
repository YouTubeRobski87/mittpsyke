import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const articleRoot = join(root, 'src', 'content', 'articles');
const staticRoot = join(root, 'static');

type ArticlePublication = {
	path: string;
	slug: string;
	title: string;
	images: string[];
};

function markdownFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return markdownFiles(path);
		return entry.name.endsWith('.md') ? [path] : [];
	});
}

function localUploadPath(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const pathname = value.trim().split(/[?#]/, 1)[0];
	if (!pathname.startsWith('/uploads/')) return null;

	const target = resolve(staticRoot, `.${pathname}`);
	const relativeTarget = relative(staticRoot, target);
	if (!relativeTarget || relativeTarget.startsWith('..') || relativeTarget.includes(`..${sep}`)) {
		throw new Error(`Ogiltig lokal bildsökväg: ${value}`);
	}
	return target;
}

function articleImages(frontmatterImage: unknown, body: string): string[] {
	const markdownImages = [...body.matchAll(/!\[[^\]]*\]\(\s*<?([^\s)>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g)]
		.map((match) => match[1]);
	const htmlImages = [...body.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
		.map((match) => match[1]);

	return [frontmatterImage, ...markdownImages, ...htmlImages]
		.map(localUploadPath)
		.filter((path): path is string => path !== null);
}

function loadArticles(): ArticlePublication[] {
	return markdownFiles(articleRoot).map((path) => {
		const parsed = matter(readFileSync(path, 'utf8'));
		return {
			path: relative(root, path).replaceAll('\\', '/'),
			slug: path.slice(dirname(path).length + 1, -'.md'.length),
			title: typeof parsed.data.title === 'string' ? parsed.data.title.trim() : '',
			images: articleImages(parsed.data.image, parsed.content)
		};
	});
}

function findRetryDuplicates(articles: ArticlePublication[]): string[] {
	return articles.flatMap((candidate) => {
		const suffix = candidate.slug.match(/^(.*)-(\d+)$/);
		if (!suffix) return [];

		const candidateDirectory = candidate.path.slice(0, candidate.path.lastIndexOf('/'));
		const original = articles.find((article) =>
			article.slug === suffix[1]
			&& article.title.localeCompare(candidate.title, 'sv', { sensitivity: 'base' }) === 0
			&& article.path.slice(0, article.path.lastIndexOf('/')) === candidateDirectory
		);

		return original ? [`${candidate.path} ser ut som ett återförsök av ${original.path}`] : [];
	});
}

describe('CMS-publicering via branch och pull request', () => {
	it('behåller artikel- och bildmapparna som samma Git-baserade publiceringsflöde', () => {
		const config = readFileSync(join(root, '.pages.yml'), 'utf8');

		expect(config).toMatch(/\binput:\s*static\/uploads\b/);
		expect(config).toMatch(/\boutput:\s*\/uploads\b/);
		expect(config).toMatch(/\bpath:\s*src\/content\/articles\b/);
		expect(config).toMatch(/\bname:\s*image,\s*label:\s*Feature image,\s*type:\s*image\b/);
	});

	it('låter inte en artikel hänvisa till en lokal bild som saknas i samma repository', () => {
		const missingImages = loadArticles().flatMap((article) =>
			article.images
				.filter((image) => !existsSync(image))
				.map((image) => `${article.path}: saknar ${relative(root, image).replaceAll('\\', '/')}`)
		);

		expect(missingImages, missingImages.join('\n')).toEqual([]);
	});

	it('känner igen Pages CMS suffixmönster för ett dubblerat återförsök', () => {
		const original: ArticlePublication = {
			path: 'src/content/articles/oro/testartikel.md',
			slug: 'testartikel',
			title: 'Testartikel',
			images: []
		};
		const retry = {
			...original,
			path: 'src/content/articles/oro/testartikel-1.md',
			slug: 'testartikel-1'
		};

		expect(findRetryDuplicates([original, retry])).toEqual([
			`${retry.path} ser ut som ett återförsök av ${original.path}`
		]);
	});

	it('har inga sannolika artikeldubbletter från återförsök', () => {
		const duplicates = findRetryDuplicates(loadArticles());

		expect(duplicates, duplicates.join('\n')).toEqual([]);
	});
});
