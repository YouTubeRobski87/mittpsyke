import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const mockEnv: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

const inserted: Record<string, unknown>[] = [];
let insertError: { code?: string; message?: string } | null = null;

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: () => ({
		from: (table: string) => {
			expect(table).toBe('framsteg_comprehension_responses');
			return {
				insert: async (row: Record<string, unknown>) => {
					inserted.push(row);
					return { error: insertError };
				}
			};
		}
	}),
	isMissingTableError: (error: { code?: string } | null, _table: string) =>
		error?.code === '42P01'
}));

const {
	createComprehensionUserRef,
	recordFramstegComprehension
} = await import('./framsteg-comprehension');

beforeEach(() => {
	mockEnv.FUNNEL_USER_REF_SALT = 'comprehension-test-salt';
	inserted.length = 0;
	insertError = null;
});

describe('framsteg comprehension storage', () => {
	it('skapar en stabil, domänseparerad pseudonym', () => {
		const first = createComprehensionUserRef('user-1');
		expect(first).toMatch(/^[0-9a-f]{64}$/);
		expect(createComprehensionUserRef('user-1')).toBe(first);
	});

	it('sparar bara de två fasta svaren, fast source och pseudonym', async () => {
		await expect(
			recordFramstegComprehension({
				userId: 'user-1',
				clarity: 'yes',
				worldChange: 'partial'
			})
		).resolves.toBe('written');

		expect(inserted).toHaveLength(1);
		expect(inserted[0]).toEqual({
			user_ref: expect.stringMatching(/^[0-9a-f]{64}$/),
			clarity_answer: 'yes',
			world_change_answer: 'partial',
			source: 'framsteg_comprehension'
		});
	});

	it('har databasunikhet och inga klienträttigheter', () => {
		const sql = readFileSync(
			join(process.cwd(), 'supabase/migrations/20261010160000_framsteg_comprehension_responses.sql'),
			'utf8'
		);
		expect(sql).toMatch(/unique \(user_ref, source\)/);
		expect(sql).toMatch(/enable row level security/);
		expect(sql).toMatch(/revoke all[^;]+from anon/);
		expect(sql).toMatch(/revoke all[^;]+from authenticated/);
		expect(sql).not.toMatch(/comment|mood|diagnos|diary|device|ip_address/i);
	});
});
