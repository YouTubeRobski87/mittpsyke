import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadCreativeMomentCount } from './creative-moments';

function countClient(result: { count: number | null; error: { message: string } | null }) {
	const calls: Array<[string, unknown]> = [];
	const query = {
		select: (columns: string, options: unknown) => {
			calls.push(['select', { columns, options }]);
			return query;
		},
		eq: (column: string, value: unknown) => {
			calls.push([column, value]);
			return query;
		},
		gte: (column: string, value: unknown) => {
			calls.push([`gte:${column}`, value]);
			return query;
		},
		lte: (column: string, value: unknown) => {
			calls.push([`lte:${column}`, value]);
			return Promise.resolve(result);
		}
	};
	const client = {
		from: (table: string) => {
			calls.push(['table', table]);
			return query;
		}
	} as unknown as SupabaseClient;
	return { client, calls };
}

describe('loadCreativeMomentCount', () => {
	it('räknar endast användarens Måla i världen-rader under de senaste sju dagarna', async () => {
		const { client, calls } = countClient({ count: 3, error: null });
		const now = new Date('2026-10-04T12:00:00.000Z');

		expect(await loadCreativeMomentCount(client, 'user-1', now)).toBe(3);
		expect(calls).toEqual([
			['table', 'creative_moments'],
			['select', { columns: 'id', options: { count: 'exact', head: true } }],
			['user_id', 'user-1'],
			['activity_type', 'world_coloring'],
			['gte:occurred_at', '2026-09-27T12:00:00.000Z'],
			['lte:occurred_at', '2026-10-04T12:00:00.000Z']
		]);
	});

	it('faller tillbaka till noll om läsningen misslyckas', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const { client } = countClient({ count: null, error: { message: 'databasfel' } });

		expect(await loadCreativeMomentCount(client, 'user-1')).toBe(0);
		expect(consoleSpy).toHaveBeenCalledOnce();
		consoleSpy.mockRestore();
	});
});
