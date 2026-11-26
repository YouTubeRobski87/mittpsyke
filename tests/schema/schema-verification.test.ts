// Tester för schemakontrollen (scripts/check-schema.mjs).
// Statiska kontroller mot repot. Ingen databas eller nätverk används.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
	KNOWN_MISSING_COLUMNS,
	KNOWN_MISSING_TABLES,
	PENDING_MIGRATION_TABLES,
	classifyProbe,
	evaluateSchema,
	loadLiveSchema,
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

describe('schemakontroll: bedömning och undantag', () => {
	const files = (name: string) => new Set([name]);
	const codeTables = new Map([
		['diary', files('a.ts')],
		['creative_moments', files('b.ts')],
		['reports', files('c.ts')],
		['brand_new', files('d.ts')],
		['user_ai_consents', files('e.ts')],
		['journal_entries', files('f.ts')]
	]);
	const selectedColumns = new Map([
		['diary', new Map([['text', files('a.ts')], ['ghost', files('a.ts')]])],
		['journal_entries', new Map([['tags', files('f.ts')], ['mood', files('f.ts')], ['content', files('f.ts')]])]
	]);
	const schema = new Map([
		['diary', new Set(['id', 'text'])],
		['journal_entries', new Set(['id', 'content'])]
	]);

	it('skiljer saknad tabell från tabell utan anon-åtkomst', () => {
		const { failures, warnings, info } = evaluateSchema({
			codeTables,
			selectedColumns,
			schema,
			absentStatus: new Map([['user_ai_consents', 'no_access']])
		});
		expect(failures.map((f) => `${f.kind}:${f.table}${f.column ? '.' + f.column : ''}`).sort()).toEqual([
			'saknad_kolumn:diary.ghost',
			'saknad_tabell:brand_new'
		]);
		expect(warnings.map((w) => `${w.kind}:${w.table}`)).toEqual(['vantande_migration:creative_moments']);
		expect(info.map((i) => `${i.kind}:${i.table}${i.column ? '.' + i.column : ''}`).sort()).toEqual([
			'ingen_anon_atkomst:user_ai_consents',
			'kand_inaktuell_kolumn:journal_entries.mood',
			'kand_inaktuell_kolumn:journal_entries.tags',
			'kand_lucka:reports'
		]);
	});

	it('en tabell som inte gick att kontrollera räknas som fel, inte som godkänd', () => {
		const { failures } = evaluateSchema({
			codeTables: new Map([['diary', files('a.ts')]]),
			selectedColumns: new Map(),
			schema: new Map(),
			absentStatus: new Map([['diary', 'unknown']])
		});
		expect(failures.map((f) => f.kind)).toEqual(['kunde_inte_kontrolleras']);
	});

	it('inaktuella undantag blir fel när tabellen eller kolumnen finns', () => {
		const { failures } = evaluateSchema({
			codeTables: new Map([['reports', files('c.ts')], ['creative_moments', files('b.ts')], ['journal_entries', files('f.ts')]]),
			selectedColumns: new Map([['journal_entries', new Map([['tags', files('f.ts')]])]]),
			schema: new Map([
				['reports', new Set(['id'])],
				['creative_moments', new Set(['id'])],
				['journal_entries', new Set(['tags'])]
			])
		});
		expect(failures.map((f) => `${f.table}${f.column ? '.' + f.column : ''}`).sort()).toEqual([
			'creative_moments',
			'journal_entries.tags',
			'reports'
		]);
		expect(failures.every((f) => f.kind === 'inaktuellt_undantag')).toBe(true);
	});

	it('varje undantag har en motivering', () => {
		for (const list of [KNOWN_MISSING_TABLES, PENDING_MIGRATION_TABLES, KNOWN_MISSING_COLUMNS]) {
			for (const [key, reason] of list) expect(reason.length, key).toBeGreaterThan(20);
		}
	});

	it('de två inaktuella kolumnerna i journal_entries är dokumenterade', () => {
		expect(KNOWN_MISSING_COLUMNS.get('journal_entries.tags')).toMatch(/reservvägen/);
		expect(KNOWN_MISSING_COLUMNS.get('journal_entries.mood')).toMatch(/reservvägen/);
	});
});

describe('schemakontroll: PostgREST-provning', () => {
	it('klassar svar korrekt', () => {
		expect(classifyProbe(404, 'PGRST205')).toBe('missing');
		expect(classifyProbe(400, '42P01')).toBe('missing');
		expect(classifyProbe(401, '42501')).toBe('no_access');
		expect(classifyProbe(403, undefined)).toBe('no_access');
		expect(classifyProbe(200, undefined)).toBe('visible');
		expect(classifyProbe(500, undefined)).toBe('unknown');
		expect(classifyProbe(0, undefined)).toBe('unknown');
	});

	it('läser med anon-nyckeln och provar bara tabeller som inte syns i OpenAPI', async () => {
		const calls: { url: string; headers: Record<string, string> }[] = [];
		const json = (status: number, body: unknown) =>
			({ ok: status < 300, status, json: async () => body }) as Response;
		const fakeFetch = (async (url: string, init?: { headers?: Record<string, string> }) => {
			calls.push({ url, headers: init?.headers ?? {} });
			if (url.endsWith('/rest/v1/')) return json(200, { definitions: { diary: { properties: { id: {}, text: {} } } } });
			if (url.includes('/creative_moments?')) return json(404, { code: 'PGRST205' });
			if (url.includes('/user_ai_consents?')) return json(401, { code: '42501' });
			return json(500, {});
		}) as unknown as typeof fetch;

		const previous = { url: process.env.PUBLIC_SUPABASE_URL, key: process.env.PUBLIC_SUPABASE_ANON_KEY };
		process.env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
		process.env.PUBLIC_SUPABASE_ANON_KEY = 'publik-anon-nyckel';
		try {
			const code = new Map([
				['diary', new Set(['a.ts'])],
				['creative_moments', new Set(['b.ts'])],
				['user_ai_consents', new Set(['c.ts'])],
				['flaky', new Set(['d.ts'])]
			]);
			const { schema, absentStatus } = await loadLiveSchema(code, fakeFetch);
			expect([...schema.keys()]).toEqual(['diary']);
			expect(Object.fromEntries(absentStatus)).toEqual({
				creative_moments: 'missing',
				user_ai_consents: 'no_access',
				flaky: 'unknown'
			});
			expect(calls.some((c) => c.url.includes('/diary?'))).toBe(false);
			for (const call of calls) expect(call.headers.apikey).toBe('publik-anon-nyckel');
			// Provningen hämtar aldrig rader
			for (const call of calls.filter((c) => c.url.includes('?'))) expect(call.url).toContain('limit=0');
		} finally {
			if (previous.url === undefined) delete process.env.PUBLIC_SUPABASE_URL;
			else process.env.PUBLIC_SUPABASE_URL = previous.url;
			if (previous.key === undefined) delete process.env.PUBLIC_SUPABASE_ANON_KEY;
			else process.env.PUBLIC_SUPABASE_ANON_KEY = previous.key;
		}
	});

	it('skriptet använder aldrig service role', () => {
		const source = readFileSync(join(process.cwd(), 'scripts/check-schema.mjs'), 'utf8');
		expect(source).not.toMatch(/SERVICE_ROLE|service_role_key/i);
	});
});
