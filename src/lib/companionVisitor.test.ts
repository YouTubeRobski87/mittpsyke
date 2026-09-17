import { describe, expect, it } from 'vitest';
import {
	canShowCompanionVisitorAtViewport,
	COMPANION_VISITOR_MAX_DURATION_MS,
	COMPANION_VISITOR_MIN_DURATION_MS,
	COMPANION_VISITOR_MIN_PAUSE_MS,
	COMPANION_VISITOR_SLEEP_MAX_DURATION_MS,
	COMPANION_VISITOR_SLEEP_MIN_DURATION_MS,
	clearCompanionVisitorState,
	getCompanionVisitorAsset,
	getCompanionVisitorPosition,
	getCompanionVisitorRenderDiagnostics,
	getCompanionVisitorState,
	getStoredCompanionVisitorState,
	isCompanionVisitorDebugEnabled,
	startCompanionVisitorDebugVisit,
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

const DAYTIME_BEAR = { mainCompanionId: 'bear', isSleeping: false, sceneAllowsVisitor: true };
const SLEEPING_BEAR = { mainCompanionId: 'bear', isSleeping: true, sceneAllowsVisitor: true };
const ANONYMOUS_BEAR = { ...DAYTIME_BEAR, isAnonymous: true };
const ANONYMOUS_SLEEPING_BEAR = { ...SLEEPING_BEAR, isAnonymous: true };
const now = 1_700_000_000_000;
const alwaysVisit = () => 0;

const ASSETS_WITHOUT_SLEEPING_VISITOR: CompanionVisitorAssets = {
	awake: {
		fox: '/fox-awake.png'
	},
	sleeping: {}
};

describe('tillfalliga companion-besok', () => {
	it('kan visa en sovande besokare nar huvudfoljeslagaren sover', () => {
		const state = getCompanionVisitorState(SLEEPING_BEAR, now, new MemoryStorage(), alwaysVisit);

		expect(state.visitorId).toBe('fox');
		expect(state.visitorType).toBe('sleeping');
	});

	it('later anonyma anvandare fa vakna besok nar scenen ar eligible', () => {
		const state = getCompanionVisitorState(ANONYMOUS_BEAR, now, new MemoryStorage(), alwaysVisit);

		expect(state).toMatchObject({ visitorId: 'fox', visitorType: 'awake' });
	});

	it('later anonyma anvandare fa sovbesok nar scenen ar eligible', () => {
		const state = getCompanionVisitorState(
			ANONYMOUS_SLEEPING_BEAR,
			now,
			new MemoryStorage(),
			alwaysVisit
		);

		expect(state).toMatchObject({ visitorId: 'fox', visitorType: 'sleeping' });
	});

	it('later relationsniva 2 eller hogre fa besok nar scenen ar eligible', () => {
		for (const relationshipStage of [2, 3, 4]) {
			const bondedBear = { ...DAYTIME_BEAR, relationshipStage };
			const state = getCompanionVisitorState(
				bondedBear,
				now,
				new MemoryStorage(),
				alwaysVisit
			);

			expect(state).toMatchObject({ visitorId: 'fox', visitorType: 'awake' });
		}
	});

	it('anvander endast en riktig sovpose for sovbesok', () => {
		expect(getCompanionVisitorAsset('fox', 'sleeping')).toBe(
			'/images/avatars/presets/fox-realistic-sleeping-curled.png'
		);
		expect(getCompanionVisitorAsset('bear', 'sleeping')).toBeNull();
	});

	it('visar ingen sovande besokare om den korrekta sovposen saknas', () => {
		const state = getCompanionVisitorState(
			SLEEPING_BEAR,
			now,
			new MemoryStorage(),
			alwaysVisit,
			ASSETS_WITHOUT_SLEEPING_VISITOR
		);

		expect(state.visitorId).toBeNull();
		expect(state.visitorType).toBeNull();
	});

	it('anvander aldrig en vaken pose som fallback for sovbesok', () => {
		expect(getCompanionVisitorAsset('fox', 'sleeping', ASSETS_WITHOUT_SLEEPING_VISITOR)).toBeNull();
		expect(getCompanionVisitorAsset('fox', 'awake', ASSETS_WITHOUT_SLEEPING_VISITOR)).toBe(
			'/fox-awake.png'
		);
	});

	it('behaller sovbesoket stabilt mellan renders och under tidsfonstret', () => {
		const storage = new MemoryStorage();
		const first = getCompanionVisitorState(SLEEPING_BEAR, now, storage, alwaysVisit);
		const rerender = getCompanionVisitorState(
			SLEEPING_BEAR,
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
		const visit = getCompanionVisitorState(SLEEPING_BEAR, now, storage, alwaysVisit);
		const expired = getCompanionVisitorState(SLEEPING_BEAR, visit.endsAt!, storage, alwaysVisit);
		const tooEarly = getCompanionVisitorState(
			SLEEPING_BEAR,
			expired.nextEligibleAt - 1,
			storage,
			alwaysVisit
		);

		expect(expired.visitorId).toBeNull();
		expect(expired.nextEligibleAt).toBe(visit.endsAt! + COMPANION_VISITOR_MIN_PAUSE_MS);
		expect(tooEarly.visitorId).toBeNull();
	});

	it('behaller vakna besok enligt de befintliga reglerna', () => {
		const storage = new MemoryStorage();
		const first = getCompanionVisitorState(DAYTIME_BEAR, now, storage, alwaysVisit);
		const rerender = getCompanionVisitorState(DAYTIME_BEAR, now + 5 * 60 * 1000, storage, () => 0.99);

		expect(first.visitorId).toBe('fox');
		expect(first.visitorType).toBe('awake');
		expect(rerender).toEqual(first);
		expect(first.endsAt).toBeGreaterThan(now + COMPANION_VISITOR_MIN_DURATION_MS - 1);
		expect(first.endsAt).toBeLessThanOrEqual(now + COMPANION_VISITOR_MAX_DURATION_MS);
	});

	it('avslutar ett aktivt vaket besok vid somn utan att starta sovbesok i samma utvardering', () => {
		const storage = new MemoryStorage();
		const awake = getCompanionVisitorState(DAYTIME_BEAR, now, storage, alwaysVisit);
		const transition = getCompanionVisitorState(SLEEPING_BEAR, now + 1, storage, alwaysVisit);
		const sameWindow = getCompanionVisitorState(SLEEPING_BEAR, now + 2, storage, alwaysVisit);
		const afterStableWindow = getCompanionVisitorState(
			SLEEPING_BEAR,
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

	it('anvander separata landpositioner for sovbesok och behaller besoket mellan gamla /dashboard och Framsteg', () => {
		const storage = new MemoryStorage();
		const dashboardVisit = getCompanionVisitorState(SLEEPING_BEAR, now, storage, alwaysVisit);
		const progressVisit = getCompanionVisitorState(SLEEPING_BEAR, now + 1_000, storage, () => 0.99);
		const dashboardPosition = getCompanionVisitorPosition('dashboard', 'sleeping');
		const progressPosition = getCompanionVisitorPosition('progress', 'sleeping');

		expect(progressVisit).toEqual(dashboardVisit);
		expect(progressPosition).not.toEqual(dashboardPosition);
		expect(dashboardPosition).toEqual({ x: 60, y: 81, zIndex: 2, scale: 0.88 });
		expect(progressPosition).toEqual({ x: 84, y: 68, zIndex: 3, scale: 0.86 });
		expect(progressPosition.x).toBeGreaterThan(80);
		expect(progressPosition.y).toBeLessThan(70);
	});

	// Gransvardena ar uppmatta mot scenbilden (dashboard-lakeside-world) genom
	// hjaltens faktiska beskarning: pa gamla /dashboard borjar landet vid x ~52 % for
	// container-y over 88 %, pa Framsteg vid x ~62 %. Bada vakna positionerna
	// lag tidigare utanfor de banden, det vill saga i sjon.
	it('placerar aven det vakna besoket pa land i bada scenerna', () => {
		const dashboardPosition = getCompanionVisitorPosition('dashboard', 'awake');
		const progressPosition = getCompanionVisitorPosition('progress', 'awake');

		expect(dashboardPosition).toEqual({ x: 52, y: 93, zIndex: 2, scale: 1 });
		expect(progressPosition).toEqual({ x: 68, y: 92, zIndex: 2, scale: 1 });
		expect(dashboardPosition.y).toBeGreaterThanOrEqual(88);
		expect(dashboardPosition.x).toBeGreaterThanOrEqual(52);
		expect(progressPosition.x).toBeGreaterThanOrEqual(62);
	});

	it('doljs i mobilvy for att undvika trang scen och overflow', () => {
		expect(canShowCompanionVisitorAtViewport(320)).toBe(false);
		expect(canShowCompanionVisitorAtViewport(375)).toBe(false);
		expect(canShowCompanionVisitorAtViewport(768)).toBe(true);
	});

	it('doljs nar scenen ar olampligt fylld utan att radera sessionstillstandet', () => {
		const storage = new MemoryStorage();
		const visit = getCompanionVisitorState(SLEEPING_BEAR, now, storage, alwaysVisit);
		const hidden = getCompanionVisitorState(
			{ ...SLEEPING_BEAR, sceneAllowsVisitor: false },
			now + 1,
			storage,
			alwaysVisit
		);
		const returned = getCompanionVisitorState(SLEEPING_BEAR, now + 2, storage, alwaysVisit);

		expect(hidden.visitorId).toBeNull();
		expect(returned).toEqual(visit);
	});

	it('har debuglaget avstangt som standard och i produktion', () => {
		expect(isCompanionVisitorDebugEnabled('', true)).toBe(false);
		expect(isCompanionVisitorDebugEnabled('?debugVisitor=1', false)).toBe(false);
		expect(isCompanionVisitorDebugEnabled('?debugVisitor=1', true)).toBe(true);
	});

	it('kan tvinga fram ett dev-testbesok utan att andra urvalsregler andras', () => {
		const storage = new MemoryStorage();
		const visit = startCompanionVisitorDebugVisit('bear', 'awake', now, storage);

		expect(visit).toMatchObject({ visitorId: 'fox', visitorType: 'awake', startedAt: now });
		expect(getCompanionVisitorState(DAYTIME_BEAR, now + 1, storage, () => 0.99)).toEqual(visit);
	});

	it('rensning av dev-state aterstaller eligibility', () => {
		const storage = new MemoryStorage();
		startCompanionVisitorDebugVisit('bear', 'sleeping', now, storage);
		clearCompanionVisitorState(storage);
		const next = getCompanionVisitorState(DAYTIME_BEAR, now + 1, storage, alwaysVisit);

		expect(next).toMatchObject({ visitorId: 'fox', visitorType: 'awake', startedAt: now + 1 });
		expect(getStoredCompanionVisitorState(storage)).toEqual(next);
	});

	it('returnerar renderbeslut nar alla villkor ar uppfyllda', () => {
		const state = startCompanionVisitorDebugVisit('bear', 'awake', now, new MemoryStorage());
		const diagnostics = getCompanionVisitorRenderDiagnostics(ANONYMOUS_BEAR, state, true, false, now);

		expect(diagnostics).toEqual({
			assetAvailable: true,
			blockingReason: 'rendering',
			shouldRender: true
		});
	});

	it('returnerar den exakta blockerande orsaken', () => {
		const state = { visitorId: null, visitorType: null, startedAt: null, endsAt: null, nextEligibleAt: now + 1 } as const;
		const cooldown = getCompanionVisitorRenderDiagnostics(DAYTIME_BEAR, state, true, false, now);
		const scene = getCompanionVisitorRenderDiagnostics(
			{ ...DAYTIME_BEAR, sceneAllowsVisitor: false },
			state,
			true,
			false,
			now
		);
		const viewport = getCompanionVisitorRenderDiagnostics(DAYTIME_BEAR, state, false, false, now);

		expect(cooldown.blockingReason).toBe('cooldown-active');
		expect(scene.blockingReason).toBe('scene-ineligible');
		expect(viewport.blockingReason).toBe('viewport-too-narrow');
	});

	it('raven ar enda besokaren och kommer bara till bjornen', () => {
		expect(getCompanionVisitorState(DAYTIME_BEAR, now, new MemoryStorage(), alwaysVisit).visitorId).toBe('fox');
		expect(getCompanionVisitorState(SLEEPING_BEAR, now, new MemoryStorage(), alwaysVisit).visitorId).toBe('fox');
		for (const retired of ['fox', 'wolf', 'schafer', 'australisk_shepherd']) {
			const state = getCompanionVisitorState(
				{ mainCompanionId: retired, isSleeping: false, sceneAllowsVisitor: true },
				now,
				new MemoryStorage(),
				alwaysVisit
			);
			expect(state.visitorId).toBeNull();
		}
		expect(getCompanionVisitorAsset('wolf', 'awake')).toBeNull();
	});

	it('avvisar ett aldre sparat besok dar bjornen sjalv var besokare', () => {
		const storage = new MemoryStorage();
		storage.setItem(
			'mittpsyke:companion-visitor:v1',
			JSON.stringify({ visitorId: 'bear', visitorType: 'awake', startedAt: now, endsAt: now + 60_000, nextEligibleAt: now + 1 })
		);

		expect(getStoredCompanionVisitorState(storage).visitorId).toBeNull();
		expect(getCompanionVisitorState(DAYTIME_BEAR, now, storage, alwaysVisit).visitorId).toBe('fox');
	});
});
