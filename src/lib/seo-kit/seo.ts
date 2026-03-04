const SITE_URL = 'https://www.mittpsyke.se';

export function buildTitle(pageTitle: string): string {
	return `${pageTitle} | MittPsyke`;
}

export function canonical(path: string): string {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const guiderSeoPath = normalizedPath.startsWith('/guider-seo')
		? normalizedPath
		: `/guider-seo${normalizedPath === '/' ? '' : normalizedPath}`;
	const withTrailingSlash = guiderSeoPath.endsWith('/') ? guiderSeoPath : `${guiderSeoPath}/`;

	return `${SITE_URL}${withTrailingSlash}`;
}
