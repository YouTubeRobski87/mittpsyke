import { browser } from '$app/environment';
import type { Coordinates } from './geolocation';
import { getApiUrl } from '$lib/config';

export interface LocationInfo {
	name: string; // e.g., "Södermalm, Stockholm"
	locality: string; // e.g., "Stockholm"
	area: string; // e.g., "Södermalm" or district name
}

interface GeocodeResponse {
	success: boolean;
	location?: LocationInfo;
	error?: string;
}

/**
 * Fetches a human-readable location name from coordinates.
 * Calls the server-side /api/geocode endpoint which proxies to Google Geocoding API.
 * Returns null if the API call fails or no results are found.
 */
export async function fetchLocationName(coords: Coordinates): Promise<LocationInfo | null> {
	if (!browser) return null;

	const { latitude, longitude } = coords;
	const url = getApiUrl(`/api/geocode?lat=${latitude}&lon=${longitude}`);

	console.log('[Geocoding] Fetching location name...');

	try {
		const response = await fetch(url);

		if (!response.ok) {
			console.log('[Geocoding] API returned error:', response.status);
			return null;
		}

		const data: GeocodeResponse = await response.json();

		if (!data.success || !data.location) {
			console.log('[Geocoding] No location found');
			return null;
		}

		console.log(`[Geocoding] Success: ${data.location.name}`);
		return data.location;
	} catch (error) {
		console.log('[Geocoding] Fetch failed:', error);
		return null;
	}
}
