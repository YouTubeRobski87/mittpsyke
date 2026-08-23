export const PUBLIC_SITE_ORIGIN = 'https://www.mittpsyke.se';

export function buildTitle(pageTitle: string): string {
	return `${pageTitle} | MittPsyke`;
}

export function canonical(path: string): string {
	const normalizedPath = (path.startsWith('/') ? path : `/${path}`)
		.replace(/[?#].*$/, '')
		.replace(/\/+$/, '') || '/';

	return `${PUBLIC_SITE_ORIGIN}${normalizedPath}`;
}

function normalizeToCanonicalUrl(value: string | URL, preserveSearch: boolean): URL {
	const url = new URL(value, PUBLIC_SITE_ORIGIN);
	url.protocol = 'https:';
	url.host = 'www.mittpsyke.se';
	url.port = '';
	url.hash = '';
	if (!preserveSearch) url.search = '';

	if (url.pathname !== '/') {
		url.pathname = url.pathname.replace(/\/+$/, '');
	}

	return url;
}

export function canonicalUrl(value: string | URL): string {
	return normalizeToCanonicalUrl(value, false).toString();
}

export function canonicalRequestUrl(value: string | URL): string {
	return normalizeToCanonicalUrl(value, true).toString();
}

export function normalizeStructuredDataSiteUrls(value: string): string {
	return value.replaceAll('https://mittpsyke.se', PUBLIC_SITE_ORIGIN);
}
