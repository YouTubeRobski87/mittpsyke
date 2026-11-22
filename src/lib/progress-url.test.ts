// Framstegs flik och period i adressen, och länken tillbaka från Dagboken.

import { describe, expect, it } from 'vitest';
import {
	defaultProgressTab,
	progressHref,
	progressReturnHref,
	readProgressPeriod,
	readProgressTab
} from '$lib/progress-url';

const params = (query: string) => new URLSearchParams(query);

describe('readProgressTab', () => {
	it('läser kända flikar', () => {
		expect(readProgressTab(params('tab=insights'))).toBe('insights');
		expect(readProgressTab(params('tab=mood'))).toBe('mood');
		expect(readProgressTab(params('tab=development'))).toBe('development');
		expect(readProgressTab(params('tab=place'))).toBe('place');
	});

	it('ger null för saknad eller okänd flik', () => {
		expect(readProgressTab(params(''))).toBeNull();
		expect(readProgressTab(params('tab=admin'))).toBeNull();
		expect(readProgressTab(null)).toBeNull();
	});
});

describe('readProgressPeriod', () => {
	it('läser perioder som går att välja', () => {
		expect(readProgressPeriod(params('period=30'))).toBe(30);
		expect(readProgressPeriod(params('period=90'))).toBe(90);
		expect(readProgressPeriod(params('period=180'))).toBe(180);
	});

	it('ger null för saknad eller ogiltig period', () => {
		expect(readProgressPeriod(params(''))).toBeNull();
		// 7 finns som typ men går inte att välja i Framsteg.
		expect(readProgressPeriod(params('period=7'))).toBeNull();
		expect(readProgressPeriod(params('period=90abc'))).toBeNull();
		expect(readProgressPeriod(undefined)).toBeNull();
	});
});

describe('progressHref', () => {
	it('utelämnar standardvärdena så att /framsteg betyder Min plats och 30 dagar', () => {
		expect(progressHref('place', 30)).toBe('/framsteg');
	});

	it('skriver flik och period när de skiljer sig från standard', () => {
		expect(progressHref('insights', 30)).toBe('/framsteg?tab=insights');
		expect(progressHref('place', 90)).toBe('/framsteg?period=90');
		expect(progressHref('insights', 180)).toBe('/framsteg?tab=insights&period=180');
	});

	it('utgår från gästens standardflik när den skickas med', () => {
		const guestDefault = defaultProgressTab(true);
		expect(progressHref('insights', 30, guestDefault)).toBe('/framsteg');
		// En gäst som väljer Min plats måste få fliken i adressen, annars skulle
		// /framsteg öppna exemplet igen vid omladdning eller bakåt.
		expect(progressHref('place', 30, guestDefault)).toBe('/framsteg?tab=place');
	});
});

describe('defaultProgressTab', () => {
	it('öppnar Mina insikter (exemplet) för gäster och Min plats för inloggade', () => {
		expect(defaultProgressTab(true)).toBe('insights');
		expect(defaultProgressTab(false)).toBe('place');
	});
});

describe('progressReturnHref', () => {
	it('återskapar flik och period från Framstegs adress', () => {
		expect(progressReturnHref(new URL('https://mittpsyke.se/framsteg?tab=insights&period=90'))).toBe(
			'/framsteg?tab=insights&period=90'
		);
		expect(progressReturnHref(new URL('https://mittpsyke.se/framsteg?tab=development'))).toBe(
			'/framsteg?tab=development'
		);
	});

	it('ger vanliga /framsteg när användaren inte kom från Framsteg', () => {
		expect(progressReturnHref(null)).toBe('/framsteg');
		expect(progressReturnHref(new URL('https://mittpsyke.se/dagbok?tab=insights'))).toBe('/framsteg');
	});

	it('släpper aldrig igenom okända parametrar', () => {
		expect(
			progressReturnHref(new URL('https://mittpsyke.se/framsteg?tab=evil&period=999&next=https://x.se'))
		).toBe('/framsteg');
	});
});
