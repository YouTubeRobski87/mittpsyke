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

interface PlacePrediction {
	place_id: string;
	description: string;
	structured_formatting: {
		main_text: string;
		secondary_text?: string;
	};
	types: string[];
}

interface AutocompleteResponse {
	predictions: PlacePrediction[];
	status: string;
}

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		// Rate limiting
		const clientId = getClientIdentifier(request);
		const rateLimitResult = await checkRateLimit(`places:${clientId}`);

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
			console.log('[Places API] No API key configured');
			return json(
				{ success: false, error: 'Places API not configured' },
				{ status: 503, headers: corsHeaders }
			);
		}

		// Get query parameters
		const input = url.searchParams.get('input');
		const lat = url.searchParams.get('lat');
		const lon = url.searchParams.get('lon');

		if (!input || input.trim().length < 2) {
			return json(
				{ success: false, error: 'Input must be at least 2 characters' },
				{ status: 400, headers: corsHeaders }
			);
		}

		// Build API URL - no type filter to include both establishments and addresses
		let apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${env.GOOGLE_MAPS_API_KEY}&language=sv`;

		// Add location bias if coordinates provided
		if (lat && lon) {
			const latitude = parseFloat(lat);
			const longitude = parseFloat(lon);
			if (!isNaN(latitude) && !isNaN(longitude)) {
				// Bias results to within ~50km of user's location
				apiUrl += `&location=${latitude},${longitude}&radius=50000`;
			}
		}

		// No type filter - returns establishments, addresses, and regions
		// This allows searching for "Kungsgatan 5" as well as "Espresso House"

		const response = await fetch(apiUrl);

		if (!response.ok) {
			console.error('[Places API] Google API error:', response.status);
			return json(
				{ success: false, error: 'Places service error' },
				{ status: 502, headers: corsHeaders }
			);
		}

		const data: AutocompleteResponse = await response.json();

		if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
			console.log('[Places API] Unexpected status:', data.status);
			return json(
				{ success: false, error: 'Places service error' },
				{ status: 502, headers: corsHeaders }
			);
		}

		// Transform predictions to a simpler format
		const places = (data.predictions || []).map((p) => ({
			id: p.place_id,
			name: p.structured_formatting.main_text,
			address: p.structured_formatting.secondary_text || '',
			fullText: p.description,
			types: p.types
		}));

		return json(
			{
				success: true,
				places
			},
			{ headers: corsHeaders }
		);
	} catch (error) {
		console.error('[Places API] Error:', error);
		return json(
			{ success: false, error: 'Internal server error' },
			{ status: 500, headers: corsHeaders }
		);
	}
};
