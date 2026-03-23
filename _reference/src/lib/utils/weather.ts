import type { Coordinates } from './geolocation';

export interface WeatherData {
	temperature: number; // Celsius
	description: string; // Swedish description
	symbol: string; // Weather symbol name
}

// SMHI weather symbol codes to Swedish descriptions
const weatherSymbols: Record<number, string> = {
	1: 'klart',
	2: 'lätt molnighet',
	3: 'halvklart',
	4: 'molnigt',
	5: 'mycket moln',
	6: 'mulet',
	7: 'dimma',
	8: 'lätta regnskurar',
	9: 'regnskurar',
	10: 'kraftiga regnskurar',
	11: 'åskväder',
	12: 'lätta snöblandade skurar',
	13: 'snöblandade skurar',
	14: 'kraftiga snöblandade skurar',
	15: 'lätta snöbyar',
	16: 'snöbyar',
	17: 'kraftiga snöbyar',
	18: 'lätt regn',
	19: 'regn',
	20: 'kraftigt regn',
	21: 'åska',
	22: 'lätt snöblandat regn',
	23: 'snöblandat regn',
	24: 'kraftigt snöblandat regn',
	25: 'lätt snöfall',
	26: 'snöfall',
	27: 'kraftigt snöfall'
};

interface SMHIParameter {
	name: string;
	values: number[];
}

interface SMHITimeSeries {
	validTime: string;
	parameters: SMHIParameter[];
}

interface SMHIResponse {
	timeSeries: SMHITimeSeries[];
}

/**
 * Fetches current weather from SMHI's open API.
 * Only works for locations within Sweden/Nordic region.
 * Returns null if the API call fails or location is outside coverage area.
 */
export async function fetchWeather(coords: Coordinates): Promise<WeatherData | null> {
	const { latitude, longitude } = coords;

	// Round to 6 decimal places as SMHI expects
	const lat = latitude.toFixed(6);
	const lon = longitude.toFixed(6);

	const url = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon}/lat/${lat}/data.json`;

	console.log('[Weather] Fetching from SMHI...');

	try {
		const response = await fetch(url);

		if (!response.ok) {
			console.log('[Weather] SMHI returned error:', response.status);
			return null;
		}

		const data: SMHIResponse = await response.json();

		if (!data.timeSeries || data.timeSeries.length === 0) {
			return null;
		}

		// Get the first (current) time series entry
		const current = data.timeSeries[0];

		// Extract temperature (t) and weather symbol (Wsymb2)
		let temperature = 0;
		let symbolCode = 1;

		for (const param of current.parameters) {
			if (param.name === 't') {
				temperature = param.values[0];
			} else if (param.name === 'Wsymb2') {
				symbolCode = param.values[0];
			}
		}

		const description = weatherSymbols[symbolCode] || 'okänt väder';

		console.log(`[Weather] Success: ${Math.round(temperature)}°C, ${description}`);

		return {
			temperature: Math.round(temperature),
			description,
			symbol: String(symbolCode)
		};
	} catch (error) {
		console.log('[Weather] SMHI fetch failed:', error);
		return null;
	}
}

/**
 * Formats weather data into a human-readable Swedish string.
 */
export function formatWeatherForDisplay(weather: WeatherData): string {
	return `${weather.temperature}°C, ${weather.description}`;
}
