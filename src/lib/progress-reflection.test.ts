import { describe, expect, it } from 'vitest';
import {
	buildMoodChangeObservation,
	buildRecentComparison,
	buildPeriodAnalysis,
	buildMoodTimelineView,
	buildRecurringThemes,
	EMPTY_MOOD_COPY,
	INSUFFICIENT_CHANGE_COPY
} from './progress-reflection';

const NOW = new Date('2026-08-14T12:00:00');
const sample = (daysAgo: number, mood: number) => {
	const date = new Date(NOW);
	date.setDate(date.getDate() - daysAgo);
	return { date: date.toISOString().slice(0, 10), mood };
};

describe('Framsteg V2-reflektioner', () => {
	it('visar ingen låtsaskurva när humördata saknas', () => {
		const view = buildMoodTimelineView([], 30, NOW);
		expect(view.hasChart).toBe(false);
		expect(view.points).toEqual([]);
		expect(view.textAlternative).toBe(EMPTY_MOOD_COPY);
	});

	it('bygger tidsserien av verkliga humörvärden', () => {
		const view = buildMoodTimelineView([sample(7, 4), sample(5, 6), sample(3, 7), sample(1, 8)], 30, NOW);
		expect(view.hasChart).toBe(true);
		expect(view.points.map((point) => point.value)).toEqual([4, 6, 7, 8]);
	});

	it('visar bara teman med upprepat underlag', () => {
		expect(buildRecurringThemes([{ label: 'Sömn', count: 3 }, { label: 'Oro', count: 1 }])).toEqual([
			'Du har ofta skrivit om sömn.'
		]);
	});

	it('visar ingen förändring innan perioderna kan jämföras', () => {
		const result = buildMoodChangeObservation([sample(1, 6), sample(3, 7)], NOW);
		expect(result).toEqual({ hasComparison: false, text: INSUFFICIENT_CHANGE_COPY });
	});

	it('visar en förändring bara när båda perioderna har underlag', () => {
		const result = buildMoodChangeObservation(
			[
				sample(1, 8), sample(3, 8), sample(5, 7), sample(7, 8),
				sample(16, 4), sample(18, 5), sample(20, 4), sample(22, 5)
			],
			NOW
		);
		expect(result).toEqual({
			hasComparison: true,
			text: 'Du har satt ett ljusare humör oftare de senaste två veckorna.'
		});
	});
});

describe('periodanalys', () => {
	it('säger tydligt när underlaget är för litet utan att hitta på ett mönster', () => {
		const analysis = buildPeriodAnalysis([sample(1, 5), sample(3, 6), sample(5, 4)], 30, NOW);

		expect(analysis).toMatchObject({ sampleCount: 3, insufficientData: true, observations: [] });
		expect(analysis.summary).toContain('3 registreringar');
		expect(analysis.summary).toContain('lite för tidigt');
		expect(analysis.summary).not.toContain('högre');
		expect(analysis.summary).not.toContain('lägre');
	});

	it('hanterar noll humörregistreringar i den valda perioden', () => {
		const analysis = buildPeriodAnalysis([], 180, NOW);

		expect(analysis).toMatchObject({ sampleCount: 0, insufficientData: true, observations: [] });
		expect(analysis.summary).toContain('0 registreringar');
	});

	it('beskriver en stabil period utan att påstå en riktning', () => {
		const analysis = buildPeriodAnalysis(
			[sample(1, 6), sample(4, 6), sample(8, 6), sample(12, 7), sample(16, 6), sample(20, 6), sample(25, 6)],
			30,
			NOW
		);

		expect(analysis.insufficientData).toBe(false);
		expect(analysis.observations).toContain('Registreringarna har legat ganska jämnt under perioden.');
		expect(analysis.observations).toContain(
			'Den senare delen av perioden ligger på ungefär samma nivå som den första.'
		);
	});

	it('beskriver tydlig variation utan att tolka orsaken', () => {
		const analysis = buildPeriodAnalysis(
			[sample(1, 5), sample(4, 9), sample(8, 2), sample(12, 5), sample(16, 9), sample(20, 2)],
			90,
			NOW
		);

		expect(analysis.observations).toContain('Registreringarna har varierat en del, utan en enda tydlig riktning.');
	});

	it('visar en försiktig högre riktning först när periodhalvorna stödjer den', () => {
		const analysis = buildPeriodAnalysis(
			[sample(25, 4), sample(22, 4), sample(19, 5), sample(8, 7), sample(5, 7), sample(1, 8)],
			30,
			NOW
		);

		expect(analysis.observations).toContain('Den senare delen av perioden ligger något högre på skalan än den första.');
	});

	it('visar en försiktig lägre riktning först när periodhalvorna stödjer den', () => {
		const analysis = buildPeriodAnalysis(
			[sample(25, 8), sample(22, 8), sample(19, 7), sample(8, 5), sample(5, 5), sample(1, 4)],
			30,
			NOW
		);

		expect(analysis.observations).toContain('Den senare delen av perioden ligger något lägre på skalan än den första.');
	});

	it('nämner den senaste registreringen bara när den avviker tydligt', () => {
		const analysis = buildPeriodAnalysis(
			[sample(12, 6), sample(9, 6), sample(6, 6), sample(3, 6), sample(1, 3)],
			30,
			NOW
		);

		expect(analysis.observations).toContain('Den senaste registreringen ligger lägre på skalan än flera av de tidigare.');
	});

	it('jämför de senaste 30 dagarna med perioden före vid långt underlag', () => {
		const analysis = buildPeriodAnalysis(
			[
				sample(58, 4), sample(54, 4), sample(50, 5), sample(46, 4),
				sample(24, 7), sample(20, 8), sample(16, 7), sample(12, 8),
				sample(100, 5), sample(90, 5), sample(80, 5)
			],
			180,
			NOW
		);

		expect(analysis.observations).toContain(
			'De senaste 30 dagarna ligger högre på skalan än de 30 dagarna före.'
		);
	});

	it('visar högsta och lägsta månad först när flera månader har tillräckligt underlag', () => {
		const analysis = buildPeriodAnalysis(
			[
				{ date: '2026-03-01', mood: 3 }, { date: '2026-03-02', mood: 4 }, { date: '2026-03-03', mood: 3 },
				{ date: '2026-05-01', mood: 6 }, { date: '2026-05-02', mood: 7 }, { date: '2026-05-03', mood: 6 },
				{ date: '2026-07-01', mood: 8 }, { date: '2026-07-02', mood: 8 }, { date: '2026-07-03', mood: 7 }
			],
			180,
			NOW
		);

		expect(analysis.observations.some((text) => text.startsWith('Bland månader med minst tre registreringar'))).toBe(true);
	});

	it.each([
		[30, 'de senaste 30 dagarna', 4],
		[90, 'de senaste tre månaderna', 5],
		[180, 'de senaste sex månaderna', 7]
	] as const)('anpassar djupet till %s dagar', (periodDays, label, maxObservations) => {
		const samples = [
			sample(170, 4), sample(150, 4), sample(130, 5), sample(110, 4), sample(90, 5),
			sample(70, 7), sample(50, 7), sample(30, 8), sample(20, 7), sample(10, 8), sample(1, 9)
		];
		const analysis = buildPeriodAnalysis(samples, periodDays, NOW);

		expect(analysis.summary).toContain(label);
		expect(analysis.observations.length).toBeLessThanOrEqual(maxObservations);
	});
});

describe('senaste tiden', () => {
	it('visar en lägre senaste period först med två jämförbara underlag', () => {
		const comparison = buildRecentComparison(
			[
				sample(1, 4), sample(3, 4), sample(6, 5), sample(10, 4),
				sample(16, 7), sample(18, 7), sample(21, 8), sample(25, 7)
			],
			NOW
		);

		expect(comparison).toMatchObject({
			title: 'Den senaste perioden ligger lägre',
			description: 'Dina senaste registreringar ligger lägre på skalan än perioden före.'
		});
		expect(comparison?.evidence).toContain('4 registreringar');
	});

	it('visar en större variation utan att hitta på en riktning', () => {
		const comparison = buildRecentComparison(
			[
				sample(1, 2), sample(3, 8), sample(6, 3), sample(10, 7),
				sample(16, 5), sample(18, 5), sample(21, 5), sample(25, 5)
			],
			NOW
		);

		expect(comparison?.title).toBe('Dagarna varierar mer just nu');
		expect(comparison?.description).toContain('ungefär på samma nivå');
	});

	it('visar ingen lägesbild när en av perioderna saknar underlag', () => {
		expect(buildRecentComparison([sample(1, 4), sample(3, 4), sample(16, 7)], NOW)).toBeNull();
	});
});

// ── Tidszons- och skiftsäkra periodgränser ──────────────────────────────────
//
// Fönstren räknades tidigare som now.getTime() - n * DAY_MS och formaterades i
// webbläsarens lokala tid. Det gav två fel som testerna nedan låser fast:
//
//   1. Ett dygn är inte 24 h vid tidsomställningen. Efter höstens skifte, för
//      en användare som skriver strax före midnatt, blev fjortondagarsfönstret
//      tretton dagar. Efter vårens skifte, strax efter midnatt, blev det
//      femton. Felet satt kvar i lika många dagar som fönstret är långt - för
//      trettiodagarsjämförelsen alltså i nästan två månader.
//   2. sample.date är alltid ett Stockholmsdatum från servern. Räknades
//      gränserna i besökarens egen kalender jämfördes två olika tidszoner.
//
// Testerna är avsiktligt oberoende av testkörarens egen tidszon: varje "nu"
// anges med explicit offset, och förväntningarna uttrycks i svenska datum.

describe('periodgränser över tidsomställning och tidszon', () => {
	const moods = (dates: string[]) => dates.map((date) => ({ date, mood: 8 }));

	/** Fyra registreringar i varje fönster, dvs precis över MIN_SAMPLES_PER_PERIOD. */
	const fill = (dates: string[], mood: number) => dates.map((date) => ({ date, mood }));

	it('håller fjortondagarsfönstret på fjorton dagar strax före midnatt efter höstskiftet', () => {
		// Vintertid började 25 oktober 2026. 23:30 svensk tid är den tidpunkt då
		// det gamla millisekundsavdraget hoppade över en kalenderdag.
		const now = new Date('2026-10-27T23:30:00+01:00');

		// 2026-10-14 är fönstrets första dag (27 oktober minus 13 dagar).
		// Med den gamla beräkningen började fönstret 2026-10-15 och den här
		// registreringen hamnade utanför.
		const recent = fill(['2026-10-14', '2026-10-20', '2026-10-25', '2026-10-27'], 8);
		const previous = fill(['2026-10-01', '2026-10-05', '2026-10-09', '2026-10-13'], 3);

		const result = buildMoodChangeObservation([...previous, ...recent], now);
		expect(result.hasComparison).toBe(true);
		expect(result.text).toBe('Du har satt ett ljusare humör oftare de senaste två veckorna.');
	});

	it('tar med den föregående periodens första dag efter höstskiftet', () => {
		const now = new Date('2026-10-27T23:30:00+01:00');
		// Den föregående perioden börjar 2026-09-30 (fönstrets första dag minus
		// fjorton dagar). Med den gamla beräkningen började den 2026-10-01 och
		// den här registreringen föll utanför båda fönstren.
		const recent = fill(['2026-10-14', '2026-10-20', '2026-10-25', '2026-10-27'], 8);
		const previous = fill(['2026-09-30', '2026-10-05', '2026-10-09', '2026-10-13'], 3);

		const result = buildMoodChangeObservation([...previous, ...recent], now);
		expect(result.hasComparison).toBe(true);
		expect(result.text).toBe('Du har satt ett ljusare humör oftare de senaste två veckorna.');
	});

	it('håller fjortondagarsfönstret på fjorton dagar strax efter midnatt efter vårskiftet', () => {
		// Sommartid började 29 mars 2026. 00:15 svensk tid är motsvarande
		// tidpunkt åt andra hållet: fönstret blev en dag för långt.
		const now = new Date('2026-03-30T00:15:00+02:00');

		// Fönstret är 2026-03-17 till 2026-03-30. Den gamla beräkningen lade
		// starten på 2026-03-16 och drog därmed in 16 mars i den senaste
		// perioden i stället för i den föregående. Den föregående perioden
		// tappade då sin fjärde registrering och jämförelsen uteblev helt.
		const recent = fill(['2026-03-17', '2026-03-20', '2026-03-25', '2026-03-30'], 6);
		const previous = fill(['2026-03-03', '2026-03-06', '2026-03-10', '2026-03-16'], 6);

		const result = buildMoodChangeObservation([...previous, ...recent], now);
		expect(result.hasComparison).toBe(true);
		expect(result.text).toBe(
			'Dina humörvärden ligger ungefär lika de senaste två veckorna som veckorna innan.'
		);
	});

	// Det här testet låser fast att gränserna följer Stockholm och inte UTC eller
	// testkörarens egen zon. Det skiljer inte gammalt från nytt när sviten körs i
	// Europe/Stockholm - där är de identiska - men fångar en återgång till
	// UTC-baserade nycklar, och faller i CI-zoner som inte är svenska.
	it('följer svensk kalender även när besökarens dygn har vänt i en annan tidszon', () => {
		// 22:30 UTC är 00:30 svensk tid dygnet efter. Fönstret ska sluta på det
		// svenska datumet, eftersom sample.date är svenska datum.
		const now = new Date('2026-06-15T22:30:00Z');

		// 2026-06-16 är "idag" i Stockholm och måste rymmas i fönstret.
		const recent = fill(['2026-06-16', '2026-06-14', '2026-06-10', '2026-06-05'], 8);
		const previous = fill(['2026-06-01', '2026-05-28', '2026-05-25', '2026-06-02'], 3);

		const result = buildMoodChangeObservation([...previous, ...recent], now);
		expect(result.hasComparison).toBe(true);
		expect(result.text).toBe('Du har satt ett ljusare humör oftare de senaste två veckorna.');
	});

	it('lägger de två fönstren kant i kant utan överlapp', () => {
		const now = new Date('2026-10-27T23:30:00+01:00');
		// 2026-10-13 är sista dagen i den föregående perioden och 2026-10-14
		// första dagen i den senaste. Ingen registrering får räknas två gånger.
		const boundary = moods(['2026-10-13', '2026-10-14']);
		const recent = fill(['2026-10-20', '2026-10-25', '2026-10-27'], 8);
		const previous = fill(['2026-10-02', '2026-10-06', '2026-10-10'], 8);

		const result = buildMoodChangeObservation([...previous, ...boundary, ...recent], now);
		// Fyra i varje fönster tack vare gränsdagarna, och samma nivå överallt.
		expect(result.hasComparison).toBe(true);
		expect(result.text).toBe(
			'Dina humörvärden ligger ungefär lika de senaste två veckorna som veckorna innan.'
		);
	});

	it('håller trettiodagarsjämförelsen skiftsäker långt efter omställningen', () => {
		// Sextiodagarsspannet i buildRecentComparison-syskonet drar med sig
		// skiftet i nästan två månader. 2026-11-20 ligger 26 dagar efter
		// höstskiftet och träffades fortfarande av det gamla felet.
		const now = new Date('2026-11-20T23:30:00+01:00');
		// Fönstret börjar 2026-11-07 och den föregående perioden 2026-10-24.
		// Den gamla beräkningen lade den föregående starten på 2026-10-25,
		// eftersom 27 dygn bakåt räknat i millisekunder passerar det 25 timmar
		// långa dygnet den 25 oktober. Registreringen på 24 oktober föll då
		// utanför båda fönstren.
		const recent = fill(['2026-11-07', '2026-11-12', '2026-11-17', '2026-11-20'], 8);
		const previous = fill(['2026-10-24', '2026-10-28', '2026-11-01', '2026-11-05'], 3);

		const result = buildRecentComparison([...previous, ...recent], now);
		expect(result).not.toBeNull();
		expect(result?.title).toBe('Den senaste perioden ligger högre');
	});
});
