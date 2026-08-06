import { describe, expect, it } from 'vitest';
import {
	canShowCompanionVisitorAtViewport,
	COMPANION_VISITOR_MAX_DURATION_MS,
	COMPANION_VISITOR_MIN_DURATION_MS,
	COMPANION_VISITOR_MIN_PAUSE_MS,
	COMPANION_VISITOR_SLEEP_MAX_DURATION_MS,
	COMPANION_VISITOR_SLEEP_MIN_DURATION_MS,
	getCompanionVisitorAsset,
	getCompanionVisitorPosition,
	getCompanionVisitorState,
	type CompanionVisitorAssets
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
const SLEEPING_FOX = { mainCompanionId: 'fox', isSleeping: true, sceneAllowsVisitor: true };
const SLEEPING_BEAR = { mainCompanionId: 'bear', isSleeping: true, sceneAllowsVisitor: true };
const now = 1_700_000_000_000;
const alwaysVisit = () => 0;

const ASSETS_WITHOUT_SLEEPING_BEAR: CompanionVisitorAssets = {
	awake: {
		fox: '/fox-awake.png',
		bear: '/bear-awake.png'
	},
	sleeping: {
		fox: '/fox-sleeping.png'
	}
};

describe('tillfalliga companion-besok', () => {
	it('kan visa en sovande besokare nar huvudfoljeslagaren sover', () => {
		const state = getCompanionVisitorState(SLEEPING_FOX, now, new MemoryStorage(), alwaysVisit);

		expect(state.visitorId).toBe('bear');
		expect(state.visitorType).toBe('sleeping');
	});

	it('anvander endast en riktig sovpose for sovbesok', () => {
		expect(getCompanionVisitorAsset('fox', 'sleeping')).toBe(
			'/images/avatars/presets/fox-realistic-sleeping-curled.png'
		);
		expect(getCompanionVisitorAsset('bear', 'sleeping')).toBe(
			'/images/avatars/presets/bear-sleeping.png'
		);
	});

	it('visar ingen sovande besokare om den korrekta sovposen saknas', () => {
		const state = getCompanionVisitorState(
			SLEEPING_FOX,
			now,
			new MemoryStorage(),
			alwaysVisit,
			ASSETS_WITHOUT_SLEEPING_BEAR
		);

		expect(state.visitorId).toBeNull();
		expect(state.visitorType).toBeNull();
	});

	it('anvander aldrig en vaken pose som fallback for sovbesok', () => {
		expect(getCompanionVisitorAsset('bear', 'sleeping', ASSETS_WITHOUT_SLEEPING_BEAR)).toBeNull();
		expect(getCompanionVisitorAsset('bear', 'awake', ASSETS_WITHOUT_SLEEPING_BEAR)).toBe(
			'/bear-awake.png'
		);
	});

	it('behaller sovbesoket stabilt mellan renders och under tidsfonstret', () => {
		const storage = new MemoryStorage();
		const first = getCompanionVisitorState(SLEEPING_FOX, now, storage, alwaysVisit);
		const rerender = getCompanionVisitorState(
			SLEEPING_FOX,
			now + 5 * 60 * 1000,
			storage,
			() => 0.99
		);

		expect(rerender).toEqual(first);
		expect(first.endsAt).toBeGreaterThan(now + COMPANION_VISITOR_SLEEP_MIN_DURATION_MS - 1);
		expect(first.endsAt).toBeLessThanOrEqual(now + COMPANION_VISITOR_SLEEP_MAX_DURATION_MS);
	});

	it('tar bort sovbesoket efter sluttiden och respekterar cooldown', () => {
		const storage = new MemoryStorage();
		const visit = getCompanionVisitorState(SLEEPING_FOX, now, storage, alwaysVisit);
		const expired = getCompanionVisitorState(SLEEPING_FOX, visit.endsAt!, storage, alwaysVisit);
		const tooEarly = getCompanionVisitorState(
			SLEEPING_FOX,
			expired.nextEligibleAt - 1,
			storage,
			alwaysVisit
		);

		expect(expired.visitorId).toBeNull();
		expect(expired.nextEligibleAt).toBe(visit.endsAt! + COMPANION_VISITOR_MIN_PAUSE_MS);
		expect(tooEarly.visitorId).toBeNull();
	});

	it('paverkar inte huvudfoljeslagarens pose eller val', () => {
		const mainCompanion = { ...SLEEPING_BEAR };
		const state = getCompanionVisitorState(mainCompanion, now, new MemoryStorage(), alwaysVisit);

		expect(mainCompanion).toEqual(SLEEPING_BEAR);
		expect(state.visitorId).toBe('fox');
		expect(state.visitorType).toBe('sleeping');
	});

	it('behaller vakna besok enligt de befintliga reglerna', () => {
		const storage = new MemoryStorage();
		const first = getCompanionVisitorState(DAYTIME_FOX, now, storage, alwaysVisit);
		const rerender = getCompanionVisitorState(DAYTIME_FOX, now + 5 * 60 * 1000, storage, () => 0.99);

		expect(first.visitorId).toBe('bear');
		expect(first.visitorType).toBe('awake');
		expect(rerender).toEqual(first);
		expect(first.endsAt).toBeGreaterThan(now + COMPANION_VISITOR_MIN_DURATION_MS - 1);
		expect(first.endsAt).toBeLessThanOrEqual(now + COMPANION_VISITOR_MAX_DURATION_MS);
	});

	it('avslutar sakert om huvudfoljeslagaren byts medan ett besok ar aktivt', () => {
		const storage = new MemoryStorage();
		getCompanionVisitorState(DAYTIME_FOX, now, storage, alwaysVisit);
		const afterMainCompanionChange = getCompanionVisitorState(
			DAYTIME_BEAR,
			now + 1,
			storage,
			alwaysVisit
		);

		expect(afterMainCompanionChange.visitorId).toBeNull();
		expect(afterMainCompanionChange.visitorType).toBeNull();
	});

	it('avslutar ett aktivt vaket besok vid somn utan att starta sovbesok i samma utvardering', () => {
		const storage = new MemoryStorage();
		const awake = getCompanionVisitorState(DAYTIME_FOX, now, storage, alwaysVisit);
		const transition = getCompanionVisitorState(SLEEPING_FOX, now + 1, storage, alwaysVisit);
		const sameWindow = getCompanionVisitorState(SLEEPING_FOX, now + 2, storage, alwaysVisit);
		const afterStableWindow = getCompanionVisitorState(
			SLEEPING_FOX,
			transition.nextEligibleAt,
			storage,
			alwaysVisit
		);

		expect(awake.visitorType).toBe('awake');
		expect(transition.visitorId).toBeNull();
		expect(transition.nextEligibleAt).toBe(awake.nextEligibleAt);
		expect(sameWindow.visitorId).toBeNull();
		expect(afterStableWindow.visitorType).toBe('sleeping');
	});

	it('valjer alltid det andra djuret, aldrig en kopia av huvudfoljeslagaren', () => {
		expect(getCompanionVisitorState(DAYTIME_FOX, now, new MemoryStorage(), alwaysVisit).visitorId).toBe('bear');
		expect(getCompanionVisitorState(DAYTIME_BEAR, now, new MemoryStorage(), alwaysVisit).visitorId).toBe('fox');
		expect(getCompanionVisitorState(SLEEPING_FOX, now, new MemoryStorage(), alwaysVisit).visitorId).toBe('bear');
		expect(getCompanionVisitorState(SLEEPING_BEAR, now, new MemoryStorage(), alwaysVisit).visitorId).toBe('fox');
	});

	it('anvander separata sovpositioner och behaller sovbesoket mellan Mitt Hem och Framsteg', () => {
		const storage = new MemoryStorage();
		const dashboardVisit = getCompanionVisitorState(SLEEPING_FOX, now, storage, alwaysVisit);
		const progressVisit = getCompanionVisitorState(SLEEPING_FOX, now + 1_000, storage, () => 0.99);
		const dashboardPosition = getCompanionVisitorPosition('dashboard', 'sleeping');
		const progressPosition = getCompanionVisitorPosition('progress', 'sleeping');

		expect(progressVisit).toEqual(dashboardVisit);
		expect(progressPosition).not.toEqual(dashboardPosition);
		expect(progressPosition.x).toBeLessThan(50);
		expect(progressPosition.zIndex).toBeLessThan(2);
	});

	it('doljs i mobilvy for att undvika trang scen och overflow', () => {
		expect(canShowCompanionVisitorAtViewport(320)).toBe(false);
		expect(canShowCompanionVisitorAtViewport(375)).toBe(false);
		expect(canShowCompanionVisitorAtViewport(768)).toBe(true);
	});

	it('doljs nar scenen ar olampligt fylld utan att radera sessionstillstandet', () => {
		const storage = new MemoryStorage();
		const visit = getCompanionVisitorState(SLEEPING_FOX, now, storage, alwaysVisit);
		const hidden = getCompanionVisitorState(
			{ ...SLEEPING_FOX, sceneAllowsVisitor: false },
			now + 1,
			storage,
			alwaysVisit
		);
		const returned = getCompanionVisitorState(SLEEPING_FOX, now + 2, storage, alwaysVisit);

		expect(hidden.visitorId).toBeNull();
		expect(returned).toEqual(visit);
	});
});
