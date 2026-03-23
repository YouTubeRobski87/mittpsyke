import { browser } from '$app/environment';

export interface Coordinates {
	latitude: number;
	longitude: number;
}

/**
 * Gets the user's current position using the browser Geolocation API.
 * Returns null if geolocation is not supported, permission is denied, or an error occurs.
 */
export async function getCurrentPosition(): Promise<Coordinates | null> {
	if (!browser) return null;

	if (!navigator.geolocation) {
		console.log('[Weather] Geolocation not supported');
		return null;
	}

	return new Promise((resolve) => {
		console.log('[Weather] Requesting location...');
		navigator.geolocation.getCurrentPosition(
			(position) => {
				console.log('[Weather] Location granted');
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude
				});
			},
			(error) => {
				// Silently fail on error (permission denied, timeout, etc.)
				console.log('[Weather] Location denied or error:', error.message);
				resolve(null);
			},
			{
				enableHighAccuracy: false,
				timeout: 10000,
				maximumAge: 300000 // 5 minutes cache
			}
		);
	});
}
