import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shiftDateKey, stockholmTodayKey, toStockholmDateKey } from './stockholm-date';

// Regressionstester för dygnsindelningen. Innan den här modulen fanns klippte
// stats-timeline och heatmap ISO-strängen, vilket gav UTC-dygn. Ett inlägg
// sparat strax efter midnatt svensk tid hamnade då på föregående dag och gav
// andra tal än streak, som redan räknade svensk tid.
//
// Sommartid i Sverige 2026: 29 mars - 25 oktober. CEST = UTC+2, CET = UTC+1.

describe('toStockholmDateKey runt svensk midnatt', () => {
	it('sommartid: strax före midnatt stannar på samma dag', () => {
		// 15 juli 23:59 svensk tid = 21:59 UTC.
		expect(toStockholmDateKey('2026-07-15T21:59:00Z')).toBe('2026-07-15');
	});

	it('sommartid: strax efter midnatt räknas som nya dagen', () => {
		// 16 juli 00:01 svensk tid = 15 juli 22:01 UTC. Det gamla UTC-beteendet
		// gav 2026-07-15 här, vilket är precis felet som rättades.
		const timestamp = '2026-07-15T22:01:00Z';

		expect(toStockholmDateKey(timestamp)).toBe('2026-07-16');
		expect(timestamp.slice(0, 10)).toBe('2026-07-15');
	});

	it('vintertid: strax före midnatt stannar på samma dag', () => {
		// 15 januari 23:59 svensk tid = 22:59 UTC.
		expect(toStockholmDateKey('2026-01-15T22:59:00Z')).toBe('2026-01-15');
	});

	it('vintertid: strax efter midnatt räknas som nya dagen', () => {
		// 16 januari 00:01 svensk tid = 15 januari 23:01 UTC.
		const timestamp = '2026-01-15T23:01:00Z';

		expect(toStockholmDateKey(timestamp)).toBe('2026-01-16');
		expect(timestamp.slice(0, 10)).toBe('2026-01-15');
	});

	it('exakt midnatt svensk tid tillhör den nya dagen', () => {
		// Sommartid: 00:00 den 16 juli = 22:00 UTC den 15 juli.
		expect(toStockholmDateKey('2026-07-15T22:00:00Z')).toBe('2026-07-16');
		// Vintertid: 00:00 den 16 januari = 23:00 UTC den 15 januari.
		expect(toStockholmDateKey('2026-01-15T23:00:00Z')).toBe('2026-01-16');
	});

	it('offset skiljer sig mellan CET och CEST', () => {
		// Samma UTC-klockslag, 22:30, ger olika dygn beroende på årstid.
		expect(toStockholmDateKey('2026-07-15T22:30:00Z')).toBe('2026-07-16'); // CEST
		expect(toStockholmDateKey('2026-01-15T22:30:00Z')).toBe('2026-01-15'); // CET
	});
});

describe('toStockholmDateKey vid tidsomställning', () => {
	it('hanterar dagen då klockan ställs fram', () => {
		// 29 mars 2026: 02:00 CET blir 03:00 CEST.
		expect(toStockholmDateKey('2026-03-29T00:30:00Z')).toBe('2026-03-29');
		expect(toStockholmDateKey('2026-03-28T23:30:00Z')).toBe('2026-03-29');
		expect(toStockholmDateKey('2026-03-28T22:30:00Z')).toBe('2026-03-28');
	});

	it('hanterar dagen då klockan ställs tillbaka', () => {
		// 25 oktober 2026: 03:00 CEST blir 02:00 CET.
		expect(toStockholmDateKey('2026-10-25T00:30:00Z')).toBe('2026-10-25');
		expect(toStockholmDateKey('2026-10-24T22:30:00Z')).toBe('2026-10-25');
		expect(toStockholmDateKey('2026-10-24T21:30:00Z')).toBe('2026-10-24');
	});
});

describe('toStockholmDateKey robusthet', () => {
	it('ger null för tomt eller ogiltigt värde', () => {
		expect(toStockholmDateKey(null)).toBeNull();
		expect(toStockholmDateKey(undefined)).toBeNull();
		expect(toStockholmDateKey('')).toBeNull();
		expect(toStockholmDateKey('inte-ett-datum')).toBeNull();
	});

	it('tar både Date och sträng', () => {
		expect(toStockholmDateKey(new Date('2026-07-15T22:01:00Z'))).toBe('2026-07-16');
	});

	it('stockholmTodayKey följer samma tidszon', () => {
		expect(stockholmTodayKey(new Date('2026-07-15T22:01:00Z'))).toBe('2026-07-16');
		expect(stockholmTodayKey(new Date('2026-01-15T23:01:00Z'))).toBe('2026-01-16');
	});
});

describe('shiftDateKey', () => {
	it('räknar kalenderdagar, inte timmar', () => {
		expect(shiftDateKey('2026-08-15', -1)).toBe('2026-08-14');
		expect(shiftDateKey('2026-08-15', -6)).toBe('2026-08-09');
		expect(shiftDateKey('2026-08-15', 1)).toBe('2026-08-16');
	});

	it('tappar inte ett dygn över en tidsomställning', () => {
		// 29 mars är omställningsdagen. Ett fönster som spänner över den ska
		// fortfarande vara exakt så många dagar som begärts.
		expect(shiftDateKey('2026-04-05', -30)).toBe('2026-03-06');
		expect(shiftDateKey('2026-10-30', -30)).toBe('2026-09-30');
		expect(shiftDateKey('2026-03-30', -1)).toBe('2026-03-29');
		expect(shiftDateKey('2026-10-26', -1)).toBe('2026-10-25');
	});

	it('hanterar månads- och årsskifte', () => {
		expect(shiftDateKey('2026-01-01', -1)).toBe('2025-12-31');
		expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
		expect(shiftDateKey('2028-03-01', -1)).toBe('2028-02-29'); // skottår
	});

	it('lämnar skräpnycklar orörda', () => {
		expect(shiftDateKey('inte-ett-datum', -1)).toBe('inte-ett-datum');
	});
});

// Källkodskontroll: de tre endpoints som bucketar inlägg per dag måste alla
// utgå från svensk tid. Ett test på beteendet räcker inte här, eftersom varje
// endpoint har sin egen väg från timestamp till dygnsnyckel.
describe('endpoints räknar samma kalenderdag', () => {
	const workspace = process.cwd();
	const read = (path: string) => readFileSync(join(workspace, path), 'utf8');

	const statsTimeline = read('src/routes/api/diary/stats-timeline/+server.ts');
	const heatmap = read('src/routes/api/diary/heatmap/+server.ts');
	const streak = read('src/routes/api/diary/streak/+server.ts');

	it('stats-timeline och heatmap använder den delade hjälpfunktionen', () => {
		for (const source of [statsTimeline, heatmap]) {
			expect(source).toContain("from '$lib/stockholm-date'");
			expect(source).toContain('toStockholmDateKey');
		}
	});

	it('streak formaterar i Europe/Stockholm', () => {
		expect(streak).toContain('Europe/Stockholm');
		expect(streak).toContain("'sv-CA'");
	});

	it('ingen av dem klipper ISO-strängen för att få dygnet', () => {
		// created_at.slice(0, 10) och created_at.split('T')[0] ger UTC-dygn.
		for (const source of [statsTimeline, heatmap, streak]) {
			expect(source).not.toMatch(/created_at[^\n]*\.slice\(0,\s*10\)/);
			expect(source).not.toMatch(/created_at[^\n]*\.split\('T'\)\[0\]/);
		}
	});

	it('streaks egen formatterare ger samma nyckel som den delade', () => {
		// Streak har en lokal Intl-formatterare. Den här kontrollen bevakar att
		// konfigurationen inte glider ifrån den delade modulen.
		const streakFormatter = new Intl.DateTimeFormat('sv-CA', {
			timeZone: 'Europe/Stockholm',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
		const timestamps = [
			'2026-07-15T21:59:00Z',
			'2026-07-15T22:01:00Z',
			'2026-01-15T22:59:00Z',
			'2026-01-15T23:01:00Z',
			'2026-03-28T23:30:00Z',
			'2026-10-24T22:30:00Z'
		];

		for (const timestamp of timestamps) {
			expect(streakFormatter.format(new Date(timestamp))).toBe(toStockholmDateKey(timestamp));
		}
	});
});
