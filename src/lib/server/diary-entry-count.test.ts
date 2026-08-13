import { describe, expect, it } from 'vitest';
import { loadDiaryEntryCount } from './diary-entry-count';

function createDiaryCountClient(count: number) {
	const query = {
		select: () => query,
		eq: async () => ({ count, error: null })
	};

	return { from: () => query };
}

describe('canonical diary entry count', () => {
	it('uses the same all-time saved-text count for every consumer', async () => {
		const count = await loadDiaryEntryCount(createDiaryCountClient(12) as never, 'user-1');
		expect(count).toBe(12);
	});

	it('falls back safely when the count cannot be read', async () => {
		const failingClient = {
			from: () => ({
				select: () => ({
					eq: async () => ({ count: null, error: { message: 'unavailable' } })
				})
			})
		};
		expect(await loadDiaryEntryCount(failingClient as never, 'user-1')).toBe(0);
	});
});
