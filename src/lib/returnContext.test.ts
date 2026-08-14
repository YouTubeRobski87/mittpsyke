import { describe, expect, it } from 'vitest';
import {
	getReturnContext,
	hasSeenReturnContextInSession,
	recordReturnContextSessionSeen
} from './returnContext';
import { getCompanionBond } from './companionBond';
import { getGardenGrowthPoints } from './worldScene';

class MemoryStorage implements Storage {
	private store = new Map<string, string>();
	get length() { return this.store.size; }
	clear() { this.store.clear(); }
	getItem(key: string) { return this.store.get(key) ?? null; }
	key(index: number) { return [...this.store.keys()][index] ?? null; }
	removeItem(key: string) { this.store.delete(key); }
	setItem(key: string, value: string) { this.store.set(key, value); }
}

const now = new Date('2026-08-14T12:00:00Z'); // 14:00 i Stockholm
const contextAt = (lastSeenAt: Date | null, hasSeenInSession = false) =>
	getReturnContext({ now, lastSeenAt, hasSeenInSession });

describe('getReturnContext', () => {
	it('safely defaults anonymous or unknown history to first visit', () => {
		expect(contextAt(null)).toBe('first_visit');
		expect(contextAt(new Date('invalid'))).toBe('first_visit');
	});

	it('treats navigation in the same session as continuity, not a return', () => {
		expect(contextAt(new Date('2026-08-12T10:00:00Z'), true)).toBe('same_session');
	});

	it('classifies a later visit on the same Stockholm day without exposing a duration', () => {
		expect(contextAt(new Date('2026-08-14T06:00:00Z'))).toBe('same_day');
	});

	it('classifies a short return and a longer return with a fixed clock', () => {
		expect(contextAt(new Date('2026-08-11T12:00:00Z'))).toBe('recent_return');
		expect(contextAt(new Date('2026-08-01T12:00:00Z'))).toBe('longer_return');
	});

	it('stores only a session marker for ordinary route navigation', () => {
		const storage = new MemoryStorage();
		expect(hasSeenReturnContextInSession(storage)).toBe(false);
		recordReturnContextSessionSeen(storage);
		expect(hasSeenReturnContextInSession(storage)).toBe(true);
	});

	it('leaves garden and bond untouched after a longer return', () => {
		const bondBeforeReturn = getCompanionBond(6);
		const gardenBeforeReturn = getGardenGrowthPoints(8, 2);
		expect(contextAt(new Date('2026-08-01T12:00:00Z'))).toBe('longer_return');
		expect(getCompanionBond(6)).toBe(bondBeforeReturn);
		expect(getGardenGrowthPoints(8, 2)).toBe(gardenBeforeReturn);
	});
});
