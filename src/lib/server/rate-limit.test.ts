import { describe, expect, it } from 'vitest';
import { RateLimiter } from './rate-limit';

describe('RateLimiter', () => {
	it('allows requests up to the limit within the window', () => {
		const limiter = new RateLimiter(60_000, 3);
		const now = 1_000_000;

		expect(limiter.consume('user:1', now)).toBe(false);
		expect(limiter.consume('user:1', now)).toBe(false);
		expect(limiter.consume('user:1', now)).toBe(false);
		expect(limiter.consume('user:1', now)).toBe(true);
	});

	it('tracks separate keys independently', () => {
		const limiter = new RateLimiter(60_000, 1);
		const now = 1_000_000;

		expect(limiter.consume('user:a', now)).toBe(false);
		expect(limiter.consume('user:b', now)).toBe(false);
		expect(limiter.consume('user:a', now)).toBe(true);
		expect(limiter.consume('user:b', now)).toBe(true);
	});

	it('resets the count once the window has passed', () => {
		const limiter = new RateLimiter(1_000, 1);
		const now = 1_000_000;

		expect(limiter.consume('user:1', now)).toBe(false);
		expect(limiter.consume('user:1', now + 500)).toBe(true);
		expect(limiter.consume('user:1', now + 1_001)).toBe(false);
	});

	it('isLimited reports the current state without counting a new request', () => {
		const limiter = new RateLimiter(60_000, 2);
		const now = 1_000_000;

		expect(limiter.isLimited('user:1', now)).toBe(false);
		limiter.consume('user:1', now);
		expect(limiter.isLimited('user:1', now)).toBe(false);
		limiter.consume('user:1', now);
		expect(limiter.isLimited('user:1', now)).toBe(true);
	});

	it('evicts expired keys once the map grows past maxKeys', () => {
		const limiter = new RateLimiter(1_000, 5, 2);
		const now = 1_000_000;

		limiter.consume('user:1', now);
		limiter.consume('user:2', now);
		// Both keys above expire before "later" - the third consume() call
		// should sweep them out instead of letting the map grow forever.
		const later = now + 2_000;
		limiter.consume('user:3', later);

		expect(limiter.isLimited('user:1', later)).toBe(false);
		expect(limiter.isLimited('user:2', later)).toBe(false);
	});
});
