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
import type { CompanionId, CompanionPoseDaypart } from './companionPoseManifest';

// Minimal Storage-implementation i minnet, samma mönster som redan används
// för localStorage-beroende kod i chat-handoff.test.ts.
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

const COMPANION_IDS: CompanionId[] = ['fox', 'bear', 'wolf'];
const DAYPARTS: CompanionPoseDaypart[] = ['day', 'evening', 'night'];

// storage=null i alla anrop nedan så varje getCompanionBasePose-anrop slumpar
// på nytt i stället för att återanvända ett localStorage-cachat val - annars
// skulle testerna bara råka verifiera det första slumpade valet.
describe('getCompanionBasePose', () => {
	it('never returns a pose belonging to a different companion', () => {
		for (const companionId of COMPANION_IDS) {
			for (const date of Object.values(DAYPART_DATES)) {
				// Kör flera gånger per kombination eftersom valet är viktat slump -
				// en bugg som läcker en annan companions pose skulle annars kunna
				// missas av en enstaka slumpad träff.
				for (let i = 0; i < 20; i += 1) {
					const pose = getCompanionBasePose(date, null, companionId);
					expect(pose.companionId ?? 'fox').toBe(companionId);
				}
			}
		}
	});

	it('only returns poses available for the requested daypart', () => {
		for (const companionId of COMPANION_IDS) {
			for (const daypart of DAYPARTS) {
				const pose = getCompanionBasePose(DAYPART_DATES[daypart], null, companionId);
				expect(pose.dayparts).toContain(daypart);
			}
		}
	});

	it('always resolves to a real base pose, even for companions with a single pose (wolf)', () => {
		// Vargen har i dag bara wolf-standing - garanterar att fallback-kedjan
		// (se getFallbackPose) fungerar även när det tillgängliga urvalet är som
		// minst, inte bara när det finns flera alternativ att välja mellan.
		for (const daypart of DAYPARTS) {
			const pose = getCompanionBasePose(DAYPART_DATES[daypart], null, 'wolf');
			expect(pose.id).toBe('wolf-standing');
			expect(pose.role).toBe('base');
		}
	});
});

describe('getCompanionScenePosition', () => {
	it('only returns a position that actually allows the given pose', () => {
		for (const companionId of COMPANION_IDS) {
			for (const date of Object.values(DAYPART_DATES)) {
				for (let i = 0; i < 20; i += 1) {
					const pose = getCompanionBasePose(date, null, companionId);
					const position = getCompanionScenePosition(pose, date, null, companionId);
					// Detta är precis den klassen av bugg som skulle få
					// följeslagaren att stå i en scenposition som inte matchar hur
					// den faktiskt ser ut (fel skala/skugga för posen).
					expect(position.allowedPoseIds).toContain(pose.id);
				}
			}
		}
	});
});

describe('getMsUntilNextCompanionPoseCheck', () => {
	it('clamps to the documented 30s-5min window regardless of stored state', () => {
		const ms = getMsUntilNextCompanionPoseCheck(new Date(), null, 'fox');
		expect(ms).toBeGreaterThanOrEqual(30 * 1000);
		expect(ms).toBeLessThanOrEqual(5 * 60 * 1000);
	});
});

describe('getCompanionAbsenceMs', () => {
	it('returns null when there is no previous timestamp (first visit ever)', () => {
		const storage = new MemoryStorage();
		expect(getCompanionAbsenceMs(new Date(), storage, 'fox')).toBeNull();
	});

	it('returns null when no storage is available', () => {
		expect(getCompanionAbsenceMs(new Date(), null, 'fox')).toBeNull();
	});

	it('measures the gap against a previously recorded timestamp', () => {
		const storage = new MemoryStorage();
		const firstVisit = new Date('2026-06-15T10:00:00Z');
		recordCompanionSeen(firstVisit, storage, 'fox');

		const secondVisit = new Date(firstVisit.getTime() + 90 * 60 * 1000); // +90 min
		expect(getCompanionAbsenceMs(secondVisit, storage, 'fox')).toBe(90 * 60 * 1000);
	});

	it('keeps each companion on its own key, so switching companion does not fake an absence', () => {
		const storage = new MemoryStorage();
		const now = new Date('2026-06-15T10:00:00Z');
		recordCompanionSeen(now, storage, 'fox');

		// Räven har setts, men björnen har aldrig setts på den här enheten.
		expect(getCompanionAbsenceMs(now, storage, 'bear')).toBeNull();
	});

	it('never returns a negative gap even with clock skew', () => {
		const storage = new MemoryStorage();
		const now = new Date('2026-06-15T10:00:00Z');
		recordCompanionSeen(now, storage, 'fox');

		const earlierRead = new Date(now.getTime() - 1000);
		expect(getCompanionAbsenceMs(earlierRead, storage, 'fox')).toBe(0);
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

		const gapAtVisit1 = getCompanionAbsenceMs(visit1, storage, 'fox');
		recordCompanionSeen(visit1, storage, 'fox');
		expect(gapAtVisit1).toBeNull(); // inget tidigare besök alls

		const gapAtVisit2 = getCompanionAbsenceMs(visit2, storage, 'fox');
		recordCompanionSeen(visit2, storage, 'fox');
		expect(gapAtVisit2).toBe(5 * 60 * 60 * 1000);
	});

	it('does nothing when no storage is available', () => {
		expect(() => recordCompanionSeen(new Date(), null, 'fox')).not.toThrow();
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
