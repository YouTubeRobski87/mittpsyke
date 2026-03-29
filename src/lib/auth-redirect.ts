import { env } from '$env/dynamic/public';

const DEFAULT_PUBLIC_SITE_URL = 'https://www.mittpsyke.se';

function normalizeBaseUrl(url: string) {
	return url.trim().replace(/\/+$/, '');
}

export function getStableOAuthBaseUrl() {
	return normalizeBaseUrl(env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL);
}

export function getStableOAuthCallbackUrl(next = '/dashboard') {
	const baseUrl = getStableOAuthBaseUrl();
	const params = new URLSearchParams({ next });

	return `${baseUrl}/auth/callback?${params.toString()}`;
}

export function canUseGoogleOAuth(origin: string) {
	return normalizeBaseUrl(origin) === getStableOAuthBaseUrl();
}
