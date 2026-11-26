#!/usr/bin/env node
// Schemakontroll: jämför tabellerna som koden använder med de tabeller som
// faktiskt finns. Skriptet läser bara. Det kör inga migrationer och skriver
// ingenting till någon databas.
//
// Lägen:
//   node scripts/check-schema.mjs
//       Statisk kontroll: varje tabell som koden använder måste vara deklarerad
//       i supabase/**/*.sql (eller finnas i listan över äldre tabeller nedan).
//   node scripts/check-schema.mjs --snapshot <fil.json>
//       Jämför mot en ögonblicksbild av databasens schema. Formatet är
//       { "tables": { "<tabell>": ["kolumn", ...] } }, till exempel framtaget
//       med en read-only-fråga mot information_schema.columns.
//   node scripts/check-schema.mjs --live
//       Jämför mot PostgREST med PUBLIC_SUPABASE_URL och PUBLIC_SUPABASE_ANON_KEY.
//       Båda värdena är publika (de finns i varje webbläsare som öppnar sajten).
//       Ingen service role-nyckel används eller behövs.
//
// Behörighet är inte samma sak som en saknad tabell. PostgREST:s OpenAPI visar
// bara tabeller som anon-rollen har rättigheter till. En tabell som inte syns
// där provas därför med en tom fråga (limit=0): PGRST205/404 betyder att
// tabellen saknas, 42501/401/403 att den finns men att anon inte får läsa den.
// Bara det första räknas som fel. Allt annat oväntat räknas också som fel,
// så att kontrollen aldrig blir grön av misstag.
//
// Avsiktliga avvikelser står i listorna nedan med motivering. En rad som inte
// längre behövs (tabellen eller kolumnen finns nu) räknas som fel, så att
// listorna inte kan dölja nya problem.
//
// Avslutas med kod 1 om något saknas eller är inaktuellt, 2 om kontrollen
// inte kunde köras.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Tabeller som skapades direkt i den hostade databasen innan SQL-filerna
// versionshanterades. De finns, men saknar deklaration i repot.
export const LEGACY_UNDECLARED_TABLES = new Set([
	'profiles',
	'journal_entries',
	'radar_config',
	'radar_findings',
	'radar_runs',
	'radar_sources'
]);

// Tabeller som koden refererar till men som medvetet saknas tills vidare,
// både i repot och i databasen. Varje rad ska ha en motivering och tas bort
// när tabellen finns.
export const KNOWN_MISSING_TABLES = new Map([
	['reports', 'Gemenskapens rapportfunktion väntar på en egen tabell (separat arbetspaket). Koden hanterar att tabellen saknas.']
]);

// Tabeller som är deklarerade i en migration i repot men som ännu inte har
// körts i databasen. De ger en varning i stället för fel. Koden som använder
// dem måste tåla att tabellen saknas.
export const PENDING_MIGRATION_TABLES = new Map([
	[
		'creative_moments',
		'Migrationen 20261004090000_creative_moments.sql väntar på att migrationsstoppet hävs. Exporten och räknaren tål att tabellen saknas.'
	]
]);

// Kolumner som koden väljer men som saknas i databasen, med motivering.
// Nyckeln är "tabell.kolumn".
export const KNOWN_MISSING_COLUMNS = new Map([
	[
		'journal_entries.tags',
		'Inaktuell kolumn. Väljs bara i reservvägen när tabellen diary saknas (src/lib/state/diary.ts, dagbok/checkin), vilket den aldrig gör i produktion.'
	],
	[
		'journal_entries.mood',
		'Inaktuell kolumn. Väljs bara i reservvägen när tabellen diary saknas (src/lib/state/diary.ts, dagbok/checkin), vilket den aldrig gör i produktion.'
	]
]);

/**
 * @param {string} dir
 * @param {string[]} exts
 * @param {string[]} [out]
 * @returns {string[]}
 */
function walk(dir, exts, out = []) {
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules' || name.startsWith('.')) continue;
		const path = join(dir, name);
		if (statSync(path).isDirectory()) walk(path, exts, out);
		else if (exts.some((ext) => name.endsWith(ext))) out.push(path);
	}
	return out;
}

/** @param {string} path */
function isTestFile(path) {
	return /\.(test|spec)\.[a-z]+$/.test(path) || path.includes('/__tests__/');
}

// Samlar tabellnamn som koden läser eller skriver via Supabase-klienten.
export function collectCodeTables(root = ROOT) {
	const files = walk(join(root, 'src'), ['.ts', '.js', '.svelte']).filter((f) => !isTestFile(f));
	/** @type {Map<string, Set<string>>} */
	const tables = new Map();
	/** @param {string} table @param {string} file */
	const add = (table, file) => {
		const set = tables.get(table) ?? new Set();
		set.add(relative(root, file));
		tables.set(table, set);
	};

	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		if (source.includes('\u0000')) continue;

		// .from('tabell'), men inte storage.from('bucket')
		for (const match of source.matchAll(/(\.storage\s*)?\.from\(\s*['"`]([a-z_][a-z0-9_]*)['"`]\s*\)/g)) {
			if (!match[1]) add(match[2], file);
		}

		// const NAMN_TABLE = 'tabell' som sedan används i .from(NAMN_TABLE)
		for (const match of source.matchAll(/const\s+([A-Z_]*TABLE)\s*=\s*['"`]([a-z_][a-z0-9_]*)['"`]/g)) {
			if (new RegExp(`\\.from\\(\\s*${match[1]}\\s*\\)`).test(source)) add(match[2], file);
		}

		// Tabellistor som loopas igenom, till exempel EXPORT_TABLES
		for (const match of source.matchAll(/const\s+([A-Z_]*TABLES)\s*(?::[^=]+)?=\s*\[([\s\S]*?)\]/g)) {
			const body = match[2];
			// Objektlistor ({ table: 'x', ... }) ger tabellnamnet i fältet table.
			// Rena stränglistor (['a', 'b']) är tabellnamn i sig.
			const pattern = /table\s*:/.test(body)
				? /table\s*:\s*['"`]([a-z_][a-z0-9_]*)['"`]/g
				: /['"`]([a-z_][a-z0-9_]*)['"`]/g;
			for (const name of body.matchAll(pattern)) add(name[1], file);
		}
	}
	return tables;
}

// Samlar tabeller som deklareras med CREATE TABLE i supabase/**/*.sql.
export function collectDeclaredTables(root = ROOT) {
	const declared = new Map();
	for (const file of walk(join(root, 'supabase'), ['.sql'])) {
		if (file.includes('/tests/')) continue;
		const sql = readFileSync(file, 'utf8');
		for (const match of sql.matchAll(
			/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi
		)) {
			const table = match[1].toLowerCase();
			if (!declared.has(table)) declared.set(table, relative(root, file));
		}
	}
	return declared;
}

// Ren jämförelse, så att den kan testas utan filsystem eller nätverk.
/**
 * @typedef {{ table: string, files: string[] }} MissingTable
 * @param {Map<string, Set<string>>} codeTables
 * @param {Set<string>} availableTables
 * @param {{ allowMissing?: Map<string, string> }} [options]
 * @returns {{ missing: MissingTable[], allowed: (MissingTable & { reason: string | undefined })[] }}
 */
export function compareTables(codeTables, availableTables, { allowMissing = new Map() } = {}) {
	const missing = [];
	const allowed = [];
	for (const [table, files] of [...codeTables].sort(([a], [b]) => a.localeCompare(b))) {
		if (availableTables.has(table)) continue;
		const entry = { table, files: [...files].sort() };
		if (allowMissing.has(table)) allowed.push({ ...entry, reason: allowMissing.get(table) });
		else missing.push(entry);
	}
	return { missing, allowed };
}

// Kontrollerar kolumner som anges i enkla .select('a, b')-anrop direkt efter
// .from('tabell'). Mer komplexa urval (relationer, *) hoppas över.
export function collectSelectedColumns(root = ROOT) {
	const files = walk(join(root, 'src'), ['.ts', '.js', '.svelte']).filter((f) => !isTestFile(f));
	const result = new Map();
	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		if (source.includes('\u0000')) continue;
		for (const match of source.matchAll(
			/(?<!storage\s*)\.from\(\s*['"`]([a-z_][a-z0-9_]*)['"`]\s*\)\s*\.select\(\s*['"`]([^'"`]*)['"`]/g
		)) {
			const [, table, list] = match;
			if (list.includes('*') || list.includes('(') || list.includes(':')) continue;
			for (const column of list.split(',').map((c) => c.trim()).filter(Boolean)) {
				if (!/^[a-z_][a-z0-9_]*$/.test(column)) continue;
				if (!result.has(table)) result.set(table, new Map());
				const cols = result.get(table);
				if (!cols.has(column)) cols.set(column, new Set());
				cols.get(column).add(relative(root, file));
			}
		}
		// Tabellistor med { table: 'x', columns: 'a, b' }
		for (const match of source.matchAll(
			/table\s*:\s*['"`]([a-z_][a-z0-9_]*)['"`]\s*,\s*columns\s*:\s*['"`]([^'"`]*)['"`]/g
		)) {
			const [, table, list] = match;
			for (const column of list.split(',').map((c) => c.trim()).filter(Boolean)) {
				if (!/^[a-z_][a-z0-9_]*$/.test(column)) continue;
				if (!result.has(table)) result.set(table, new Map());
				const cols = result.get(table);
				if (!cols.has(column)) cols.set(column, new Set());
				cols.get(column).add(relative(root, file));
			}
		}
	}
	return result;
}

/**
 * @param {Map<string, Map<string, Set<string>>>} selected
 * @param {Map<string, Set<string>>} schemaTables
 * @param {Map<string, string>} [allowMissing]
 * @returns {{ table: string, column: string, files: string[] }[]}
 */
export function compareColumns(selected, schemaTables, allowMissing = new Map()) {
	const missing = [];
	for (const [table, cols] of selected) {
		const available = schemaTables.get(table);
		if (!available) continue; // saknade tabeller rapporteras separat
		for (const [column, files] of cols) {
			if (!available.has(column) && !allowMissing.has(`${table}.${column}`)) missing.push({ table, column, files: [...files].sort() });
		}
	}
	return missing;
}

/**
 * @typedef {'missing' | 'no_access' | 'unknown'} AbsentStatus
 * @typedef {{ kind: string, table: string, column?: string, files: string[], reason?: string }} Finding
 */

/**
 * Bedömer schemat. Ren funktion utan nätverk, så att den kan testas.
 *
 * @param {object} input
 * @param {Map<string, Set<string>>} input.codeTables Tabeller som koden använder
 * @param {Map<string, Map<string, Set<string>>>} input.selectedColumns Kolumner som koden väljer
 * @param {Map<string, Set<string>>} input.schema Synliga tabeller med kolumner
 * @param {Map<string, AbsentStatus>} [input.absentStatus] Status för tabeller som inte syns
 * @returns {{ failures: Finding[], warnings: Finding[], info: Finding[] }}
 */
export function evaluateSchema({ codeTables, selectedColumns, schema, absentStatus = new Map() }) {
	/** @type {Finding[]} */ const failures = [];
	/** @type {Finding[]} */ const warnings = [];
	/** @type {Finding[]} */ const info = [];
	/** @param {string} table */
	const filesOf = (table) => [...(codeTables.get(table) ?? [])].sort();

	for (const table of [...codeTables.keys()].sort()) {
		if (schema.has(table)) {
			if (KNOWN_MISSING_TABLES.has(table) || PENDING_MIGRATION_TABLES.has(table)) {
				failures.push({ kind: 'inaktuellt_undantag', table, files: filesOf(table), reason: 'Tabellen finns nu. Ta bort raden ur undantagslistan.' });
			}
			continue;
		}
		const status = absentStatus.get(table) ?? 'missing';
		if (status === 'no_access') {
			// Tabellen finns. Anon får inte läsa den, så kolumnerna kan inte kontrolleras.
			info.push({ kind: 'ingen_anon_atkomst', table, files: filesOf(table) });
			continue;
		}
		if (status === 'unknown') {
			failures.push({ kind: 'kunde_inte_kontrolleras', table, files: filesOf(table) });
			continue;
		}
		if (KNOWN_MISSING_TABLES.has(table)) {
			info.push({ kind: 'kand_lucka', table, files: filesOf(table), reason: KNOWN_MISSING_TABLES.get(table) });
		} else if (PENDING_MIGRATION_TABLES.has(table)) {
			warnings.push({ kind: 'vantande_migration', table, files: filesOf(table), reason: PENDING_MIGRATION_TABLES.get(table) });
		} else {
			failures.push({ kind: 'saknad_tabell', table, files: filesOf(table) });
		}
	}

	for (const [table, columns] of [...selectedColumns].sort(([a], [b]) => a.localeCompare(b))) {
		const available = schema.get(table);
		if (!available) continue; // saknade tabeller och tabeller utan åtkomst redovisas ovan
		for (const [column, files] of [...columns].sort(([a], [b]) => a.localeCompare(b))) {
			const key = `${table}.${column}`;
			const fileList = [...files].sort();
			if (available.has(column)) {
				if (KNOWN_MISSING_COLUMNS.has(key)) {
					failures.push({ kind: 'inaktuellt_undantag', table, column, files: fileList, reason: 'Kolumnen finns nu. Ta bort raden ur undantagslistan.' });
				}
			} else if (KNOWN_MISSING_COLUMNS.has(key)) {
				info.push({ kind: 'kand_inaktuell_kolumn', table, column, files: fileList, reason: KNOWN_MISSING_COLUMNS.get(key) });
			} else {
				failures.push({ kind: 'saknad_kolumn', table, column, files: fileList });
			}
		}
	}

	return { failures, warnings, info };
}

/**
 * Avgör varför en tabell inte syns i PostgREST:s OpenAPI.
 *
 * @param {number} status HTTP-status för en tom fråga mot tabellen
 * @param {string | undefined} code PostgREST- eller Postgres-felkod i svaret
 * @returns {AbsentStatus | 'visible'}
 */
export function classifyProbe(status, code) {
	if (code === 'PGRST205' || code === '42P01') return 'missing';
	if (code === '42501' || status === 401 || status === 403) return 'no_access';
	if (status >= 200 && status < 300) return 'visible';
	if (status === 404) return 'missing';
	return 'unknown';
}

/**
 * Läser schemat via PostgREST med den publika anon-nyckeln.
 *
 * @param {Map<string, Set<string>>} codeTables
 * @param {typeof fetch} [fetchImpl]
 */
export async function loadLiveSchema(codeTables, fetchImpl = fetch) {
	const url = process.env.PUBLIC_SUPABASE_URL;
	const key = process.env.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !key) throw new Error('PUBLIC_SUPABASE_URL och PUBLIC_SUPABASE_ANON_KEY krävs för --live');
	const base = `${url.replace(/\/$/, '')}/rest/v1`;
	const headers = { apikey: key, Authorization: `Bearer ${key}` };

	const response = await fetchImpl(`${base}/`, { headers: { ...headers, Accept: 'application/openapi+json' } });
	if (!response.ok) throw new Error(`Kunde inte hämta schemat (HTTP ${response.status})`);
	const spec = await response.json();
	/** @type {Map<string, Set<string>>} */
	const schema = new Map();
	for (const [name, def] of Object.entries(spec.definitions ?? {})) {
		schema.set(name, new Set(Object.keys(/** @type {{ properties?: object }} */ (def).properties ?? {})));
	}

	/** @type {Map<string, AbsentStatus>} */
	const absentStatus = new Map();
	for (const table of codeTables.keys()) {
		if (schema.has(table)) continue;
		let status = 0;
		let code;
		try {
			const probe = await fetchImpl(`${base}/${encodeURIComponent(table)}?select=*&limit=0`, { headers });
			status = probe.status;
			code = /** @type {{ code?: string }} */ (await probe.json().catch(() => ({}))).code;
		} catch {
			status = 0;
		}
		const result = classifyProbe(status, code);
		// Synlig vid provning men inte i OpenAPI: finns, men kolumnerna är okända.
		absentStatus.set(table, result === 'visible' ? 'no_access' : result);
	}
	return { schema, absentStatus };
}

/**
 * @param {string} path
 * @returns {Map<string, Set<string>>}
 */
function loadSnapshot(path) {
	const parsed = JSON.parse(readFileSync(path, 'utf8'));
	return new Map(Object.entries(parsed.tables ?? {}).map(([t, cols]) => [t, new Set(cols)]));
}

/**
 * @param {string} title
 * @param {Finding[]} rows
 */
function printFindings(title, rows) {
	if (!rows.length) return;
	console.log(`\n${title}`);
	for (const row of rows) {
		const name = `${row.table}${row.column ? `.${row.column}` : ''}`;
		console.log(`  - [${row.kind}] ${name}  (${row.files.join(', ')})${row.reason ? `\n      ${row.reason}` : ''}`);
	}
}

async function main() {
	const args = process.argv.slice(2);
	const codeTables = collectCodeTables();
	let result;

	if (args.includes('--live') || args.includes('--snapshot')) {
		const selectedColumns = collectSelectedColumns();
		if (args.includes('--live')) {
			const { schema, absentStatus } = await loadLiveSchema(codeTables);
			console.log(`Tabeller i koden: ${codeTables.size}. Synliga i PostgREST: ${schema.size}.`);
			result = evaluateSchema({ codeTables, selectedColumns, schema, absentStatus });
		} else {
			const schema = loadSnapshot(args[args.indexOf('--snapshot') + 1]);
			console.log(`Tabeller i koden: ${codeTables.size}. Tabeller i ögonblicksbilden: ${schema.size}.`);
			result = evaluateSchema({ codeTables, selectedColumns, schema });
		}
	} else {
		const declared = collectDeclaredTables();
		/** @type {Map<string, Set<string>>} */
		const schema = new Map([...declared.keys(), ...LEGACY_UNDECLARED_TABLES].map((t) => [t, new Set()]));
		console.log(`Tabeller i koden: ${codeTables.size}. Deklarerade i supabase/: ${declared.size}.`);
		// Statiskt läge kontrollerar bara tabeller. Väntande migrationer är deklarerade.
		result = evaluateSchema({ codeTables, selectedColumns: new Map(), schema });
		result.failures = result.failures.filter((f) => !(f.kind === 'inaktuellt_undantag' && PENDING_MIGRATION_TABLES.has(f.table)));
		for (const table of LEGACY_UNDECLARED_TABLES) {
			if (declared.has(table)) result.failures.push({ kind: 'inaktuellt_undantag', table, files: [], reason: 'Tabellen är deklarerad nu. Ta bort den ur LEGACY_UNDECLARED_TABLES.' });
		}
	}

	printFindings('Information (inget fel):', result.info);
	printFindings('Varningar:', result.warnings);
	printFindings('FEL:', result.failures);
	const failed = result.failures.length > 0;
	console.log(failed ? '\nSchemakontrollen MISSLYCKADES.' : '\nSchemakontrollen godkänd.');
	process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	main().catch((error) => {
		console.error(`Schemakontrollen kunde inte köras: ${error.message}`);
		process.exit(2);
	});
}
