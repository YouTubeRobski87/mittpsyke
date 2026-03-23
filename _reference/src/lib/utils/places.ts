import { browser } from '$app/environment';
import { getApiUrl } from '$lib/config';

export interface Place {
	id: string;
	name: string;
	address: string;
	fullText: string;
	types: string[];
}

interface PlacesResponse {
	success: boolean;
	places?: Place[];
	error?: string;
}

/**
 * Search for places and addresses using Google Places Autocomplete API.
 * Returns both establishments (restaurants, cafés, etc.) and addresses.
 * Optionally biases results to the user's current location.
 */
export async function searchPlaces(
	input: string,
	coords?: { latitude: number; longitude: number }
): Promise<Place[]> {
	if (!browser) return [];
	if (input.trim().length < 2) return [];

	let url = getApiUrl(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);

	if (coords) {
		url += `&lat=${coords.latitude}&lon=${coords.longitude}`;
	}

	try {
		const response = await fetch(url);

		if (!response.ok) {
			console.log('[Places] API returned error:', response.status);
			return [];
		}

		const data: PlacesResponse = await response.json();

		if (!data.success || !data.places) {
			return [];
		}

		return data.places;
	} catch (error) {
		console.log('[Places] Fetch failed:', error);
		return [];
	}
}

/**
 * Get a human-friendly category name from place types.
 * Returns null if no matching category is found.
 */
export function getPlaceCategory(types: string[]): string | null {
	// Establishment types (businesses, venues)
	const establishmentMap: Record<string, string> = {
		restaurant: 'Restaurang',
		cafe: 'Kafé',
		bar: 'Bar',
		gym: 'Gym',
		park: 'Park',
		museum: 'Museum',
		movie_theater: 'Biograf',
		shopping_mall: 'Köpcentrum',
		store: 'Butik',
		supermarket: 'Mataffär',
		hospital: 'Sjukhus',
		pharmacy: 'Apotek',
		school: 'Skola',
		university: 'Universitet',
		library: 'Bibliotek',
		church: 'Kyrka',
		spa: 'Spa',
		hair_care: 'Frisör',
		beauty_salon: 'Salong',
		lodging: 'Hotell',
		airport: 'Flygplats',
		train_station: 'Tågstation',
		bus_station: 'Busstation',
		subway_station: 'Tunnelbana',
		gas_station: 'Bensinstation',
		car_wash: 'Biltvätt',
		veterinary_care: 'Veterinär',
		zoo: 'Djurpark',
		aquarium: 'Akvarium',
		amusement_park: 'Nöjespark',
		bowling_alley: 'Bowling',
		night_club: 'Nattklubb',
		bakery: 'Bageri',
		book_store: 'Bokhandel',
		clothing_store: 'Klädbutik',
		electronics_store: 'Elektronik',
		furniture_store: 'Möbler',
		home_goods_store: 'Inredning',
		jewelry_store: 'Juvelerare',
		pet_store: 'Djuraffär',
		shoe_store: 'Skobutik',
		florist: 'Blomsterhandel',
		dentist: 'Tandläkare',
		doctor: 'Läkarmottagning',
		post_office: 'Postkontor',
		bank: 'Bank',
		atm: 'Bankomat',
		parking: 'Parkering',
		car_rental: 'Biluthyrning',
		car_dealer: 'Bilhandlare',
		real_estate_agency: 'Mäklare',
		insurance_agency: 'Försäkring',
		lawyer: 'Advokat',
		accounting: 'Redovisning',
		travel_agency: 'Resebyrå',
		laundry: 'Tvätteri',
		locksmith: 'Låssmed',
		painter: 'Målare',
		plumber: 'Rörmokare',
		electrician: 'Elektriker',
		roofing_contractor: 'Takläggare',
		moving_company: 'Flyttfirma',
		storage: 'Förvaring'
	};

	// Address/geocode types
	const addressMap: Record<string, string> = {
		street_address: 'Adress',
		route: 'Gata',
		intersection: 'Korsning',
		premise: 'Fastighet',
		subpremise: 'Lokal',
		neighborhood: 'Område',
		sublocality: 'Stadsdel',
		locality: 'Ort',
		postal_code: 'Postnummer',
		postal_town: 'Postort',
		administrative_area_level_1: 'Region',
		administrative_area_level_2: 'Kommun',
		country: 'Land'
	};

	// Check establishment types first (more specific)
	for (const type of types) {
		if (establishmentMap[type]) {
			return establishmentMap[type];
		}
	}

	// Then check address types
	for (const type of types) {
		if (addressMap[type]) {
			return addressMap[type];
		}
	}

	// Generic fallback for common container types
	if (types.includes('establishment')) {
		return 'Verksamhet';
	}
	if (types.includes('geocode')) {
		return 'Plats';
	}

	return null;
}

/**
 * Check if the place is an address (vs establishment)
 */
export function isAddress(types: string[]): boolean {
	const addressTypes = [
		'street_address',
		'route',
		'intersection',
		'premise',
		'subpremise',
		'geocode'
	];
	return types.some((t) => addressTypes.includes(t)) && !types.includes('establishment');
}
