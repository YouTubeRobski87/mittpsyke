import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Supabase before importing the module under test so the module never
// attempts a real network call.
// ---------------------------------------------------------------------------
vi.mock('$lib/supabase', () => ({
	supabase: {
		from: vi.fn()
	}
}));

import { supabase } from '$lib/supabase';
import {
	getDiaryEntries,
	setDiaryEntries,
	clearDiaryEntries,
	loadDiaryEntries
} from './diary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides = {}) {
	return {
		id: 'abc-123',
		content: 'Test entry',
		created_at: '2026-01-01T00:00:00Z',
		tags: ['ångest'],
		mood: 'neutral',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getDiaryEntries / setDiaryEntries / clearDiaryEntries', () => {
	beforeEach(() => {
		clearDiaryEntries();
	});

	it('returns null when no entries have been set', () => {
		expect(getDiaryEntries('user-1')).toBeNull();
	});

	it('returns a copy of the entries after setDiaryEntries', () => {
		const entry = makeEntry();
		setDiaryEntries('user-1', [entry]);

		const result = getDiaryEntries('user-1');
		expect(result).toEqual([entry]);
	});

	it('returns an independent array copy (push does not affect cache)', () => {
		const entry = makeEntry();
		setDiaryEntries('user-1', [entry]);

		const result = getDiaryEntries('user-1')!;
		result.push(makeEntry({ id: 'extra' }));

		// The cached array should still have only the original entry
		expect(getDiaryEntries('user-1')).toHaveLength(1);
	});

	it('isolates cache by userId', () => {
		setDiaryEntries('user-1', [makeEntry({ id: 'u1' })]);
		setDiaryEntries('user-2', [makeEntry({ id: 'u2' })]);

		expect(getDiaryEntries('user-1')![0].id).toBe('u1');
		expect(getDiaryEntries('user-2')![0].id).toBe('u2');
	});

	it('clearDiaryEntries with userId removes only that user', () => {
		setDiaryEntries('user-1', [makeEntry()]);
		setDiaryEntries('user-2', [makeEntry()]);

		clearDiaryEntries('user-1');

		expect(getDiaryEntries('user-1')).toBeNull();
		expect(getDiaryEntries('user-2')).not.toBeNull();
	});

	it('clearDiaryEntries without userId removes all users', () => {
		setDiaryEntries('user-1', [makeEntry()]);
		setDiaryEntries('user-2', [makeEntry()]);

		clearDiaryEntries();

		expect(getDiaryEntries('user-1')).toBeNull();
		expect(getDiaryEntries('user-2')).toBeNull();
	});
});

describe('loadDiaryEntries', () => {
	beforeEach(() => {
		clearDiaryEntries();
		vi.clearAllMocks();
	});

	it('returns [] for empty userId', async () => {
		const result = await loadDiaryEntries('');
		expect(result).toEqual([]);
	});

	it('returns cached entries without hitting Supabase', async () => {
		const entry = makeEntry();
		setDiaryEntries('user-1', [entry]);

		const result = await loadDiaryEntries('user-1');

		expect(result).toEqual([entry]);
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('fetches from Supabase when cache is empty', async () => {
		const row = { id: 'row-1', text: 'Hello', created_at: '2026-01-01T00:00:00Z', tags: ['stress'], mood: 'sad' };

		const mockQuery = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockResolvedValue({ data: [row], error: null })
		};
		vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

		const result = await loadDiaryEntries('user-1');

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('row-1');
		expect(result[0].content).toBe('Hello');
		expect(result[0].tags).toEqual(['stress']);
		expect(result[0].mood).toBe('sad');
	});

	it('re-fetches when force: true even if cache is populated', async () => {
		setDiaryEntries('user-1', [makeEntry({ id: 'cached' })]);

		const freshRow = { id: 'fresh', text: 'Fresh entry', created_at: '2026-02-01T00:00:00Z', tags: [], mood: null };
		const mockQuery = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockResolvedValue({ data: [freshRow], error: null })
		};
		vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

		const result = await loadDiaryEntries('user-1', { force: true });

		expect(result[0].id).toBe('fresh');
	});

	it('falls back to legacy table on PGRST205 error', async () => {
		const legacyRow = {
			id: 'legacy-1',
			content: 'Legacy content',
			created_at: '2025-06-01T00:00:00Z',
			tags: 'legacy,tag',
			mood: 'ok'
		};

		const missingTableError = { code: 'PGRST205', message: 'Table not found' };

		let callCount = 0;
		vi.mocked(supabase.from).mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				// First call — diary table → error
				return {
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					order: vi.fn().mockResolvedValue({ data: null, error: missingTableError })
				} as never;
			}
			// Second call — legacy journal_entries table → success
			return {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockResolvedValue({ data: [legacyRow], error: null })
			} as never;
		});

		const result = await loadDiaryEntries('user-1');

		expect(result).toHaveLength(1);
		expect(result[0].content).toBe('Legacy content');
		// Tags as comma-separated string should be parsed into an array
		expect(result[0].tags).toEqual(['legacy', 'tag']);
	});

	it('throws when both diary and legacy tables are missing', async () => {
		const missingTableError = { code: 'PGRST205', message: 'Table not found' };

		vi.mocked(supabase.from).mockImplementation(() => ({
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockResolvedValue({ data: null, error: missingTableError })
		} as never));

		await expect(loadDiaryEntries('user-1')).rejects.toThrow();
	});

	it('deduplicates concurrent in-flight requests', async () => {
		let resolveQuery!: (value: unknown) => void;
		const pendingPromise = new Promise((res) => { resolveQuery = res; });

		const mockQuery = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnValue(pendingPromise)
		};
		vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

		// Fire two requests before the first one resolves
		const p1 = loadDiaryEntries('user-1');
		const p2 = loadDiaryEntries('user-1');

		// Resolve the mock query
		resolveQuery({ data: [{ id: 'x', text: 'X', created_at: null, tags: [], mood: null }], error: null });

		const [r1, r2] = await Promise.all([p1, p2]);

		// Supabase should only have been called once (deduplication)
		expect(supabase.from).toHaveBeenCalledTimes(1);
		expect(r1).toEqual(r2);
	});
});
