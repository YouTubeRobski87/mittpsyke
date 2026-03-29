import { env } from '$env/dynamic/public';

const DEFAULT_PUBLIC_SITE_URL = 'https://www.mittpsyke.se';

function normalizeBaseUrl(url: string) {
	return url.trim().replace(/\/+$/, '');
}

export function getStableOAuthCallbackUrl(next = '/dashboard') {
	const baseUrl = normalizeBaseUrl(env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL);
	const params = new URLSearchParams({ next });

	return `${baseUrl}/auth/callback?${params.toString()}`;
}
