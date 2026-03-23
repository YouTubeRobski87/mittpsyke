export interface AddressComponent {
	long_name: string;
	short_name: string;
	types: string[];
}

export interface GeocodingResult {
	address_components: AddressComponent[];
	formatted_address: string;
}

export interface ParsedLocation {
	name: string;
	locality: string;
	area: string;
}

export function validateCoordinates(
	lat: string | null,
	lon: string | null
): { valid: false; error: string } | { valid: true; latitude: number; longitude: number } {
	if (!lat || !lon) {
		return { valid: false, error: 'Missing lat/lon parameters' };
	}

	const latitude = parseFloat(lat);
	const longitude = parseFloat(lon);

	if (isNaN(latitude) || isNaN(longitude)) {
		return { valid: false, error: 'Invalid coordinates' };
	}

	if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
		return { valid: false, error: 'Coordinates out of range' };
	}

	return { valid: true, latitude, longitude };
}

export function parseGeocodingResult(result: GeocodingResult): ParsedLocation {
	const components = result.address_components;

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
		const formatted = result.formatted_address;
		name = formatted.split(',')[0];
	}

	return {
		name,
		locality: locality || name,
		area: area || ''
	};
}
