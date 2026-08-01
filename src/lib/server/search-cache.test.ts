import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from './search-cache';

describe('TtlCache', () => {
	it('returns undefined for a missing key', () => {
		const cache = new TtlCache<number>(1000);
		expect(cache.get('missing')).toBeUndefined();
	});

	it('returns a cached value before it expires', () => {
		const cache = new TtlCache<string>(1000);
		cache.set('a', 'value-a');
		expect(cache.get('a')).toBe('value-a');
	});

	it('expires entries once the TTL has passed', () => {
		vi.useFakeTimers();
		try {
			const cache = new TtlCache<string>(1000);
			cache.set('a', 'value-a');
			vi.advanceTimersByTime(1001);
			expect(cache.get('a')).toBeUndefined();
		} finally {
			vi.useRealTimers();
		}
	});

	it('evicts the oldest entry once maxEntries is reached, bounding memory growth', () => {
		const cache = new TtlCache<number>(60_000, 2);
		cache.set('a', 1);
		cache.set('b', 2);
		cache.set('c', 3);

		// "a" was inserted first and should have been evicted to make room for "c".
		expect(cache.get('a')).toBeUndefined();
		expect(cache.get('b')).toBe(2);
		expect(cache.get('c')).toBe(3);
	});
});
