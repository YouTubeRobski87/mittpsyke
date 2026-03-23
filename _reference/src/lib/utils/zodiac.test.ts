import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getZodiacFromBirthday, getAgeFromBirthday, zodiacSigns } from './zodiac';

describe('getZodiacFromBirthday', () => {
	it('returns null for null input', () => {
		expect(getZodiacFromBirthday(null)).toBeNull();
	});

	it('returns null for invalid date', () => {
		expect(getZodiacFromBirthday('not-a-date')).toBeNull();
	});

	it('returns Capricorn for Dec 22', () => {
		const result = getZodiacFromBirthday('1990-12-22');
		expect(result?.id).toBe('capricorn');
	});

	it('returns Capricorn for Jan 19', () => {
		const result = getZodiacFromBirthday('1990-01-19');
		expect(result?.id).toBe('capricorn');
	});

	it('returns Aquarius for Jan 20', () => {
		const result = getZodiacFromBirthday('1990-01-20');
		expect(result?.id).toBe('aquarius');
	});

	it('returns Leo for Aug 15', () => {
		const result = getZodiacFromBirthday('1990-08-15');
		expect(result?.id).toBe('leo');
	});

	it('returns Sagittarius for Dec 1', () => {
		const result = getZodiacFromBirthday('1990-12-01');
		expect(result?.id).toBe('sagittarius');
	});

	it('returns Sagittarius for Dec 21 (end boundary)', () => {
		const result = getZodiacFromBirthday('1990-12-21');
		expect(result?.id).toBe('sagittarius');
	});

	it('handles leap year birthdays', () => {
		const result = getZodiacFromBirthday('2000-02-29');
		expect(result?.id).toBe('pisces');
	});

	// Test all zodiac signs for coverage
	const signTests = [
		{ date: '1990-01-15', expected: 'capricorn' },
		{ date: '1990-02-10', expected: 'aquarius' },
		{ date: '1990-03-10', expected: 'pisces' },
		{ date: '1990-04-10', expected: 'aries' },
		{ date: '1990-05-10', expected: 'taurus' },
		{ date: '1990-06-10', expected: 'gemini' },
		{ date: '1990-07-10', expected: 'cancer' },
		{ date: '1990-08-10', expected: 'leo' },
		{ date: '1990-09-10', expected: 'virgo' },
		{ date: '1990-10-10', expected: 'libra' },
		{ date: '1990-11-10', expected: 'scorpio' },
		{ date: '1990-12-10', expected: 'sagittarius' }
	];

	signTests.forEach(({ date, expected }) => {
		it(`returns ${expected} for ${date}`, () => {
			const result = getZodiacFromBirthday(date);
			expect(result?.id).toBe(expected);
		});
	});
});

describe('getAgeFromBirthday', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-06-15'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns null for null input', () => {
		expect(getAgeFromBirthday(null)).toBeNull();
	});

	it('returns null for invalid date', () => {
		expect(getAgeFromBirthday('invalid')).toBeNull();
	});

	it('calculates age when birthday has passed this year', () => {
		const result = getAgeFromBirthday('1990-01-15');
		expect(result).toBe(34);
	});

	it('calculates age when birthday has not passed this year', () => {
		const result = getAgeFromBirthday('1990-12-15');
		expect(result).toBe(33);
	});

	it('calculates age on birthday', () => {
		vi.setSystemTime(new Date('2024-06-15'));
		const result = getAgeFromBirthday('1990-06-15');
		expect(result).toBe(34);
	});

	it('calculates age day before birthday', () => {
		vi.setSystemTime(new Date('2024-06-14'));
		const result = getAgeFromBirthday('1990-06-15');
		expect(result).toBe(33);
	});

	it('handles leap year birthdays', () => {
		vi.setSystemTime(new Date('2024-03-01'));
		const result = getAgeFromBirthday('2000-02-29');
		expect(result).toBe(24);
	});
});

describe('zodiacSigns', () => {
	it('contains 12 signs', () => {
		expect(zodiacSigns).toHaveLength(12);
	});

	it('each sign has required properties', () => {
		zodiacSigns.forEach((sign) => {
			expect(sign).toHaveProperty('id');
			expect(sign).toHaveProperty('name');
			expect(sign).toHaveProperty('symbol');
			expect(sign).toHaveProperty('dateRange');
		});
	});
});
