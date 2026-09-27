import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Regressionsskydd för Supabase-åtkomst (säkerhetsrevision 2026-09-26).
//
// Den verkliga cross-user-verifieringen (user A !== user B) ligger i
// supabase/tests/rls_cross_user.test.sql och körs mot en databas. De här
// testerna fångar i stället de två sätt som en redan stängd läsning brukar
// öppnas igen utan att någon märker det: att ett SQL-skript körs om med den
// gamla policyn, eller att service role-nyckeln hamnar i klientkod.

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const full = join(dir, name);
		return statSync(full).isDirectory() ? walk(full) : [full];
	});
}

/** Tar bort SQL-kommentarer så att förklarande text inte ger falska träffar. */
function stripSqlComments(sql: string) {
	return sql.replace(/--[^\n]*/g, '');
}

const sqlFiles = walk(join(root, 'supabase'))
	.filter((file) => file.endsWith('.sql') && !file.includes(`${join('supabase', 'tests')}`))
	.map((file) => ({ path: relative(root, file), sql: stripSqlComments(readFileSync(file, 'utf8')) }));

const FIX_MIGRATION = 'supabase/migrations/20260926120000_restrict_cross_user_reads.sql';

describe('stängda korsanvändarläsningar förblir stängda', () => {
	it('migrationen stänger analytics_events, profiles och gemenskapens select-policyer', () => {
		const sql = stripSqlComments(read(FIX_MIGRATION));
		expect(sql).toContain('drop policy if exists "analytics_events_select_all"');
		expect(sql).toContain('drop policy if exists "analytics_events_insert_all"');
		expect(sql).toMatch(/revoke all on table public\.analytics_events from anon, authenticated/);
		expect(sql).toContain('drop policy if exists "Public can read profiles"');
		expect(sql).toMatch(/revoke all on table public\.profiles from anon/);
		expect(sql).toContain('drop policy if exists "community_posts_select_authenticated"');
		expect(sql).toContain('drop policy if exists "community_comments_select_authenticated"');
		expect(sql).toMatch(/community_posts_select_own[\s\S]*auth\.uid\(\)\) = user_id/);
		expect(sql).toMatch(/community_comments_select_own[\s\S]*auth\.uid\(\)\) = user_id/);
	});

	it('inget SQL-skript skapar om de öppna analytics-policyerna', () => {
		const offenders = sqlFiles.filter(({ sql }) =>
			/create policy\s+"analytics_events_(select|insert)_all"/i.test(sql)
		);
		expect(offenders.map((file) => file.path)).toEqual([]);
	});

	it('inget SQL-skript gör profiler läsbara för alla', () => {
		const offenders = sqlFiles.filter(({ sql }) =>
			/create policy\s+"Public can read profiles"/i.test(sql) ||
			/on\s+public\.profiles[\s\S]{0,120}using\s*\(\s*true\s*\)/i.test(sql)
		);
		expect(offenders.map((file) => file.path)).toEqual([]);
	});

	it('inget SQL-skript återinför gemenskapens "alla inloggade"-läsning', () => {
		const offenders = sqlFiles.filter(({ sql }) =>
			/create policy\s+"community_(posts|comments)_select_authenticated"/i.test(sql)
		);
		expect(offenders.map((file) => file.path)).toEqual([]);
	});

	it('ingen migration efter fixen ger anon tabellbehörighet på de stängda tabellerna', () => {
		const later = sqlFiles.filter(
			({ path }) =>
				path.startsWith(join('supabase', 'migrations')) &&
				path.replace(/\\/g, '/') > FIX_MIGRATION
		);
		const offenders = later.filter(({ sql }) =>
			/grant\s+[^;]*\s+on\s+(table\s+)?public\.(analytics_events|profiles|community_posts|community_comments)\s+to\s+[^;]*\banon\b/i.test(
				sql
			)
		);
		expect(offenders.map((file) => file.path)).toEqual([]);
	});
});

describe('service role finns bara på servern', () => {
	const clientFiles = walk(join(root, 'src'))
		.map((file) => relative(root, file).replace(/\\/g, '/'))
		.filter((file) => /\.(svelte|ts|js)$/.test(file))
		.filter((file) => !file.endsWith('.test.ts'))
		.filter(
			(file) =>
				!file.includes('/server/') &&
				!/\+(page|layout)\.server\.ts$/.test(file) &&
				!file.endsWith('+server.ts') &&
				!file.endsWith('hooks.server.ts')
		);

	it('klientkod refererar aldrig service role-nyckeln eller admin-klienten', () => {
		const offenders = clientFiles.filter((file) =>
			/SERVICE_ROLE|service_role|supabase-admin|createServiceClient/.test(read(file))
		);
		expect(offenders).toEqual([]);
	});

	it('klientkod importerar aldrig privata env-variabler', () => {
		const offenders = clientFiles.filter((file) =>
			/\$env\/(static|dynamic)\/private/.test(read(file))
		);
		expect(offenders).toEqual([]);
	});

	it('service role-nyckeln läses aldrig från en publik env-modul', () => {
		const offenders = walk(join(root, 'src'))
			.map((file) => relative(root, file).replace(/\\/g, '/'))
			.filter((file) => /\.(svelte|ts|js)$/.test(file) && !file.endsWith('.test.ts'))
			.filter((file) => /publicEnv\.[A-Z_]*SERVICE_ROLE|PUBLIC_[A-Z_]*SERVICE_ROLE/.test(read(file)));
		expect(offenders).toEqual([]);
	});
});
