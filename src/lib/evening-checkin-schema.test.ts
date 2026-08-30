import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	EVENING_CALM_PARKING_BUCKETS,
	EVENING_PARKING_BUCKETS,
	EVENING_THEMES
} from './evening-checkin';

/* Appens värden och databasens CHECK-villkor är två separata sanningar, och när
   de glider isär går allt igenom valideringen men faller på INSERT med SQLSTATE
   23514. Det hände live när 'feeling_okay' och den lugna parkeringen lades till
   utan migration. Testerna nedan läser den faktiska migrationskatalogen, så ett
   nytt värde utan matchande migration fäller bygget i stället för sparandet. */

const MIGRATIONS_DIRECTORY = join(process.cwd(), 'supabase/migrations');

/** All migrations-SQL sammanslagen: villkoren får ha flyttats mellan filer. */
const allMigrations = readdirSync(MIGRATIONS_DIRECTORY)
	.filter((file) => file.endsWith('.sql'))
	.map((file) => readFileSync(join(MIGRATIONS_DIRECTORY, file), 'utf8'))
	.join('\n');

/** Den senast definierade tillåtna listan för en kolumn. */
function latestAllowedValues(column: string): string[] {
	const pattern = new RegExp(`${column}\\s+in\\s*\\(([^)]*)\\)`, 'gis');
	const matches = [...allMigrations.matchAll(pattern)];
	expect(matches.length, `hittade inget CHECK-villkor för ${column}`).toBeGreaterThan(0);

	return [...(matches.at(-1)?.[1].matchAll(/'([^']+)'/g) ?? [])].map((match) => match[1]);
}

describe('Databasens CHECK-villkor känner till alla värden appen kan spara', () => {
	it('tillåter varje tema i EVENING_THEMES', () => {
		const allowed = latestAllowedValues('theme_id');

		for (const theme of EVENING_THEMES) {
			expect(allowed, `theme_id saknar ${theme.id}`).toContain(theme.id);
		}
	});

	it('tillåter både den ordinarie och den lugna parkeringsuppsättningen', () => {
		const allowed = latestAllowedValues('parking_bucket');

		for (const bucket of [...EVENING_PARKING_BUCKETS, ...EVENING_CALM_PARKING_BUCKETS]) {
			expect(allowed, `parking_bucket saknar ${bucket.id}`).toContain(bucket.id);
		}
	});

	it('tar aldrig bort ett värde som redan kan finnas sparat', () => {
		// Migrationer är additiva. Försvinner ett gammalt värde blir befintliga
		// rader ogiltiga vid nästa constraint-validering.
		expect(latestAllowedValues('theme_id')).toEqual(
			expect.arrayContaining(['racing_thoughts', 'body_anxiety', 'loneliness', 'tomorrow', 'other'])
		);
		expect(latestAllowedValues('parking_bucket')).toEqual(
			expect.arrayContaining(['tomorrow', 'small_step', 'not_tonight'])
		);
	});
});
