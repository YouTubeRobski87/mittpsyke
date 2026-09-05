import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const publicPage = read('./+page.server.ts');
const sharePage = read('./dela/+page.svelte');
const migration = read('../../../supabase/migrations/20260905000519_restrict_anonymous_stories_public_columns.sql');

describe('anonyma berättelsers publika integritet', () => {
	it('väljer bara publika fält till berättelsevyn', () => {
		expect(publicPage).toContain(
			"select('id, content, age_range, gender, emotion_emoji, created_at, approved_at'"
		);
		expect(publicPage).not.toMatch(/select\([^)]*ip_hash/);
	});

	it('tar bort tabellbred SELECT och ger bara kolumnåtkomst till publika fält', () => {
		expect(migration).toMatch(
			/revoke select on table public\.anonymous_stories from anon, authenticated/i
		);
		expect(migration).toMatch(/grant select\s*\([\s\S]*?\)\s*on table public\.anonymous_stories to anon, authenticated/i);
		const publicGrant = migration.match(/grant select\s*\(([\s\S]*?)\)\s*on table public\.anonymous_stories/i)?.[1] ?? '';
		expect(publicGrant).toContain('content');
		expect(publicGrant).toContain('status');
		expect(publicGrant).not.toContain('ip_hash');
		expect(publicGrant).not.toContain('ai_flag_reason');
	});

	it('har ett databasrolltest som nekar anon och authenticated åtkomst till ip_hash', () => {
		const policyTest = read('../../../supabase/tests/anonymous_stories_rls.test.sql');
		expect(policyTest).toContain('set local role anon');
		expect(policyTest).toContain('set local role authenticated');
		expect(policyTest).toMatch(/throws_ok\([\s\S]*select ip_hash[\s\S]*42501/i);
	});

	it('beskriver kontolös inlämning och IP-hash utan absoluta anonymitetslöften', () => {
		expect(sharePage).toContain('Du kan skicka in utan konto.');
		expect(sharePage).toContain('sparar vi en hash av din IP-adress');
		expect(sharePage).toContain('koppla samman flera bidrag från samma IP-adress');
		expect(sharePage).not.toContain('Allt är helt anonymt');
		expect(sharePage).not.toContain('ingen identifierare');
	});
});
