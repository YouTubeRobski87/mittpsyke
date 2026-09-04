// Sammanfattningsraden på Mitt Hem får bara säga det de två talen visar, och
// aldrig beskriva användningsfrekvens som ett resultat.

import { describe, expect, it } from 'vitest';
import { buildProgressSummary, EMPTY_PROGRESS_SUMMARY } from './dashboard-progress-summary';

/** Ord och vändningar som gör obruten användning till ett resultat. */
const STREAK_LANGUAGE = [
	'i följd',
	'i rad',
	'streak',
	'nära i tid',
	'rytm',
	'varje dag',
	'rekord',
	'fortsätt',
	'missa'
];

describe('sammanfattningen på Mitt Hem', () => {
	it('bjuder in utan mål när inget är sparat', () => {
		expect(buildProgressSummary(0, 0)).toBe(EMPTY_PROGRESS_SUMMARY);
		expect(EMPTY_PROGRESS_SUMMARY).toBe('Små steg räcker. Skriv ditt första inlägg här.');
	});

	it('räknar en enda sparad anteckning i singular', () => {
		expect(buildProgressSummary(0, 1)).toBe(
			'1 sparad anteckning finns kvar att gå tillbaka till.'
		);
	});

	it('räknar flera sparade anteckningar utan att nämna veckan när den är tom', () => {
		expect(buildProgressSummary(0, 12)).toBe(
			'12 sparade anteckningar finns kvar att gå tillbaka till.'
		);
	});

	it('lägger till veckans antal när det finns inlägg den här veckan', () => {
		expect(buildProgressSummary(2, 12)).toBe(
			'2 inlägg den här veckan. 12 sparade anteckningar finns kvar att gå tillbaka till.'
		);
	});

	it('säger aldrig mer än de två talen visar', () => {
		// Varje tal i texten ska gå att härleda till en indata. Inget tredje
		// tal - till exempel dagar i följd - får smyga in i copyn.
		for (const [weekly, total] of [
			[0, 1],
			[1, 1],
			[3, 9],
			[7, 40],
			[25, 500]
		]) {
			const summary = buildProgressSummary(weekly, total);
			const numbers = (summary.match(/\d+/g) ?? []).map(Number);
			for (const value of numbers) {
				expect([weekly, total]).toContain(value);
			}
		}
	});

	it('använder inget prestationsspråk oavsett indata', () => {
		for (let total = 0; total <= 40; total += 1) {
			for (const weekly of [0, 1, 3, 7, total]) {
				const summary = buildProgressSummary(weekly, total).toLocaleLowerCase('sv-SE');
				for (const phrase of STREAK_LANGUAGE) {
					expect(summary).not.toContain(phrase);
				}
			}
		}
	});

	it('faller tillbaka på tomt läge i stället för att hitta på en mening', () => {
		expect(buildProgressSummary(Number.NaN, Number.NaN)).toBe(EMPTY_PROGRESS_SUMMARY);
		expect(buildProgressSummary(-5, -5)).toBe(EMPTY_PROGRESS_SUMMARY);
		// Ett trasigt veckotal får inte kunna skriva ut ett negativt antal.
		expect(buildProgressSummary(-3, 4)).toBe(
			'4 sparade anteckningar finns kvar att gå tillbaka till.'
		);
	});
});
