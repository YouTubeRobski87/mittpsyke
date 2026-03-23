const SITE_URL = 'https://www.mittpsyke.se';

export function buildTitle(pageTitle: string): string {
	return `${pageTitle} | MittPsyke`;
}

export function canonical(path: string): string {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${SITE_URL}${normalizedPath}`;
}
