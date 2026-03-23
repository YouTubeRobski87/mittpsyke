import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { checkRateLimit, getClientIdentifier } from '$lib/validation/ratelimit';

// CORS headers for Capacitor native app
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

// Handle CORS preflight
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, { headers: corsHeaders });
};

interface AddressComponent {
	long_name: string;
	short_name: string;
	types: string[];
}

interface GeocodingResult {
	address_components: AddressComponent[];
	formatted_address: string;
}

interface GeocodingResponse {
	results: GeocodingResult[];
	status: string;
}

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		// Rate limiting
		const clientId = getClientIdentifier(request);
		const rateLimitResult = await checkRateLimit(`geocode:${clientId}`);

		if (!rateLimitResult.success) {
			return json(
				{ success: false, error: 'Rate limit exceeded' },
				{
					status: 429,
					headers: {
						...corsHeaders,
						'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
					}
				}
			);
		}

		// Check for API key
		if (!env.GOOGLE_MAPS_API_KEY) {
			console.log('[Geocode API] No API key configured');
			return json(
				{ success: false, error: 'Geocoding not configured' },
				{ status: 503, headers: corsHeaders }
			);
		}

		// Get coordinates from query params
		const lat = url.searchParams.get('lat');
		const lon = url.searchParams.get('lon');

		if (!lat || !lon) {
			return json(
				{ success: false, error: 'Missing lat/lon parameters' },
				{ status: 400, headers: corsHeaders }
			);
		}

		// Validate coordinates
		const latitude = parseFloat(lat);
		const longitude = parseFloat(lon);

		if (isNaN(latitude) || isNaN(longitude)) {
			return json(
				{ success: false, error: 'Invalid coordinates' },
				{ status: 400, headers: corsHeaders }
			);
		}

		if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
			return json(
				{ success: false, error: 'Coordinates out of range' },
				{ status: 400, headers: corsHeaders }
			);
		}

		// Call Google Geocoding API
		const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${env.GOOGLE_MAPS_API_KEY}&language=sv`;

		const response = await fetch(apiUrl);

		if (!response.ok) {
			console.error('[Geocode API] Google API error:', response.status);
			return json(
				{ success: false, error: 'Geocoding service error' },
				{ status: 502, headers: corsHeaders }
			);
		}

		const data: GeocodingResponse = await response.json();

		if (data.status !== 'OK' || !data.results || data.results.length === 0) {
			console.log('[Geocode API] No results, status:', data.status);
			return json(
				{ success: false, error: 'No location found' },
				{ status: 404, headers: corsHeaders }
			);
		}

		// Extract useful components
		const components = data.results[0].address_components;

		let locality = '';
		let area = '';
		let sublocality = '';

		for (const component of components) {
			if (component.types.includes('locality')) {
				locality = component.long_name;
			}
			if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1')) {
				sublocality = component.long_name;
			}
			if (component.types.includes('neighborhood')) {
				area = component.long_name;
			}
			if (!locality && component.types.includes('administrative_area_level_2')) {
				locality = component.long_name;
			}
		}

		if (!area && sublocality) {
			area = sublocality;
		}

		// Build display name
		let name = '';
		if (area && locality && area !== locality) {
			name = `${area}, ${locality}`;
		} else if (locality) {
			name = locality;
		} else if (area) {
			name = area;
		} else {
			const formatted = data.results[0].formatted_address;
			name = formatted.split(',')[0];
		}

		return json(
			{
				success: true,
				location: {
					name,
					locality: locality || name,
					area: area || ''
				}
			},
			{ headers: corsHeaders }
		);
	} catch (error) {
		console.error('[Geocode API] Error:', error);
		return json(
			{ success: false, error: 'Internal server error' },
			{ status: 500, headers: corsHeaders }
		);
	}
};
