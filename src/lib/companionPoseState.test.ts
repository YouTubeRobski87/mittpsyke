import { describe, expect, it } from 'vitest';
import {
	COMPANION_REFLECTION_REACTION_WINDOW_MS,
	COMPANION_RETURN_ABSENCE_THRESHOLD_MS,
	getCompanionAbsenceMs,
	getCompanionBasePose,
	getCompanionScenePosition,
	getMsUntilNextCompanionPoseCheck,
	isReflectionSaveWithinReactionWindow,
	qualifiesAsCompanionReturn,
	recordCompanionSeen
} from './companionPoseState';
import {
	DASHBOARD_CABIN_COMPANION_PLACEMENTS,
	DASHBOARD_CABIN_COPY_SAFE_START_PCT,
	BEAR_SCENE_PLACEMENTS,
	COMPANION_POSES,
	COMPANION_SCENE_CONTEXT_POSITION_IDS,
	COMPANION_SCENE_POSITIONS
} from './companionPoseManifest';
import type { CompanionPoseDaypart } from './companionPoseManifest';

// Minimal Storage-implementation i minnet, samma mönster som används på
// andra ställen för localStorage-beroende kod.
class MemoryStorage implements Storage {
	private store = new Map<string, string>();

	get length() {
		return this.store.size;
	}

	clear(): void {
		this.store.clear();
	}

	getItem(key: string): string | null {
		return this.store.get(key) ?? null;
	}

	key(index: number): string | null {
		return [...this.store.keys()][index] ?? null;
	}

	removeItem(key: string): void {
		this.store.delete(key);
	}

	setItem(key: string, value: string): void {
		this.store.set(key, value);
	}
}

// Fasta tidpunkter i juni (sommartid, UTC+2), en per dagpart som
// companionPoseState faktiskt skiljer på (morgon slås ihop med dag där).
const DAYPART_DATES: Record<CompanionPoseDaypart, Date> = {
	day: new Date('2026-06-15T10:00:00Z'), // 12:00 i Stockholm
	evening: new Date('2026-06-15T17:00:00Z'), // 19:00 i Stockholm
	night: new Date('2026-06-15T00:00:00Z') // 02:00 i Stockholm
};

const DAYPARTS: CompanionPoseDaypart[] = ['day', 'evening', 'night'];

// storage=null i alla anrop nedan så varje getCompanionBasePose-anrop slumpar
// på nytt i stället för att återanvända ett localStorage-cachat val - annars
// skulle testerna bara råka verifiera det första slumpade valet.
describe('getCompanionBasePose', () => {
	it('returnerar bara björnens poser', () => {
		for (const date of Object.values(DAYPART_DATES)) {
			// Kör flera gånger per dagpart eftersom valet är viktat slump.
			for (let i = 0; i < 20; i += 1) {
				const pose = getCompanionBasePose(date, null, 'bear');
				expect(pose.companionId).toBe('bear');
			}
		}
	});

	it('only returns poses available for the requested daypart', () => {
		for (const daypart of DAYPARTS) {
			const pose = getCompanionBasePose(DAYPART_DATES[daypart], null, 'bear');
			expect(pose.dayparts).toContain(daypart);
		}
	});

	it('låter björnen sova 00:20 i Stockholm', () => {
		const stockholm0020 = new Date('2026-06-14T22:20:00Z');
		expect(getCompanionBasePose(stockholm0020, null, 'bear').id).toBe('bear-sleeping');
	});

	it('använder bara lugna björnposer i stugprofilen', () => {
		const calmPoseIds = new Set(['bear-sitting', 'bear-sleeping']);
		for (const date of Object.values(DAYPART_DATES)) {
			const pose = getCompanionBasePose(date, null, 'bear', 'dashboard', 'calm');
			expect(calmPoseIds.has(pose.id)).toBe(true);
		}
	});

	it('uses a sitting or resting pose in the progress scene', () => {
		const expectedPoseIds: Record<CompanionPoseDaypart, string[]> = {
			day: ['bear-sitting'],
			evening: ['bear-sitting'],
			night: ['bear-sleeping']
		};

		for (const daypart of DAYPARTS) {
			const pose = getCompanionBasePose(DAYPART_DATES[daypart], null, 'bear', 'progress', 'resting');
			expect(expectedPoseIds[daypart]).toContain(pose.id);
		}
	});
});

describe('getCompanionScenePosition', () => {
	it('only returns a position that actually allows the given pose', () => {
		for (const date of Object.values(DAYPART_DATES)) {
			for (let i = 0; i < 20; i += 1) {
				const pose = getCompanionBasePose(date, null, 'bear');
				const position = getCompanionScenePosition(pose, date, null, 'bear');
				// Följeslagaren får aldrig stå i en scenposition som inte matchar
				// hur den faktiskt ser ut (fel skala/skugga för posen).
				expect(position.allowedPoseIds).toContain(pose.id);
			}
		}
	});

	it('respects the allowed positions for each scene context', () => {
		for (const scene of ['dashboard', 'progress'] as const) {
			for (const date of Object.values(DAYPART_DATES)) {
				for (let i = 0; i < 20; i += 1) {
					const pose = getCompanionBasePose(date, null, 'bear', scene);
					const position = getCompanionScenePosition(pose, date, null, 'bear', scene);
					expect(COMPANION_SCENE_CONTEXT_POSITION_IDS[scene]).toContain(position.id);
					expect(position.allowedPoseIds).toContain(pose.id);
				}
			}
		}
	});

	it('keeps a calm placement stable until its stored pose period expires', () => {
		const storage = new MemoryStorage();
		const date = DAYPART_DATES.day;
		const pose = getCompanionBasePose(date, storage, 'bear', 'dashboard', 'calm');
		const first = getCompanionScenePosition(pose, date, storage, 'bear', 'dashboard', 'calm');
		const second = getCompanionScenePosition(pose, date, storage, 'bear', 'dashboard', 'calm');
		expect(second.id).toBe(first.id);
	});
});

// Björnen är den enda följeslagaren. Manifestet får inte smyga tillbaka räv,
// varg eller hundar som valbara poser eller placeringar.
describe('björnen är den enda följeslagaren', () => {
	it('har bara björnposer i manifestet', () => {
		expect(COMPANION_POSES.length).toBeGreaterThan(0);
		for (const pose of COMPANION_POSES) {
			expect(pose.companionId).toBe('bear');
			expect(pose.id.startsWith('bear-')).toBe(true);
		}
	});

	it('har bara en dashboardplacering, björnens', () => {
		expect(Object.keys(DASHBOARD_CABIN_COMPANION_PLACEMENTS)).toEqual(['bear']);
	});

	it('har bara scenpositioner som björnen faktiskt kan stå i', () => {
		const bearPoseIds = new Set(COMPANION_POSES.map((pose) => pose.id));
		for (const position of COMPANION_SCENE_POSITIONS) {
			expect(position.allowedPoseIds.length).toBeGreaterThan(0);
			for (const poseId of position.allowedPoseIds) {
				expect(bearPoseIds.has(poseId)).toBe(true);
			}
		}
	});
});

// Hjältetexten på Mitt Hem ligger till höger och får inte kollidera med
// björnen. Den vet inget om var djuret står - den litar på
// DASHBOARD_CABIN_COPY_SAFE_START_PCT. Faller testet ska texten flyttas, inte
// konstanten ändras.
describe('dashboardscenens fria yta för hjältetexten', () => {
	// 39 % är CompanionPose.sveltes största möjliga bredd på desktop, 50 % i
	// mobilbredden (@media (max-width: 620px)).
	const POSE_WIDTH_PCT = 39;
	const COMPACT_POSE_WIDTH_PCT = 50;

	function easternmostCompanionEdge(widthPct: number, compact: boolean) {
		const bear = DASHBOARD_CABIN_COMPANION_PLACEMENTS.bear;
		const placementScale = compact ? (bear.compact?.scale ?? bear.scale) : bear.scale;
		const placementX = compact ? (bear.compact?.x ?? bear.x) : bear.x;
		let edge = 0;
		for (const position of COMPANION_SCENE_POSITIONS) {
			if (!COMPANION_SCENE_CONTEXT_POSITION_IDS.dashboard.includes(position.id)) continue;
			for (const pose of COMPANION_POSES) {
				if (pose.role !== 'base' || !position.allowedPoseIds.includes(pose.id)) continue;
				const scale = position.scale * (pose.sceneAdjustment?.scale ?? 1) * placementScale;
				const centerX = placementX + (pose.sceneAdjustment?.x ?? 0);
				edge = Math.max(edge, centerX + (widthPct / 2) * scale);
			}
		}
		return edge;
	}

	it('behåller björnens dashboardankare', () => {
		const bear = DASHBOARD_CABIN_COMPANION_PLACEMENTS.bear;
		expect(bear).toMatchObject({ scale: 0.68, x: 35, y: 94 });
		expect(bear.compact).toEqual({ scale: 0.72, x: 31, y: 92 });
	});

	it('lämnar hjältetextens yta fri för varje tillåten pose och position', () => {
		expect(easternmostCompanionEdge(POSE_WIDTH_PCT, false)).toBeLessThanOrEqual(
			DASHBOARD_CABIN_COPY_SAFE_START_PCT
		);
		expect(easternmostCompanionEdge(COMPACT_POSE_WIDTH_PCT, true)).toBeLessThanOrEqual(
			DASHBOARD_CABIN_COPY_SAFE_START_PCT
		);
	});
});

describe('björnens ankare på Framsteg', () => {
	it('placerar björnen på en fri markyta framför och till vänster om personen', () => {
		expect(BEAR_SCENE_PLACEMENTS.progress).toMatchObject({
			scale: 1.16,
			right: '44.5%',
			bottom: '8.5%',
			groundLeft: '50.5%',
			groundTop: '91.5%',
			compact: { scale: 1.06, right: '44.5%', bottom: '16%', groundLeft: '50.5%', groundTop: '84%' }
		});
	});

	it('behåller björnposernas skalvärden', () => {
		const poseScale = (id: string) =>
			COMPANION_POSES.find((pose) => pose.id === id)?.sceneAdjustment?.scale;

		expect(poseScale('bear-sleeping')).toBe(0.76);
		expect(poseScale('bear-standing')).toBe(0.82);
		expect(poseScale('bear-sitting')).toBe(0.78);
		expect(poseScale('bear-stretching')).toBe(0.78);
	});
});

describe('getMsUntilNextCompanionPoseCheck', () => {
	it('clamps to the documented 30s-5min window regardless of stored state', () => {
		const ms = getMsUntilNextCompanionPoseCheck(new Date(), null, 'bear');
		expect(ms).toBeGreaterThanOrEqual(30 * 1000);
		expect(ms).toBeLessThanOrEqual(5 * 60 * 1000);
	});
});

describe('getCompanionAbsenceMs', () => {
	it('returns null when there is no previous timestamp (first visit ever)', () => {
		const storage = new MemoryStorage();
		expect(getCompanionAbsenceMs(new Date(), storage, 'bear')).toBeNull();
	});

	it('returns null when no storage is available', () => {
		expect(getCompanionAbsenceMs(new Date(), null, 'bear')).toBeNull();
	});

	it('measures the gap against a previously recorded timestamp', () => {
		const storage = new MemoryStorage();
		const firstVisit = new Date('2026-06-15T10:00:00Z');
		recordCompanionSeen(firstVisit, storage, 'bear');

		const secondVisit = new Date(firstVisit.getTime() + 90 * 60 * 1000); // +90 min
		expect(getCompanionAbsenceMs(secondVisit, storage, 'bear')).toBe(90 * 60 * 1000);
	});

	it('never returns a negative gap even with clock skew', () => {
		const storage = new MemoryStorage();
		const now = new Date('2026-06-15T10:00:00Z');
		recordCompanionSeen(now, storage, 'bear');

		const earlierRead = new Date(now.getTime() - 1000);
		expect(getCompanionAbsenceMs(earlierRead, storage, 'bear')).toBe(0);
	});
});

describe('recordCompanionSeen', () => {
	it('reading the previous timestamp before recording the new one yields the real gap', () => {
		// Skyddar ordningen som funktionerna måste anropas i: läs
		// (getCompanionAbsenceMs) före skriv (recordCompanionSeen). Testet
		// simulerar två besök i följd, precis som CompanionPose.svelte gör i
		// onMount, och kontrollerar att den andra läsningen ser gapet mellan
		// besök ett och två - inte noll, vilket den hade blivit om skrivningen
		// råkat ske innan läsningen.
		const storage = new MemoryStorage();
		const visit1 = new Date('2026-06-15T08:00:00Z');
		const visit2 = new Date('2026-06-15T13:00:00Z'); // +5h

		const gapAtVisit1 = getCompanionAbsenceMs(visit1, storage, 'bear');
		recordCompanionSeen(visit1, storage, 'bear');
		expect(gapAtVisit1).toBeNull(); // inget tidigare besök alls

		const gapAtVisit2 = getCompanionAbsenceMs(visit2, storage, 'bear');
		recordCompanionSeen(visit2, storage, 'bear');
		expect(gapAtVisit2).toBe(5 * 60 * 60 * 1000);
	});

	it('does nothing when no storage is available', () => {
		expect(() => recordCompanionSeen(new Date(), null, 'bear')).not.toThrow();
	});
});

describe('qualifiesAsCompanionReturn', () => {
	it('uses the named threshold constant, currently 4 hours', () => {
		expect(COMPANION_RETURN_ABSENCE_THRESHOLD_MS).toBe(4 * 60 * 60 * 1000);
	});

	it('does not qualify when there is no previous visit to compare against', () => {
		expect(qualifiesAsCompanionReturn(null)).toBe(false);
	});

	it('does not qualify just under the threshold', () => {
		expect(qualifiesAsCompanionReturn(COMPANION_RETURN_ABSENCE_THRESHOLD_MS - 1)).toBe(false);
	});

	it('qualifies exactly at and above the threshold', () => {
		expect(qualifiesAsCompanionReturn(COMPANION_RETURN_ABSENCE_THRESHOLD_MS)).toBe(true);
		expect(qualifiesAsCompanionReturn(COMPANION_RETURN_ABSENCE_THRESHOLD_MS + 1)).toBe(true);
	});

	it('does not qualify for a short gap, e.g. tab switching within the same sitting', () => {
		expect(qualifiesAsCompanionReturn(10 * 60 * 1000)).toBe(false); // 10 min
	});
});

describe('isReflectionSaveWithinReactionWindow', () => {
	it('uses the named threshold constant, currently 6 hours', () => {
		expect(COMPANION_REFLECTION_REACTION_WINDOW_MS).toBe(6 * 60 * 60 * 1000);
	});

	it('is within the window for a save that just happened', () => {
		const now = new Date('2026-06-15T12:00:00Z');
		expect(isReflectionSaveWithinReactionWindow(now.getTime(), now)).toBe(true);
	});

	it('stays within the window just under the threshold', () => {
		const savedAt = new Date('2026-06-15T06:00:00Z').getTime();
		const now = new Date(savedAt + COMPANION_REFLECTION_REACTION_WINDOW_MS - 1);
		expect(isReflectionSaveWithinReactionWindow(savedAt, now)).toBe(true);
	});

	it('is still within the window exactly at the threshold', () => {
		const savedAt = new Date('2026-06-15T06:00:00Z').getTime();
		const now = new Date(savedAt + COMPANION_REFLECTION_REACTION_WINDOW_MS);
		expect(isReflectionSaveWithinReactionWindow(savedAt, now)).toBe(true);
	});

	it('is expired just past the threshold', () => {
		const savedAt = new Date('2026-06-15T06:00:00Z').getTime();
		const now = new Date(savedAt + COMPANION_REFLECTION_REACTION_WINDOW_MS + 1);
		expect(isReflectionSaveWithinReactionWindow(savedAt, now)).toBe(false);
	});

	it('is expired well past the threshold, e.g. a save from yesterday', () => {
		const savedAt = new Date('2026-06-14T12:00:00Z').getTime();
		const now = new Date('2026-06-15T12:00:00Z');
		expect(isReflectionSaveWithinReactionWindow(savedAt, now)).toBe(false);
	});

	it('treats a timestamp in the future (clock skew) as invalid, not as freshly saved', () => {
		const now = new Date('2026-06-15T12:00:00Z');
		const savedAt = now.getTime() + 1000;
		expect(isReflectionSaveWithinReactionWindow(savedAt, now)).toBe(false);
	});
});
