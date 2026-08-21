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
	COMPANION_SCENE_POSITIONS,
	WOLF_SCENE_PLACEMENTS
} from './companionPoseManifest';
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

const COMPANION_IDS = ['fox', 'bear', 'wolf'] as const satisfies CompanionId[];
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

	it('uses the sleeping wolf pose at 00:20 in Stockholm and standing pose during the day', () => {
		// Nattposen kommer från samma gemensamma poseval som de andra följeslagarna.
		const stockholm0020 = new Date('2026-06-14T22:20:00Z');
		const stockholmNoon = new Date('2026-06-15T10:00:00Z');

		expect(getCompanionBasePose(stockholm0020, null, 'wolf').id).toBe('wolf-sleeping');
		expect(getCompanionBasePose(stockholmNoon, null, 'wolf').id).toBe('wolf-standing');
	});

	it('keeps existing fox and bear night poses at 00:20 in Stockholm', () => {
		const stockholm0020 = new Date('2026-06-14T22:20:00Z');

		expect(['sleep-curled', 'sleep-side']).toContain(
			getCompanionBasePose(stockholm0020, null, 'fox').id
		);
		expect(getCompanionBasePose(stockholm0020, null, 'bear').id).toBe('bear-sleeping');
	});

	it('uses only existing calm poses for fox, bear and wolf in the cabin profile', () => {
		const calmPoseIds = new Set([
			'idle', 'look-left', 'look-right', 'sit', 'sit-look-up', 'evening-lake', 'rest',
			'sleep-curled', 'sleep-side', 'bear-sitting', 'bear-sleeping', 'wolf-standing', 'wolf-sleeping'
		]);
		for (const companionId of COMPANION_IDS) {
			for (const date of Object.values(DAYPART_DATES)) {
				const pose = getCompanionBasePose(date, null, companionId, 'dashboard', 'calm');
				expect(calmPoseIds.has(pose.id)).toBe(true);
			}
		}
	});

	it('uses a sitting or resting pose in the progress scene whenever one exists', () => {
		const expectedPoseIds: Record<(typeof COMPANION_IDS)[number], Record<CompanionPoseDaypart, string[]>> = {
			fox: {
				day: ['sit', 'sit-look-up'],
				evening: ['evening-lake', 'rest'],
				night: ['sleep-curled', 'sleep-side']
			},
			bear: {
				day: ['bear-sitting'],
				evening: ['bear-sitting'],
				night: ['bear-sleeping']
			},
			wolf: {
				// Vargen har ännu ingen sittande/liggande dagbild, så dess stilla
				// ståpose är den trygga fallbacken tills en sådan asset finns.
				day: ['wolf-standing'],
				evening: ['wolf-standing'],
				night: ['wolf-sleeping']
			}
		};

		for (const companionId of COMPANION_IDS) {
			for (const daypart of DAYPARTS) {
				const pose = getCompanionBasePose(
					DAYPART_DATES[daypart],
					null,
					companionId,
					'progress',
					'resting'
				);
				expect(expectedPoseIds[companionId][daypart]).toContain(pose.id);
			}
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

	// Dashboardhjälten är liten och står bredvid text - där får följeslagaren
	// aldrig hamna i de avlägsna positionerna, oavsett vilken pose som lottats.
	// Framsteg har hela scenen och behåller alla positioner.
	it('respects the allowed positions for each scene context', () => {
		for (const scene of ['dashboard', 'progress'] as const) {
			for (const companionId of COMPANION_IDS) {
				for (const date of Object.values(DAYPART_DATES)) {
					for (let i = 0; i < 20; i += 1) {
						const pose = getCompanionBasePose(date, null, companionId, scene);
						const position = getCompanionScenePosition(pose, date, null, companionId, scene);
						expect(COMPANION_SCENE_CONTEXT_POSITION_IDS[scene]).toContain(position.id);
						expect(position.allowedPoseIds).toContain(pose.id);
					}
				}
			}
		}
	});

	it('keeps a calm placement stable until its stored pose period expires', () => {
		const storage = new MemoryStorage();
		const date = DAYPART_DATES.day;
		const pose = getCompanionBasePose(date, storage, 'fox', 'dashboard', 'calm');
		const first = getCompanionScenePosition(pose, date, storage, 'fox', 'dashboard', 'calm');
		const second = getCompanionScenePosition(pose, date, storage, 'fox', 'dashboard', 'calm');
		expect(second.id).toBe(first.id);
	});
});

// Hjältetexten på Mitt Hem ligger i vänsterkanten och får inte kollidera med
// vare sig följeslagaren eller besökaren. Den vet inget om var djuren står -
// den litar på COMPANION_DASHBOARD_COPY_SAFE_WIDTH_PCT. Det här testet är det
// som gör löftet sant: det räknar fram den västligaste kant scenen faktiskt kan
// producera och faller om en ny position, pose eller placement kryper in över
// textens yta. Faller det ska texten smalnas av - inte konstanten höjas.
describe('dashboardscenens fria yta för hjältetexten', () => {
	// I stugnärbilden står huset och följeslagaren till vänster, medan Mitt Hems
	// textyta ligger över sjön till höger. 39 % är CompanionPose.sveltes största
	// möjliga bredd; px-taket ger en mindre andel på bredare skärmar.
	const POSE_WIDTH_PCT = 39;

	function easternmostCompanionEdge() {
		let edge = 0;
		for (const position of COMPANION_SCENE_POSITIONS) {
			if (!COMPANION_SCENE_CONTEXT_POSITION_IDS.dashboard.includes(position.id)) continue;
			for (const pose of COMPANION_POSES) {
				if (pose.role !== 'base' || !position.allowedPoseIds.includes(pose.id)) continue;
				const companionId = (pose.companionId ?? 'fox') as CompanionId;
				const placement = DASHBOARD_CABIN_COMPANION_PLACEMENTS[companionId];
				const scale = position.scale * (pose.sceneAdjustment?.scale ?? 1) * placement.scale;
				const centerX = placement.x + (pose.sceneAdjustment?.x ?? 0);
				edge = Math.max(edge, centerX + (POSE_WIDTH_PCT / 2) * scale);
			}
		}
		return edge;
	}

	it('uses a separate smaller, lower dashboard anchor for the bear', () => {
		const bear = DASHBOARD_CABIN_COMPANION_PLACEMENTS.bear;
		const fox = DASHBOARD_CABIN_COMPANION_PLACEMENTS.fox;

		expect(bear).toMatchObject({ scale: 0.68, x: 35, y: 94 });
		expect(bear.compact).toEqual({ scale: 0.72, x: 31, y: 92 });
		expect(bear.scale).toBeLessThan(fox.scale);
		expect(bear.y).toBeGreaterThan(fox.y);
	});

	it('lämnar hjälte-textens högra yta fri för varje tillåten pose och position', () => {
		expect(easternmostCompanionEdge()).toBeLessThanOrEqual(
			DASHBOARD_CABIN_COPY_SAFE_START_PCT
		);
	});
});

// Mobilcropen är inte desktop i litet format: CompanionPose ger posen bredden
// min(50 %, 220 px) i stället för min(39 %, 310 px), och scenen ankras till
// vänsterkanten. Vargens liggande duk fyllde därför scenen och gick in över
// textytan när hon saknade eget compact-ankare. Testet låser mobilvärdena och
// slår fast att desktop och de andra följeslagarna inte följde med.
describe('vargens mobilankare på Mitt Hem', () => {
	// CompanionPose.svelte, @media (max-width: 620px).
	const COMPACT_POSE_WIDTH_PCT = 50;
	const wolf = DASHBOARD_CABIN_COMPANION_PLACEMENTS.wolf;

	it('har egna compact-värden', () => {
		expect(wolf.compact).toEqual({ scale: 0.7, x: 34, y: 92 });
	});

	it('behåller desktopvärdena oförändrade', () => {
		expect(wolf.scale).toBe(0.9);
		expect(wolf.x).toBe(37);
		expect(wolf.y).toBe(91);
	});

	it('är mindre och lägre än på desktop, och något längre åt vänster', () => {
		const compact = wolf.compact;
		if (!compact) throw new Error('vargen saknar compact-ankare');
		const reduction = 1 - (compact.scale ?? wolf.scale) / wolf.scale;
		expect(reduction).toBeGreaterThanOrEqual(0.2);
		expect(reduction).toBeLessThanOrEqual(0.25);
		expect(compact.y ?? wolf.y).toBeGreaterThan(wolf.y);
		expect(compact.x ?? wolf.x).toBeLessThan(wolf.x);
	});

	it('håller varje vargpose innanför textytan även i mobilbredden', () => {
		const compact = wolf.compact;
		if (!compact) throw new Error('vargen saknar compact-ankare');
		const wolfPoses = COMPANION_POSES.filter(
			(pose) => pose.role === 'base' && pose.companionId === 'wolf'
		);

		expect(wolfPoses.length).toBeGreaterThan(0);
		for (const pose of wolfPoses) {
			for (const position of COMPANION_SCENE_POSITIONS) {
				if (!COMPANION_SCENE_CONTEXT_POSITION_IDS.dashboard.includes(position.id)) continue;
				if (!position.allowedPoseIds.includes(pose.id)) continue;
				const scale =
					position.scale * (pose.sceneAdjustment?.scale ?? 1) * (compact.scale ?? wolf.scale);
				const centerX = (compact.x ?? wolf.x) + (pose.sceneAdjustment?.x ?? 0);
				const edge = centerX + (COMPACT_POSE_WIDTH_PCT / 2) * scale;
				expect(edge).toBeLessThanOrEqual(DASHBOARD_CABIN_COPY_SAFE_START_PCT);
			}
		}
	});

	it('rör inte räven, björnen eller hundarnas mobilvärden', () => {
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.fox).toEqual({ scale: 0.8, x: 37, y: 91 });
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.bear.compact).toEqual({
			scale: 0.72,
			x: 31,
			y: 92
		});
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.schafer.compact).toEqual({
			scale: 0.38,
			x: 34,
			y: 91
		});
		expect(DASHBOARD_CABIN_COMPANION_PLACEMENTS.australisk_shepherd.compact).toEqual({
			scale: 0.39,
			x: 34,
			y: 91
		});
	});
});

describe('vargens ankare på Framsteg', () => {
	it('använder den yttre strandremsan och lämnar dashboardvärdena orörda', () => {
		expect(WOLF_SCENE_PLACEMENTS.progress).toMatchObject({
			scale: 1.6,
			right: '8%',
			bottom: '17%',
			groundLeft: '91%',
			groundTop: '80%',
			compact: { scale: 1.2, right: '0%', bottom: '42%', groundLeft: '95%', groundTop: '58%' }
		});
		expect(WOLF_SCENE_PLACEMENTS.dashboard).toEqual({ scale: 0.9, x: 76, y: 84 });
	});
});

describe('björnens ankare på Framsteg', () => {
	it('placerar björnen på marken till vänster om personen', () => {
		expect(BEAR_SCENE_PLACEMENTS.progress).toMatchObject({
			scale: 1.18,
			right: '36%',
			bottom: '8.5%',
			groundLeft: '61.4%',
			groundTop: '91.5%',
			compact: { scale: 1.08, right: '36%', bottom: '16%', groundLeft: '61.4%', groundTop: '84%' }
		});
	});
});

// En pose kan inte skalas efter sitt sceneAdjustment ensamt: poserutan är
// kvadratisk och bilden är object-fit: contain, så dukens förhållande avgör hur
// stor del av rutan motivet får, och alfa-marginalerna avgör hur mycket av
// duken som ens är djur. Vargens sovpose har som enda companion-duk förhållandet
// 1,00 - den fyller alltså hela rutans höjd där de liggande dukarna får 67 %.
// Testet räknar den faktiska scenytan per pose och håller sovande Ylva i samma
// band som rävens och björnens vilande poser.
describe('vargens sovpose ligger i proportion mot räv och björn', () => {
	// Uppmätt ur PNG-filerna: dukens förhållande samt motivets alfa-bbox som
	// andel av duken. Byts en bild ut måste raden mätas om.
	const POSE_ART: Record<
		string,
		{ companion: CompanionId; aspectRatio: number; alphaWidth: number; alphaHeight: number }
	> = {
		'sleep-curled': { companion: 'fox', aspectRatio: 287 / 194, alphaWidth: 0.78, alphaHeight: 0.67 },
		rest: { companion: 'fox', aspectRatio: 287 / 194, alphaWidth: 0.82, alphaHeight: 0.73 },
		'bear-sleeping': { companion: 'bear', aspectRatio: 768 / 512, alphaWidth: 0.75, alphaHeight: 0.48 },
		'wolf-standing': { companion: 'wolf', aspectRatio: 1536 / 1024, alphaWidth: 0.49, alphaHeight: 0.67 },
		'wolf-sleeping': { companion: 'wolf', aspectRatio: 1024 / 1024, alphaWidth: 0.86, alphaHeight: 0.6 }
	};

	/** Motivets yta i scenen, i enheter av poserutans sida (samma för alla
	 *  poser), alltså direkt jämförbar mellan följeslagare och viewporter. */
	function sceneFootprint(poseId: string) {
		const art = POSE_ART[poseId];
		const pose = COMPANION_POSES.find((candidate) => candidate.id === poseId);
		if (!art || !pose) throw new Error(`saknar underlag för posen ${poseId}`);
		// object-fit: contain i en kvadratisk ruta med sidan 1.
		const boxWidth = art.aspectRatio >= 1 ? 1 : art.aspectRatio;
		const boxHeight = art.aspectRatio >= 1 ? 1 / art.aspectRatio : 1;
		const scale =
			(pose.sceneAdjustment?.scale ?? 1) * DASHBOARD_CABIN_COMPANION_PLACEMENTS[art.companion].scale;
		return art.alphaWidth * boxWidth * art.alphaHeight * boxHeight * scale * scale;
	}

	const referenceIds = ['sleep-curled', 'rest', 'bear-sleeping'];

	it('lägger sovande vargen i samma ytband som rävens och björnens vilande poser', () => {
		const reference = referenceIds.map(sceneFootprint);
		const wolf = sceneFootprint('wolf-sleeping');

		expect(wolf).toBeGreaterThanOrEqual(Math.min(...reference) * 0.8);
		expect(wolf).toBeLessThanOrEqual(Math.max(...reference) * 1.2);
	});

	it('gör sovposen mindre än vargens egen ståendepose', () => {
		expect(sceneFootprint('wolf-sleeping')).toBeLessThan(sceneFootprint('wolf-standing'));
	});

	it('kompenserar den kvadratiska duken med ett lägre skalvärde än ståendeposen', () => {
		const poseScale = (id: string) =>
			COMPANION_POSES.find((pose) => pose.id === id)?.sceneAdjustment?.scale;

		expect(poseScale('wolf-sleeping')).toBe(0.38);
		expect(poseScale('wolf-standing')).toBe(0.74);
		expect(poseScale('wolf-sleeping')).toBeLessThan(poseScale('wolf-standing') as number);
	});

	it('rör inte rävens eller björnens skalvärden', () => {
		const poseScale = (id: string) =>
			COMPANION_POSES.find((pose) => pose.id === id)?.sceneAdjustment?.scale;

		expect(poseScale('sleep-curled')).toBe(0.45);
		expect(poseScale('sleep-side')).toBe(0.38);
		expect(poseScale('rest')).toBe(0.5);
		expect(poseScale('bear-sleeping')).toBe(0.76);
		expect(poseScale('bear-standing')).toBe(0.82);
		expect(poseScale('bear-sitting')).toBe(0.78);
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
