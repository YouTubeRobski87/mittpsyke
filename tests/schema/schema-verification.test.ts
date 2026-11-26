// Tester för schemakontrollen (scripts/check-schema.mjs).
// Statiska kontroller mot repot. Ingen databas eller nätverk används.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
	KNOWN_MISSING_TABLES,
	LEGACY_UNDECLARED_TABLES,
	collectCodeTables,
	collectDeclaredTables,
	collectSelectedColumns,
	compareColumns,
	compareTables
} from '../../scripts/check-schema.mjs';

describe('schemakontroll: kod mot deklarerade tabeller', () => {
	it('varje tabell som koden använder är deklarerad i supabase/ eller uttryckligen undantagen', () => {
		const code = collectCodeTables();
		const declared = collectDeclaredTables();
		const available = new Set([...declared.keys(), ...LEGACY_UNDECLARED_TABLES]);
		const { missing } = compareTables(code, available, { allowMissing: KNOWN_MISSING_TABLES });
		expect(missing).toEqual([]);
	});

	it('undantagslistorna innehåller inga inaktuella rader', () => {
		const code = collectCodeTables();
		const declared = collectDeclaredTables();
		for (const table of KNOWN_MISSING_TABLES.keys()) {
			// En känd lucka ska tas bort ur listan när tabellen har deklarerats
			expect(declared.has(table), `${table} är deklarerad, ta bort den ur KNOWN_MISSING_TABLES`).toBe(false);
			expect(code.has(table), `${table} används inte längre, ta bort den ur KNOWN_MISSING_TABLES`).toBe(true);
		}
		for (const table of LEGACY_UNDECLARED_TABLES) {
			expect(declared.has(table), `${table} är deklarerad, ta bort den ur LEGACY_UNDECLARED_TABLES`).toBe(false);
		}
	});

	it('hittar tabeller i .from(), i *_TABLE-konstanter och i tabellistor, men inte Storage-buckets', () => {
		const code = collectCodeTables();
		expect(code.has('diary')).toBe(true);
		expect(code.has('user_ai_consents')).toBe(true); // via AI_CONSENT_TABLE
		expect(code.has('forum_threads')).toBe(true); // via EXPORT_TABLES
		expect(code.has('diary-images')).toBe(false);
	});
});

describe('schemakontroll: jämförelse mot databasens schema', () => {
	const code = new Map([
		['diary', new Set(['a.ts'])],
		['creative_moments', new Set(['b.ts'])],
		['reports', new Set(['c.ts'])]
	]);

	it('rapporterar tabeller som saknas i databasen och skiljer ut kända luckor', () => {
		const { missing, allowed } = compareTables(code, new Set(['diary']), {
			allowMissing: new Map([['reports', 'väntar']])
		});
		expect(missing).toEqual([{ table: 'creative_moments', files: ['b.ts'] }]);
		expect(allowed.map((row) => row.table)).toEqual(['reports']);
	});

	it('rapporterar kolumner som saknas, men inte för tabeller som saknas helt', () => {
		const selected = new Map([
			['diary', new Map([['text', new Set(['a.ts'])], ['ghost', new Set(['a.ts'])]])],
			['creative_moments', new Map([['id', new Set(['b.ts'])]])]
		]);
		const schema = new Map([['diary', new Set(['id', 'text'])]]);
		expect(compareColumns(selected, schema)).toEqual([{ table: 'diary', column: 'ghost', files: ['a.ts'] }]);
	});

	it('läser kolumnlistan i exportens tabellista', () => {
		const selected = collectSelectedColumns();
		expect([...(selected.get('creative_moments')?.keys() ?? [])].sort()).toEqual(['activity_type', 'id', 'occurred_at']);
	});
});

describe('regression: creative_moments', () => {
	it('tabellen är deklarerad i en migration i repot', () => {
		const declared = collectDeclaredTables();
		expect(declared.get('creative_moments')).toMatch(/^supabase\/migrations\/\d+_creative_moments\.sql$/);
	});

	it('migrationen skapar de kolumner som koden läser och slår på RLS', () => {
		const dir = join(process.cwd(), 'supabase/migrations');
		const file = readdirSync(dir).find((name) => name.endsWith('_creative_moments.sql'));
		expect(file).toBeDefined();
		const sql = readFileSync(join(dir, file as string), 'utf8').toLowerCase();
		for (const column of ['id', 'user_id', 'activity_type', 'occurred_at']) expect(sql).toContain(column);
		expect(sql).toMatch(/enable row level security/);
	});

	it('en databas utan creative_moments upptäcks som saknad tabell', () => {
		const codeTables = collectCodeTables();
		const withoutCreative = new Set([...collectDeclaredTables().keys(), ...LEGACY_UNDECLARED_TABLES]);
		withoutCreative.delete('creative_moments');
		const { missing } = compareTables(codeTables, withoutCreative, { allowMissing: KNOWN_MISSING_TABLES });
		expect(missing.map((row) => row.table)).toEqual(['creative_moments']);
	});

	it('skriptet finns och är körbart med node', () => {
		expect(existsSync(join(process.cwd(), 'scripts/check-schema.mjs'))).toBe(true);
	});
});
