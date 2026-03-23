import { browser } from '$app/environment';
import { Capacitor } from '@capacitor/core';

/**
 * API Configuration
 *
 * When running in Capacitor (native app), we need to call the full backend URL
 * since there's no server bundled with the app.
 *
 * Set VITE_API_BASE_URL in your .env file to your deployed backend URL:
 * VITE_API_BASE_URL=https://your-app.vercel.app
 */

function getApiBaseUrl(): string {
	// In browser/SSR during development, use relative paths
	if (!browser) return '';

	// Check if running in Capacitor (native app)
	if (Capacitor.isNativePlatform()) {
		// Must use the deployed backend URL
		const backendUrl = import.meta.env.VITE_API_BASE_URL;
		if (!backendUrl) {
			console.warn(
				'VITE_API_BASE_URL not set. API calls will fail in native app. ' +
					'Set this to your deployed backend URL (e.g., https://your-app.vercel.app)'
			);
			return '';
		}
		return backendUrl;
	}

	// Web: use relative paths (works with SvelteKit dev server and deployed backend)
	return '';
}

export const API_BASE_URL = getApiBaseUrl();

export function getApiUrl(path: string): string {
	const base = API_BASE_URL;
	// Ensure path starts with /
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${base}${normalizedPath}`;
}
