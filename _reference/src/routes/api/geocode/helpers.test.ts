import { describe, it, expect } from 'vitest';
import { validateCoordinates, parseGeocodingResult } from './helpers';
import type { GeocodingResult } from './helpers';

describe('validateCoordinates', () => {
	it('returns error for missing lat', () => {
		const result = validateCoordinates(null, '18.0686');
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe('Missing lat/lon parameters');
		}
	});

	it('returns error for missing lon', () => {
		const result = validateCoordinates('59.3293', null);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe('Missing lat/lon parameters');
		}
	});

	it('returns error for invalid lat (NaN)', () => {
		const result = validateCoordinates('not-a-number', '18.0686');
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe('Invalid coordinates');
		}
	});

	it('returns error for invalid lon (NaN)', () => {
		const result = validateCoordinates('59.3293', 'invalid');
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe('Invalid coordinates');
		}
	});

	it('returns error for latitude > 90', () => {
		const result = validateCoordinates('91', '18.0686');
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe('Coordinates out of range');
		}
	});

	it('returns error for latitude < -90', () => {
		const result = validateCoordinates('-91', '18.0686');
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe('Coordinates out of range');
		}
	});

	it('returns error for longitude > 180', () => {
		const result = validateCoordinates('59.3293', '181');
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe('Coordinates out of range');
		}
	});

	it('returns error for longitude < -180', () => {
		const result = validateCoordinates('59.3293', '-181');
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe('Coordinates out of range');
		}
	});

	it('accepts valid coordinates', () => {
		const result = validateCoordinates('59.3293', '18.0686');
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.latitude).toBe(59.3293);
			expect(result.longitude).toBe(18.0686);
		}
	});

	it('accepts boundary values (90, 180)', () => {
		const result = validateCoordinates('90', '180');
		expect(result.valid).toBe(true);
	});

	it('accepts boundary values (-90, -180)', () => {
		const result = validateCoordinates('-90', '-180');
		expect(result.valid).toBe(true);
	});

	it('accepts zero coordinates', () => {
		const result = validateCoordinates('0', '0');
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.latitude).toBe(0);
			expect(result.longitude).toBe(0);
		}
	});
});

describe('parseGeocodingResult', () => {
	it('extracts locality', () => {
		const result: GeocodingResult = {
			address_components: [
				{ long_name: 'Stockholm', short_name: 'Stockholm', types: ['locality'] }
			],
			formatted_address: 'Stockholm, Sweden'
		};
		const parsed = parseGeocodingResult(result);
		expect(parsed.name).toBe('Stockholm');
		expect(parsed.locality).toBe('Stockholm');
	});

	it('extracts area and locality', () => {
		const result: GeocodingResult = {
			address_components: [
				{ long_name: 'Södermalm', short_name: 'Södermalm', types: ['neighborhood'] },
				{ long_name: 'Stockholm', short_name: 'Stockholm', types: ['locality'] }
			],
			formatted_address: 'Södermalm, Stockholm, Sweden'
		};
		const parsed = parseGeocodingResult(result);
		expect(parsed.name).toBe('Södermalm, Stockholm');
		expect(parsed.locality).toBe('Stockholm');
		expect(parsed.area).toBe('Södermalm');
	});

	it('uses sublocality as area', () => {
		const result: GeocodingResult = {
			address_components: [
				{ long_name: 'Gamla Stan', short_name: 'Gamla Stan', types: ['sublocality', 'sublocality_level_1'] },
				{ long_name: 'Stockholm', short_name: 'Stockholm', types: ['locality'] }
			],
			formatted_address: 'Gamla Stan, Stockholm, Sweden'
		};
		const parsed = parseGeocodingResult(result);
		expect(parsed.name).toBe('Gamla Stan, Stockholm');
		expect(parsed.area).toBe('Gamla Stan');
	});

	it('uses administrative_area_level_2 as fallback for locality', () => {
		const result: GeocodingResult = {
			address_components: [
				{ long_name: 'Stockholms kommun', short_name: 'Stockholm', types: ['administrative_area_level_2'] }
			],
			formatted_address: 'Stockholms kommun, Sweden'
		};
		const parsed = parseGeocodingResult(result);
		expect(parsed.locality).toBe('Stockholms kommun');
	});

	it('falls back to formatted_address first part', () => {
		const result: GeocodingResult = {
			address_components: [
				{ long_name: 'Sweden', short_name: 'SE', types: ['country'] }
			],
			formatted_address: 'Some Place, Sweden'
		};
		const parsed = parseGeocodingResult(result);
		expect(parsed.name).toBe('Some Place');
	});

	it('does not duplicate area and locality if same', () => {
		const result: GeocodingResult = {
			address_components: [
				{ long_name: 'Stockholm', short_name: 'Stockholm', types: ['neighborhood'] },
				{ long_name: 'Stockholm', short_name: 'Stockholm', types: ['locality'] }
			],
			formatted_address: 'Stockholm, Sweden'
		};
		const parsed = parseGeocodingResult(result);
		// Should not be "Stockholm, Stockholm"
		expect(parsed.name).toBe('Stockholm');
	});

	it('handles empty address_components', () => {
		const result: GeocodingResult = {
			address_components: [],
			formatted_address: 'Unknown Location, Earth'
		};
		const parsed = parseGeocodingResult(result);
		expect(parsed.name).toBe('Unknown Location');
	});

	it('uses only locality when no area', () => {
		const result: GeocodingResult = {
			address_components: [
				{ long_name: 'Göteborg', short_name: 'Gbg', types: ['locality'] },
				{ long_name: 'Västra Götaland', short_name: 'VG', types: ['administrative_area_level_1'] }
			],
			formatted_address: 'Göteborg, Sweden'
		};
		const parsed = parseGeocodingResult(result);
		expect(parsed.name).toBe('Göteborg');
		expect(parsed.area).toBe('');
	});

	it('prioritizes neighborhood over sublocality for area', () => {
		const result: GeocodingResult = {
			address_components: [
				{ long_name: 'Neighborhood Area', short_name: 'NA', types: ['neighborhood'] },
				{ long_name: 'Sublocality Area', short_name: 'SA', types: ['sublocality'] },
				{ long_name: 'City', short_name: 'City', types: ['locality'] }
			],
			formatted_address: 'Neighborhood Area, City'
		};
		const parsed = parseGeocodingResult(result);
		expect(parsed.area).toBe('Neighborhood Area');
		expect(parsed.name).toBe('Neighborhood Area, City');
	});
});
