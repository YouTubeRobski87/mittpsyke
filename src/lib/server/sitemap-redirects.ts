import { legacyBlogRedirects } from './legacy-redirects';

export function replaceRedirectedSitemapPath(path: string): string {
	return legacyBlogRedirects[path] ?? path;
}
