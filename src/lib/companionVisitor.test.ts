import { describe, expect, it } from 'vitest';
import {
	canShowCompanionVisitorAtViewport,
	COMPANION_VISITOR_MIN_PAUSE_MS,
	getCompanionVisitorAsset,
	getCompanionVisitorPosition,
	getCompanionVisitorState
} from './companionVisitor';

class MemoryStorage implements Storage {
	private store = new Map<string, string>();
	get length() { return this.store.size; }
	clear() { this.store.clear(); }
	getItem(key: string) { return this.store.get(key) ?? null; }
	key(index: number) { return [...this.store.keys()][index] ?? null; }
	removeItem(key: string) { this.store.delete(key); }
	setItem(key: string, value: string) { this.store.set(key, value); }
}

const DAYTIME_FOX = { mainCompanionId: 'fox', isSleeping: false, sceneAllowsVisitor: true };
const DAYTIME_BEAR = { mainCompanionId: 'bear', isSleeping: false, sceneAllowsVisitor: true };
const now = 1_700_000_000_000;
const alwaysVisit = () => 0;

describe('tillfälliga companion-besök', () => {
	it('visar ingen besökare när huvudföljeslagaren sover', () => {
		const storage = new MemoryStorage();
		const state = getCompanionVisitorState({ ...DAYTIME_FOX, isSleeping: true }, now, storage, alwaysVisit);
		expect(state.visitorId).toBeNull();
	});

	it('väljer inte om besökaren vid varje render och behåller besöket under tidsfönstret', () => {
		const storage = new MemoryStorage();
		const first = getCompanionVisitorState(DAYTIME_FOX, now, storage, alwaysVisit);
		const rerender = getCompanionVisitorState(DAYTIME_FOX, now + 5 * 60 * 1000, storage, () => 0.99);

		expect(first.visitorId).toBe('bear');
		expect(rerender).toEqual(first);
		expect(first.endsAt).toBeGreaterThan(now + 20 * 60 * 1000 - 1);
		expect(first.endsAt).toBeLessThanOrEqual(now + 40 * 60 * 1000);
	});

	it('tar bort besökaren efter slutet och spärrar nytt besök fram till nextEligibleAt', () => {
		const storage = new MemoryStorage();
		const visit = getCompanionVisitorState(DAYTIME_FOX, now, storage, alwaysVisit);
		const expired = getCompanionVisitorState(DAYTIME_FOX, visit.endsAt!, storage, alwaysVisit);
		const tooEarly = getCompanionVisitorState(DAYTIME_FOX, expired.nextEligibleAt - 1, storage, alwaysVisit);

		expect(expired.visitorId).toBeNull();
		expect(expired.nextEligibleAt).toBe(visit.endsAt! + COMPANION_VISITOR_MIN_PAUSE_MS);
		expect(tooEarly.visitorId).toBeNull();
	});

	it('väljer alltid det andra djuret, aldrig en kopia av huvudföljeslagaren', () => {
		expect(getCompanionVisitorState(DAYTIME_FOX, now, new MemoryStorage(), alwaysVisit).visitorId).toBe('bear');
		expect(getCompanionVisitorState(DAYTIME_BEAR, now, new MemoryStorage(), alwaysVisit).visitorId).toBe('fox');
	});

	it('har säker asset-fallback och låter inte en saknad art renderas', () => {
		expect(getCompanionVisitorAsset('fox')).toContain('fox-realistic-resting-sitting.png');
		expect(getCompanionVisitorAsset('bear')).toContain('bear-sitting.png');
		expect(getCompanionVisitorAsset('wolf')).toBeNull();
	});

	it('ändrar inte huvudföljeslagarens val och avslutar säkert vid ett byte', () => {
		const storage = new MemoryStorage();
		getCompanionVisitorState(DAYTIME_FOX, now, storage, alwaysVisit);
		const afterMainCompanionChange = getCompanionVisitorState(DAYTIME_BEAR, now + 1, storage, alwaysVisit);

		expect(DAYTIME_BEAR.mainCompanionId).toBe('bear');
		expect(afterMainCompanionChange.visitorId).toBeNull();
	});

	it('använder separat scenposition och återställer samma besök vid navigation', () => {
		const storage = new MemoryStorage();
		const dashboardVisit = getCompanionVisitorState(DAYTIME_FOX, now, storage, alwaysVisit);
		const progressVisit = getCompanionVisitorState(DAYTIME_FOX, now + 1_000, storage, () => 0.99);
		const dashboardPosition = getCompanionVisitorPosition('dashboard');
		const progressPosition = getCompanionVisitorPosition('progress');

		expect(progressVisit).toEqual(dashboardVisit);
		expect(progressPosition).not.toEqual(dashboardPosition);
		expect(progressPosition.x).toBeLessThan(50);
	});

	it('döljs i mobilvy för att undvika trång scen och overflow', () => {
		expect(canShowCompanionVisitorAtViewport(320)).toBe(false);
		expect(canShowCompanionVisitorAtViewport(375)).toBe(false);
		expect(canShowCompanionVisitorAtViewport(768)).toBe(true);
	});

	it('döljs när scenen redan är olämpligt fylld utan att radera sessionstillståndet', () => {
		const storage = new MemoryStorage();
		const visit = getCompanionVisitorState(DAYTIME_FOX, now, storage, alwaysVisit);
		const hidden = getCompanionVisitorState({ ...DAYTIME_FOX, sceneAllowsVisitor: false }, now + 1, storage, alwaysVisit);
		const returned = getCompanionVisitorState(DAYTIME_FOX, now + 2, storage, alwaysVisit);

		expect(hidden.visitorId).toBeNull();
		expect(returned).toEqual(visit);
	});
});
