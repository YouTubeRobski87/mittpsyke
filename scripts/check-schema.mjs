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
//       Hämtar PostgREST:s OpenAPI-beskrivning med PUBLIC_SUPABASE_URL och
//       PUBLIC_SUPABASE_ANON_KEY (bara läsning) och jämför mot den.
//
// Avslutas med kod 1 om något saknas, så att det kan stoppa en release.

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

// Tabeller som koden refererar till men som medvetet saknas tills vidare.
// Varje rad ska ha en motivering och tas bort när tabellen finns.
export const KNOWN_MISSING_TABLES = new Map([
	['reports', 'Gemenskapens rapportfunktion väntar på en egen tabell (separat arbetspaket).']
]);

// Kolumner som koden väljer men som saknas i databasen, med motivering.
// Nyckeln är "tabell.kolumn".
export const KNOWN_MISSING_COLUMNS = new Map([
	['journal_entries.tags', 'Reservväg som bara körs om tabellen diary saknas. Död kod i produktion.'],
	['journal_entries.mood', 'Reservväg som bara körs om tabellen diary saknas. Död kod i produktion.']
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

async function loadLiveSchema() {
	const url = process.env.PUBLIC_SUPABASE_URL;
	const key = process.env.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !key) throw new Error('PUBLIC_SUPABASE_URL och PUBLIC_SUPABASE_ANON_KEY krävs för --live');
	const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
		headers: { apikey: key, Accept: 'application/openapi+json' }
	});
	if (!response.ok) throw new Error(`Kunde inte hämta schemat (HTTP ${response.status})`);
	const spec = await response.json();
	const tables = new Map();
	for (const [name, def] of Object.entries(spec.definitions ?? {})) {
		tables.set(name, new Set(Object.keys(def.properties ?? {})));
	}
	return tables;
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
 * @param {{ table: string, column?: string, files: string[] }[]} rows
 */
function printMissing(title, rows) {
	console.log(`\n${title}`);
	for (const row of rows) console.log(`  - ${row.table}${row.column ? `.${row.column}` : ''}  (${row.files.join(', ')})`);
}

async function main() {
	const args = process.argv.slice(2);
	const codeTables = collectCodeTables();
	let failed = false;

	if (args.includes('--live') || args.includes('--snapshot')) {
		const snapshotPath = args[args.indexOf('--snapshot') + 1];
		const schema = args.includes('--live') ? await loadLiveSchema() : loadSnapshot(snapshotPath);
		// I läget mot databasen saknar PostgREST ibland tabeller som anon inte ser,
		// därför rapporteras de men listas tydligt som möjlig behörighetsfråga.
		const { missing, allowed } = compareTables(codeTables, new Set(schema.keys()), {
			allowMissing: KNOWN_MISSING_TABLES
		});
		const missingColumns = compareColumns(collectSelectedColumns(), schema, KNOWN_MISSING_COLUMNS);
		console.log(`Tabeller i koden: ${codeTables.size}. Tabeller i schemat: ${schema.size}.`);
		if (allowed.length) printMissing('Kända luckor (tillåtna tills vidare):', allowed);
		if (missing.length) printMissing('SAKNAS i databasen:', missing);
		if (missingColumns.length) printMissing('Kolumner som SAKNAS i databasen:', missingColumns);
		failed = missing.length > 0 || missingColumns.length > 0;
	} else {
		const declared = collectDeclaredTables();
		const available = new Set([...declared.keys(), ...LEGACY_UNDECLARED_TABLES]);
		const { missing, allowed } = compareTables(codeTables, available, { allowMissing: KNOWN_MISSING_TABLES });
		console.log(`Tabeller i koden: ${codeTables.size}. Deklarerade i supabase/: ${declared.size}.`);
		if (allowed.length) printMissing('Kända luckor (tillåtna tills vidare):', allowed);
		if (missing.length) printMissing('Används i koden men deklareras inte i supabase/:', missing);
		failed = missing.length > 0;
	}

	console.log(failed ? '\nSchemakontrollen MISSLYCKADES.' : '\nSchemakontrollen godkänd.');
	process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	main().catch((error) => {
		console.error(`Schemakontrollen kunde inte köras: ${error.message}`);
		process.exit(2);
	});
}
