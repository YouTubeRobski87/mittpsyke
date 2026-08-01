import { classifyInternalLink, getPublishedArticles, knownStaticRoutePaths } from './article-content';

// Alla .svelte-filer i projektet, inlästa som rå text (inte kompilerade) så
// att vi kan hitta bokstavliga href-attribut utan att rendera komponenterna.
const svelteFiles = import.meta.glob('/src/**/*.svelte', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

const HREF_PATTERN = /href\s*=\s*["']([^"']*)["']/g;

// Filnamn (t.ex. i /static eller /assets) har en filändelse i sista
// sökvägsdelen. SvelteKit-rutter har det aldrig, så det skiljer statiska
// resurser (bilder, ikoner, pdf:er) från sidor som ska kunna klassificeras.
function looksLikeStaticAsset(pathname: string): boolean {
	const lastSegment = pathname.split('/').pop() ?? '';
	return /\.[a-z0-9]{2,6}$/i.test(lastSegment);
}

export type BrokenSiteLink = {
	sourceFile: string;
	url: string;
	reason: string;
};

// Kontrollerar bokstavliga interna href-länkar (href="/...") i alla
// .svelte-filer, inte bara de kurerade länkarna i artikeldata. Länkar som
// byggs dynamiskt (href={variabel} eller href="/{uttryck}") kan inte
// verifieras statiskt och hoppas över.
export function findBrokenSiteLinks(): BrokenSiteLink[] {
	const publishedByKey = new Set(
		getPublishedArticles().map((article) => `${article.collection}/${article.slug}`)
	);
	const results: BrokenSiteLink[] = [];

	for (const [path, raw] of Object.entries(svelteFiles)) {
		for (const match of raw.matchAll(HREF_PATTERN)) {
			const url = match[1].trim();
			if (!url || url.includes('{') || !url.startsWith('/') || url.startsWith('//')) continue;

			const check = classifyInternalLink(url);

			if (check.kind === 'blog-article') {
				const key = `${check.collection}/${check.slug}`;
				if (!publishedByKey.has(key)) {
					results.push({
						sourceFile: path,
						url,
						reason: `pekar på en okänd eller opublicerad artikel ("${key}")`
					});
				}
				continue;
			}

			if (check.kind === 'static-route' && !knownStaticRoutePaths.has(check.path)) {
				if (looksLikeStaticAsset(check.path)) continue;
				results.push({ sourceFile: path, url, reason: `pekar på en rutt som inte finns ("${check.path}")` });
				continue;
			}

			if (check.kind === 'dynamic-route' && !check.valid) {
				results.push({ sourceFile: path, url, reason: `pekar på en rutt som inte finns ("${check.path}")` });
			}
		}
	}

	return results;
}
