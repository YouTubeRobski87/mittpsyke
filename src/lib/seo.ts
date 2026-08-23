export const PUBLIC_SITE_ORIGIN = 'https://mittpsyke.se';
export const SITE_URL = PUBLIC_SITE_ORIGIN;

export function buildTitle(pageTitle: string): string {
	return `${pageTitle} | MittPsyke`;
}

function normalizeToCanonicalUrl(value: string | URL, preserveSearch: boolean): URL {
	const url = new URL(value, PUBLIC_SITE_ORIGIN);
	const isMittPsykeHost = /^(?:www\.)*mittpsyke\.se$/i.test(url.hostname);

	if (!isMittPsykeHost) return url;

	url.protocol = 'https:';
	url.host = 'mittpsyke.se';
	url.port = '';
	url.hash = '';
	if (!preserveSearch) url.search = '';

	if (url.pathname !== '/') {
		url.pathname = url.pathname.replace(/\/+$/, '');
	}

	return url;
}

export function canonical(value: string): string {
	return canonicalUrl(value);
}

export function canonicalUrl(value: string | URL): string {
	return normalizeToCanonicalUrl(value, false).toString();
}

export function canonicalRequestUrl(value: string | URL): string {
	return normalizeToCanonicalUrl(value, true).toString();
}

export function normalizeStructuredDataSiteUrls(value: string): string {
	return value.replace(/https?:\/\/(?:www\.)*mittpsyke\.se/gi, PUBLIC_SITE_ORIGIN);
}
