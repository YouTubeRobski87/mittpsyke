import { describe, expect, it } from 'vitest';
import { seoSupportPages } from '$lib/data/seo-support-pages';
import { classifyInternalLink, getPublishedArticles, knownStaticRoutePaths } from './article-content';

const MIN_DESCRIPTION_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 170;
const MAX_TITLE_LENGTH = 70;

describe('seoSupportPages metadata', () => {
	const entries = Object.entries(seoSupportPages);

	it('has a canonical URL that matches its own record key', () => {
		const mismatched = entries
			.filter(([key, config]) => config.canonical !== `https://mittpsyke.se/${key}`)
			.map(([key, config]) => `"${key}" has canonical "${config.canonical}"`);

		expect(mismatched).toEqual([]);
	});

	it('has a title and description within a sane length for search snippets', () => {
		const problems = entries.flatMap(([key, config]) => {
			const issues: string[] = [];
			if (!config.title.trim()) issues.push('saknar titel');
			else if (config.title.length > MAX_TITLE_LENGTH) issues.push(`titeln är ${config.title.length} tecken (max ${MAX_TITLE_LENGTH})`);

			if (!config.description.trim()) issues.push('saknar description');
			else if (config.description.length < MIN_DESCRIPTION_LENGTH || config.description.length > MAX_DESCRIPTION_LENGTH) {
				issues.push(`description är ${config.description.length} tecken (rekommenderat ${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH})`);
			}

			return issues.length > 0 ? [`"${key}": ${issues.join(', ')}`] : [];
		});

		expect(problems).toEqual([]);
	});

	it('has no internal link pointing at an unknown route', () => {
		const publishedByKey = new Set(
			getPublishedArticles().map((article) => `${article.collection}/${article.slug}`)
		);

		const checkLink = (key: string, source: string, url: string): string[] => {
			if (!url.startsWith('/')) return [];
			const check = classifyInternalLink(url);

			if (check.kind === 'blog-article') {
				const articleKey = `${check.collection}/${check.slug}`;
				if (!publishedByKey.has(articleKey)) {
					return [`"${key}" ${source} → "${url}" pekar på en okänd eller opublicerad artikel ("${articleKey}")`];
				}
				return [];
			}

			if (check.kind === 'static-route' && !knownStaticRoutePaths.has(check.path)) {
				return [`"${key}" ${source} → "${url}" pekar på en rutt som inte finns ("${check.path}")`];
			}

			if (check.kind === 'dynamic-route' && !check.valid) {
				return [`"${key}" ${source} → "${url}" pekar på en rutt som inte finns ("${check.path}")`];
			}

			return [];
		};

		const broken = entries.flatMap(([key, config]) => [
			...checkLink(key, 'primaryCta', config.primaryCta.href),
			...(config.secondaryCta ? checkLink(key, 'secondaryCta', config.secondaryCta.href) : []),
			...config.resourceListItems.flatMap((item) => checkLink(key, 'resourceListItems', item.href)),
			...config.nextStepLinks.flatMap((link) => checkLink(key, 'nextStepLinks', link.href))
		]);

		expect(broken).toEqual([]);
	});
});
