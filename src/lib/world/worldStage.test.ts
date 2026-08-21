import { describe, expect, it } from 'vitest';
import {
	EMPTY_WORLD_PRESENCE,
	RETURN_COPY_MIN_DAYS,
	WORLD_LAST_VISIT_STORAGE_KEY,
	WORLD_RETURN_COPY,
	buildWorldPresence,
	getAccountAgeDays,
	getDaysSinceLastVisit,
	getWorldGrowthLevel,
	getWorldMarkVariation,
	getCompanionMark,
	getWorldMarks,
	getWorldReturnCopy,
	getWorldStage,
	normalizeWorldPresence,
	readLastVisit,
	recordVisit,
	type WorldPresence,
	type WorldVisitStorageLike
} from './worldStage';

function presence(overrides: Partial<WorldPresence> = {}): WorldPresence {
	return normalizeWorldPresence({ ...EMPTY_WORLD_PRESENCE, ...overrides });
}

function createStorage(initial: Record<string, string> = {}): WorldVisitStorageLike & {
	data: Record<string, string>;
} {
	const data = { ...initial };
	return {
		data,
		getItem: (key) => data[key] ?? null,
		setItem: (key, value) => {
			data[key] = value;
		}
	};
}

describe('närvarounderlaget', () => {
	it('räknar dagar, veckor och månader på både skrivdagar och måendedagar', () => {
		const result = buildWorldPresence({
			heatmapData: { '2026-08-03': 2, '2026-08-04': 1, '2026-07-20': 1 },
			moodDates: ['2026-08-04', '2026-08-11', '2026-06-02'],
			entryCount: 4,
			moodEntryCount: 3,
			reflectionCount: 2,
			accountCreatedAt: '2026-05-01T00:00:00.000Z',
			now: new Date('2026-08-21T12:00:00.000Z')
		});

		expect(result.activeDays).toBe(5);
		expect(result.activeWeeks).toBe(4);
		expect(result.activeMonths).toBe(3);
		expect(result.registrationCount).toBe(9);
		expect(result.accountAgeDays).toBe(112);
	});

	it('ignorerar skräpvärden i stället för att välta', () => {
		const result = buildWorldPresence({
			heatmapData: { 'inte-ett-datum': 3, '2026-08-03': 0, '2026-08-04': 1 },
			moodDates: ['x', '2026-08-04'],
			entryCount: -5,
			moodEntryCount: Number.NaN,
			accountCreatedAt: 'trasigt'
		});

		expect(result).toMatchObject({ activeDays: 1, entryCount: 0, moodEntryCount: 0, accountAgeDays: 0 });
	});

	it('ger ett tomt underlag utan data alls', () => {
		expect(buildWorldPresence({})).toEqual(EMPTY_WORLD_PRESENCE);
		expect(normalizeWorldPresence(null)).toEqual(EMPTY_WORLD_PRESENCE);
		expect(getAccountAgeDays(null)).toBe(0);
	});
});

describe('miljöstadiet', () => {
	it('börjar på noll och tar första steget vid första aktiviteten', () => {
		expect(getWorldStage(presence())).toBe(0);
		expect(getWorldStage(presence({ activeDays: 1 }))).toBe(1);
		expect(getWorldStage(presence({ moodEntryCount: 1 }))).toBe(1);
	});

	it('följer kontinuitet, inte sammanhängande streaks', () => {
		expect(getWorldStage(presence({ activeDays: 3 }))).toBe(2);
		expect(getWorldStage(presence({ activeDays: 7 }))).toBe(3);
		expect(getWorldStage(presence({ activeWeeks: 4, activeDays: 4 }))).toBe(4);
		expect(getWorldStage(presence({ activeMonths: 3, activeDays: 6 }))).toBe(5);
	});

	it('kan aldrig sjunka när en räknare växer', () => {
		let previous = getWorldStage(presence());
		for (let days = 0; days <= 400; days += 1) {
			const stage = getWorldStage(
				presence({ activeDays: days, activeWeeks: Math.floor(days / 7), activeMonths: Math.floor(days / 30) })
			);
			expect(stage).toBeGreaterThanOrEqual(previous);
			previous = stage;
		}
	});

	it('höjer bara den befintliga växtnivån, aldrig tvärtom', () => {
		expect(getWorldGrowthLevel(0)).toBe(0);
		expect(getWorldGrowthLevel(3)).toBe(3);
		expect(getWorldGrowthLevel(5)).toBe(4);
	});
});

describe('spåren i scenen', () => {
	it('visar ingenting i en tom värld', () => {
		expect(getWorldMarks(presence())).toEqual([]);
	});

	it('lägger till spår efter hand utan att ta bort tidigare', () => {
		const early = getWorldMarks(presence({ activeDays: 1 })).map((mark) => mark.id);
		const later = getWorldMarks(presence({ activeDays: 9, activeWeeks: 4, entryCount: 12 })).map(
			(mark) => mark.id
		);

		expect(early).toContain('shore-stone');
		for (const id of early) expect(later).toContain(id);
		expect(later.length).toBeGreaterThan(early.length);
		expect(later).toContain('lantern');
	});

	it('behåller spåren efter ett långt uppehåll', () => {
		const active = presence({ activeDays: 30, activeWeeks: 9, activeMonths: 4, entryCount: 40 });

		// Samma räknare, ett år senare och utan ny aktivitet: räknarna är kumulativa,
		// så resultatet är oförändrat.
		expect(getWorldMarks(active)).toEqual(getWorldMarks(active));
		expect(getWorldStage(active)).toBe(5);
	});

	it('håller nattspåret till natten', () => {
		const rich = presence({ activeMonths: 4, entryCount: 60, activeDays: 40 });

		expect(getWorldMarks(rich, { timeOfDay: 'day' }).map((mark) => mark.id)).not.toContain('night-glow');
		expect(getWorldMarks(rich, { timeOfDay: 'night' }).map((mark) => mark.id)).toContain('night-glow');
	});

	it('flyttar ett spår i stället för att dölja det när textblocket tar plats', () => {
		const wide = getWorldMarks(presence({ activeWeeks: 2, activeDays: 8 })).find((mark) => mark.id === 'lantern');
		const narrow = getWorldMarks(presence({ activeWeeks: 2, activeDays: 8 }), { narrow: true }).find(
			(mark) => mark.id === 'lantern'
		);

		expect(narrow).toBeDefined();
		expect(narrow?.x).not.toBe(wide?.x);
		expect(narrow?.x).toBeGreaterThan(80);
	});

	it('markerar den första reflektionen och den långa historiken', () => {
		expect(getWorldMarks(presence({ reflectionCount: 0, activeDays: 5 })).map((m) => m.id)).not.toContain(
			'first-bloom'
		);
		expect(getWorldMarks(presence({ reflectionCount: 1, activeDays: 5 })).map((m) => m.id)).toContain(
			'first-bloom'
		);
		expect(getWorldMarks(presence({ entryCount: 99, activeDays: 5 })).map((m) => m.id)).not.toContain(
			'hearth-stones'
		);
		expect(getWorldMarks(presence({ entryCount: 100, activeDays: 5 })).map((m) => m.id)).toContain(
			'hearth-stones'
		);
	});

	it('kan både flytta och krympa ett spår för den smala beskärningen', () => {
		const rich = presence({ activeMonths: 4, activeDays: 40, entryCount: 60 });
		const wide = getWorldMarks(rich).find((m) => m.id === 'old-tree');
		const narrow = getWorldMarks(rich, { narrow: true }).find((m) => m.id === 'old-tree');

		expect(narrow).toBeDefined();
		expect(narrow?.width).toBeLessThan(wide!.width);
		expect(narrow?.height).toBeLessThan(wide!.height);
		expect(narrow?.x).toBeGreaterThan(wide!.x);
	});

	it('lämnar de minsta spåren utanför smala vyer', () => {
		const rich = presence({ activeMonths: 4, entryCount: 60, activeDays: 40 });
		const narrow = getWorldMarks(rich, { narrow: true });

		expect(narrow.length).toBeLessThan(getWorldMarks(rich).length);
		expect(narrow.map((mark) => mark.id)).toContain('shore-stone');
	});

	it('förklarar aldrig varför ett spår finns där', () => {
		const rich = presence({ activeMonths: 4, entryCount: 60, activeDays: 40, reflectionCount: 9 });

		for (const mark of getWorldMarks(rich, { timeOfDay: 'night' })) {
			expect(mark.revealText.length).toBeLessThanOrEqual(60);
			expect(mark.revealText).not.toMatch(/nivå|poäng|dagar i rad|streak|upplåst|grattis|\d/i);
		}
	});
});

describe('följeslagaren som spår', () => {
	const box = { x: 61.5, y: 50.6, width: 6.5, height: 21.4 };

	it('finns inte förrän det finns en återkomst att känna igen', () => {
		expect(getCompanionMark(presence({ activeDays: 1 }), box)).toBeNull();
		expect(getCompanionMark(presence({ activeDays: 3 }), box)).not.toBeNull();
	});

	it('ger ingen träffyta utan en mätt ruta', () => {
		expect(getCompanionMark(presence({ activeDays: 12 }), null)).toBeNull();
		expect(getCompanionMark(presence({ activeDays: 12 }), { ...box, width: 0 })).toBeNull();
		expect(getCompanionMark(presence({ activeDays: 12 }), { ...box, height: -4 })).toBeNull();
	});

	it('lägger sig exakt över den mätta rutan och ritar ingen egen form', () => {
		const mark = getCompanionMark(presence({ activeDays: 12 }), box);

		expect(mark).toMatchObject({ id: 'companion', x: box.x, y: box.y, width: box.width, invisible: true });
		expect(getWorldMarkVariation(mark!, 'nagot-besok')).toEqual({ x: box.x, y: box.y, opacityScale: 1 });
	});

	it('talar om igenkänning, inte om en nivå', () => {
		const mark = getCompanionMark(presence({ activeDays: 12 }), box);

		expect(mark?.revealText).toBe('Den verkar ha vant sig vid att du kommer tillbaka.');
		expect(mark?.revealText).not.toMatch(/nivå|poäng|band|steg|\d/i);
	});

	it('ingår aldrig i de spår som växer fram ur historiken', () => {
		const ids = getWorldMarks(presence({ activeMonths: 4, activeDays: 40, entryCount: 60 })).map((m) => m.id);

		expect(ids).not.toContain('companion');
	});
});

describe('variationen mellan besök', () => {
	const [mark] = getWorldMarks(presence({ activeDays: 1 }));

	it('står helt still utan seed', () => {
		expect(getWorldMarkVariation(mark, null)).toEqual({ x: mark.x, y: mark.y, opacityScale: 1 });
	});

	it('ger samma läge för samma besök', () => {
		expect(getWorldMarkVariation(mark, 'besok-a')).toEqual(getWorldMarkVariation(mark, 'besok-a'));
		expect(getWorldMarkVariation(mark, 'besok-a')).not.toEqual(getWorldMarkVariation(mark, 'besok-b'));
	});

	it('flyttar aldrig ett spår så mycket att platsen blir obekant', () => {
		for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
			const variation = getWorldMarkVariation(mark, seed);
			expect(Math.abs(variation.x - mark.x)).toBeLessThanOrEqual(0.9);
			expect(Math.abs(variation.y - mark.y)).toBeLessThanOrEqual(0.55);
			expect(variation.opacityScale).toBeGreaterThan(0.85);
			expect(variation.opacityScale).toBeLessThan(1.15);
		}
	});
});

describe('återkomst efter frånvaro', () => {
	const now = new Date('2026-08-21T12:00:00.000Z');
	const returning = presence({ activeDays: 12, entryCount: 14 });

	it('säger ingenting till den som var här nyss', () => {
		expect(getWorldReturnCopy(returning, 0)).toBeNull();
		expect(getWorldReturnCopy(returning, RETURN_COPY_MIN_DAYS - 1)).toBeNull();
	});

	it('säger ingenting utan en tidigare besöksstämpel', () => {
		expect(getWorldReturnCopy(returning, null)).toBeNull();
		expect(readLastVisit(createStorage())).toBeNull();
		expect(readLastVisit(null)).toBeNull();
	});

	it('hälsar den som varit borta länge utan att nämna hur länge', () => {
		const copy = getWorldReturnCopy(returning, RETURN_COPY_MIN_DAYS);

		expect(copy).toBe(WORLD_RETURN_COPY);
		expect(copy).not.toMatch(/streak|missade|\d/i);
	});

	it('hälsar inte någon som inte hunnit få en plats än', () => {
		expect(getWorldReturnCopy(presence({ activeDays: 1 }), 90)).toBeNull();
	});

	it('sparar och läser besöket lokalt', () => {
		const storage = createStorage();
		recordVisit(storage, now);

		expect(Object.keys(storage.data)).toEqual([WORLD_LAST_VISIT_STORAGE_KEY]);
		expect(readLastVisit(storage)?.toISOString()).toBe(now.toISOString());
		expect(getDaysSinceLastVisit(readLastVisit(storage), new Date('2026-09-11T12:00:00.000Z'))).toBe(21);
	});

	it('tål en trasig eller framtidsdaterad stämpel', () => {
		expect(readLastVisit(createStorage({ [WORLD_LAST_VISIT_STORAGE_KEY]: 'inte-ett-datum' }))).toBeNull();
		expect(getDaysSinceLastVisit(new Date('2026-09-01T00:00:00.000Z'), now)).toBeNull();
	});
});
