// Integrationstest för dataexporten mot en isolerad, lokal PostgreSQL.
//
// Testet bygger schemat från repots SQL-filer (samma RLS-policyer som i
// produktion, med de avvikelser som beskrivs i legacy-tables.sql), lägger in
// syntetiska data för två användare och kör exportens frågor som användare A.
//
// Körs bara när EXPORT_IT_DATABASE_URL pekar på en tom databas, till exempel
// via scripts/test-export-isolation.sh. Får aldrig pekas mot produktion.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

const DATABASE_URL = process.env.EXPORT_IT_DATABASE_URL ?? '';
const ROOT = process.cwd();
const HERE = join(ROOT, 'tests/integration/export');

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';

type ExportTable = { key: string; table: string; columns: string; orderBy: string; userColumn?: string };

function psql(sql: string): string {
	return execFileSync('psql', [DATABASE_URL, '-X', '-q', '-tA', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
		encoding: 'utf8'
	}).trim();
}

function psqlFile(path: string) {
	execFileSync('psql', [DATABASE_URL, '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-f', path], { stdio: 'pipe' });
}

/** Kör en fråga som en inloggad användare, så att RLS gäller. */
function asUser(userId: string, sql: string): string {
	return psql(
		`begin; set local role authenticated; ` +
			`set local "request.jwt.claim.sub" = '${userId}'; ` +
			`set local "request.jwt.claim.role" = 'authenticated'; ` +
			`${sql}; commit;`
	);
}

function asServiceRole(sql: string): string {
	return psql(`begin; set local role service_role; ${sql}; commit;`);
}

function rowsJson(raw: string): Record<string, unknown>[] {
	return raw ? (JSON.parse(raw) as Record<string, unknown>[] | null) ?? [] : [];
}

// Ordningen spelar roll: tabeller som andra filer refererar till skapas först.
// radar.sql och content_embeddings kräver tillägg (pg_net, vector) som inte
// finns lokalt och rör inte exporten. migrate_journal_entries_to_diary.sql
// är en engångsflytt av data, inte schema, och förutsätter kolumner som den
// hostade journal_entries saknar.
function schemaFiles(): string[] {
	const base = readdirSync(join(ROOT, 'supabase'))
		.filter((name) => name.endsWith('.sql'))
		.filter((name) => !['radar.sql', 'diary.sql', 'admin_system.sql', 'community_posts.sql', 'migrate_journal_entries_to_diary.sql'].includes(name))
		.sort()
		.map((name) => join(ROOT, 'supabase', name));
	const migrations = readdirSync(join(ROOT, 'supabase/migrations'))
		.filter((name) => name.endsWith('.sql') && !name.includes('content_embeddings'))
		.sort()
		.map((name) => join(ROOT, 'supabase/migrations', name));
	return [
		join(ROOT, 'supabase/diary.sql'),
		join(ROOT, 'supabase/admin_system.sql'),
		join(ROOT, 'supabase/community_posts.sql'),
		...base,
		...migrations
	];
}

describe.skipIf(!DATABASE_URL)('dataexport mot isolerad databas', () => {
	let exportTables: readonly ExportTable[] = [];
	let serviceTables: readonly ExportTable[] = [];

	beforeAll(async () => {
		// Skydd: testet vägrar köra mot något som inte är en tom, lokal databas.
		expect(DATABASE_URL).toMatch(/localhost|127\.0\.0\.1|host=\/|@\/|%2F/);
		expect(psql(`select count(*) from information_schema.tables where table_schema = 'public'`)).toBe('0');

		psqlFile(join(HERE, 'bootstrap.sql'));
		psqlFile(join(HERE, 'legacy-tables.sql'));
		for (const file of schemaFiles()) psqlFile(file);
		psqlFile(join(HERE, 'seed.sql'));

		const module = await import('../../../src/routes/api/account/export/+server');
		exportTables = module._EXPORT_TABLES;
		serviceTables = module._SERVICE_SECTIONS.map((section) => ({ ...section, orderBy: 'created_at' }));
	}, 120_000);

	it('varje exporttabell ger användarens egna rader och inga andras', () => {
		for (const spec of exportTables) {
			const userColumn = spec.userColumn ?? 'user_id';
			const raw = asUser(
				USER_A,
				`select json_agg(t) from (select ${spec.columns} from public.${spec.table} ` +
					`where ${userColumn} = '${USER_A}' order by ${spec.orderBy}) t`
			);
			const rows = rowsJson(raw);
			expect(rows.length, `${spec.table}: inga egna rader`).toBeGreaterThan(0);
			expect(JSON.stringify(rows), spec.table).not.toContain('ANVANDARE_B');
			expect(JSON.stringify(rows), spec.table).not.toContain(USER_B);
		}
	});

	it('RLS stoppar andras rader även om exportens filter skulle saknas eller vara fel', () => {
		for (const spec of exportTables) {
			const userColumn = spec.userColumn ?? 'user_id';
			const count = asUser(USER_A, `select count(*) from public.${spec.table} where ${userColumn} = '${USER_B}'`);
			expect(count, `${spec.table} släpper igenom en annan användares rader`).toBe('0');
		}
	});

	it('meddelanden nås bara via egna samtal', () => {
		const own = asUser(
			USER_A,
			`select count(*) from public.messages where conversation_id in (select id from public.conversations where user_id = '${USER_A}')`
		);
		const others = asUser(
			USER_A,
			`select count(*) from public.messages where conversation_id in (select id from public.conversations where user_id = '${USER_B}')`
		);
		expect(own).toBe('1');
		expect(others).toBe('0');
	});

	it('tabeller utan SELECT-policy går inte att läsa som användare, därför läses de med service role', () => {
		for (const spec of serviceTables) {
			const userColumn = spec.userColumn ?? 'user_id';
			// Som användaren blir det antingen noll rader utan fel (forum_reports:
			// rättighet finns men ingen policy) eller ett behörighetsfel
			// (user_ai_consents: ingen rättighet alls). I det första fallet skulle
			// exporten se fullständig ut fast data saknas.
			let asOwner: string;
			try {
				asOwner = asUser(USER_A, `select count(*) from public.${spec.table} where ${userColumn} = '${USER_A}'`);
			} catch (error) {
				asOwner = String((error as { stderr?: Buffer }).stderr ?? error).includes('permission denied') ? 'nekad' : 'fel';
			}
			expect(['0', 'nekad'], `${spec.table} går att läsa som användare, flytta den till _EXPORT_TABLES`).toContain(asOwner);

			const raw = asServiceRole(
				`select json_agg(t) from (select ${spec.columns} from public.${spec.table} where ${userColumn} = '${USER_A}') t`
			);
			const rows = rowsJson(raw);
			expect(rows.length, spec.table).toBe(1);
			expect(JSON.stringify(rows)).not.toContain('ANVANDARE_B');
		}
	});

	it('exportens kolumnlistor finns i schemat', () => {
		for (const spec of [...exportTables, ...serviceTables]) {
			const columns = spec.columns.split(',').map((column) => column.trim());
			const existing = psql(
				`select string_agg(column_name, ',') from information_schema.columns where table_schema = 'public' and table_name = '${spec.table}'`
			).split(',');
			for (const column of columns) expect(existing, `${spec.table}.${column}`).toContain(column);
		}
	});

	it('exporten utelämnar en annan användares id i notiser', () => {
		const spec = exportTables.find((table) => table.table === 'notifications');
		expect(spec?.columns).not.toContain('actor_user_id');
	});
});
