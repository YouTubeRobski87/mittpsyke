import { describe, expect, it } from 'vitest';
import {
	aggregateSamples,
	buildChartGeometry,
	buildHistoryActivity,
	buildPeriodActivity,
	buildRecentPeriodView,
	buildSteadinessObservation,
	buildThemeObservation,
	countActiveWeeks,
	filterByPeriod,
	getIsoWeekKey,
	getResolution,
	toMoodSamples,
	CHART_FALLBACK_COPY,
	MIN_MOOD_POINTS,
	NEUTRAL_OBSERVATION_COPY,
	type MoodSample
} from './progress-recent-period';

// Fast referenstid så att alla periodgränser blir deterministiska.
// 2026-08-02 är en söndag och ligger i ISO-vecka 31.
const NOW = new Date('2026-08-02T12:00:00');

function dateKey(daysAgo: number): string {
	const date = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function sample(daysAgo: number, mood: number): MoodSample {
	return { date: dateKey(daysAgo), mood };
}

describe('toMoodSamples', () => {
	it('tolkar humör som sträng och sorterar stigande', () => {
		const result = toMoodSamples([
			{ date: '2026-07-10', mood: '7' },
			{ date: '2026-07-01', mood: '4,5' }
		]);
		expect(result).toEqual([
			{ date: '2026-07-01', mood: 4.5 },
			{ date: '2026-07-10', mood: 7 }
		]);
	});

	it('kastar rader utan giltigt datum eller humör', () => {
		const result = toMoodSamples([
			{ date: '2026-07-10', mood: null },
			{ date: '2026-07-11', mood: '' },
			{ date: '2026-07-12', mood: 'inget' },
			{ date: 'trasigt', mood: '5' },
			{ date: '2026-07-13', mood: Number.NaN },
			{ date: '2026-07-14', mood: '6' }
		]);
		expect(result).toEqual([{ date: '2026-07-14', mood: 6 }]);
	});

	it('klampar humör till skalan 1-10', () => {
		expect(toMoodSamples([{ date: '2026-07-14', mood: '42' }])[0].mood).toBe(10);
		expect(toMoodSamples([{ date: '2026-07-14', mood: '-3' }])[0].mood).toBe(1);
	});
});

describe('periodfiltrering', () => {
	// Äldst först, samma ordning som toMoodSamples ger.
	const samples = [sample(200, 9), sample(89, 8), sample(30, 7), sample(29, 6), sample(0, 5)];

	it('tar med idag och 29 dagar bakåt för 30-dagarsperioden', () => {
		const result = filterByPeriod(samples, 30, NOW);
		// Dag 30 faller utanför, dag 29 och idag ligger kvar, ordningen bevaras.
		expect(result.map((item) => item.mood)).toEqual([6, 5]);
	});

	it('vidgar urvalet för 3 månader', () => {
		expect(filterByPeriod(samples, 90, NOW)).toHaveLength(4);
	});

	it('utesluter punkter utanför 6 månader', () => {
		const result = filterByPeriod(samples, 180, NOW);
		expect(result).toHaveLength(4);
		expect(result.some((item) => item.mood === 9)).toBe(false);
	});
});

describe('upplösning och aggregering', () => {
	it('använder daglig upplösning för 30 dagar och veckovis för längre', () => {
		expect(getResolution(30)).toBe('day');
		expect(getResolution(90)).toBe('week');
		expect(getResolution(180)).toBe('week');
	});

	it('räknar dagsmedelvärde vid daglig upplösning', () => {
		const points = aggregateSamples(
			[
				{ date: '2026-07-20', mood: 4 },
				{ date: '2026-07-20', mood: 7 },
				{ date: '2026-07-21', mood: 6 }
			],
			'day'
		);
		expect(points).toHaveLength(2);
		expect(points[0].value).toBe(5.5);
		expect(points[0].count).toBe(2);
		expect(points[1].value).toBe(6);
	});

	it('slår ihop dagar till ISO-veckor vid veckovis upplösning', () => {
		// 2026-07-27 till 2026-08-02 är vecka 31, 2026-07-20 är vecka 30.
		const points = aggregateSamples(
			[
				{ date: '2026-07-20', mood: 3 },
				{ date: '2026-07-27', mood: 5 },
				{ date: '2026-08-02', mood: 9 }
			],
			'week'
		);
		expect(points).toHaveLength(2);
		expect(points[0].key).toBe('2026-W30');
		expect(points[0].value).toBe(3);
		expect(points[1].key).toBe('2026-W31');
		expect(points[1].value).toBe(7);
		expect(points[1].count).toBe(2);
	});

	it('ger ISO-veckonyckel med måndag som veckostart', () => {
		expect(getIsoWeekKey(new Date('2026-08-02T12:00:00'))).toBe('2026-W31');
		expect(getIsoWeekKey(new Date('2026-07-27T12:00:00'))).toBe('2026-W31');
		expect(getIsoWeekKey(new Date('2026-07-26T12:00:00'))).toBe('2026-W30');
	});
});

describe('buildChartGeometry', () => {
	it('ger ändliga koordinater och en linje för flera punkter', () => {
		const points = aggregateSamples(
			[sample(3, 4), sample(2, 8), sample(1, 6), sample(0, 10)],
			'day'
		);
		const geometry = buildChartGeometry(points);

		expect(geometry.points).toHaveLength(4);
		expect(geometry.line).not.toBe('');
		expect(geometry.line).not.toContain('NaN');
		for (const point of geometry.points) {
			expect(Number.isFinite(point.x)).toBe(true);
			expect(Number.isFinite(point.y)).toBe(true);
		}
		// Högre humör ska ligga högre upp, dvs lägre y.
		expect(geometry.points[3].y).toBeLessThan(geometry.points[0].y);
	});

	it('centrerar en ensam punkt och ritar ingen linje', () => {
		const geometry = buildChartGeometry(aggregateSamples([sample(0, 5)], 'day'), {
			width: 640,
			height: 200
		});
		expect(geometry.points).toHaveLength(1);
		expect(geometry.points[0].x).toBe(320);
		expect(Number.isFinite(geometry.points[0].y)).toBe(true);
		expect(geometry.line).toBe('');
	});

	it('ger tom linje och inga punkter utan underlag', () => {
		const geometry = buildChartGeometry([]);
		expect(geometry.line).toBe('');
		expect(geometry.points).toEqual([]);
	});
});

describe('aktiva veckor', () => {
	it('räknar antal olika ISO-veckor med minst ett inlägg', () => {
		const heatmap = {
			'2026-08-02': 1,
			'2026-07-30': 2,
			'2026-07-20': 1,
			'2026-07-13': 3
		};
		// Vecka 31 (två dagar), vecka 30 och vecka 29.
		expect(countActiveWeeks(heatmap, 30, NOW)).toBe(3);
	});

	it('ignorerar dagar utanför perioden, nollor och trasiga nycklar', () => {
		const heatmap = {
			'2026-08-02': 1,
			'2026-07-30': 0,
			'2026-01-05': 4,
			trasig: 2
		};
		expect(countActiveWeeks(heatmap, 30, NOW)).toBe(1);
	});

	it('ger noll för tom eller saknad data', () => {
		expect(countActiveWeeks({}, 30, NOW)).toBe(0);
		expect(countActiveWeeks(null, 30, NOW)).toBe(0);
		expect(countActiveWeeks(undefined, 180, NOW)).toBe(0);
	});
});

describe('periodaktivitet', () => {
	it('summerar bara sparade texter och aktiva dagar inom den valda perioden', () => {
		const activity = buildPeriodActivity(
			{
				'2026-08-02': 2,
				'2026-08-01': 1,
				'2026-07-30': 3,
				'2026-07-02': 8,
				'2026-01-01': 5
			},
			30,
			NOW
		);

		expect(activity).toEqual({ entryCount: 6, activeDays: 3, activeWeeks: 1, longestActiveStreak: 2 });
	});

	it('ger ett tomt och säkert resultat utan heatmapdata', () => {
		expect(buildPeriodActivity(null, 180, NOW)).toEqual({
			entryCount: 0,
			activeDays: 0,
			activeWeeks: 0,
			longestActiveStreak: 0
		});
	});
});

describe('samlad historikaktivitet', () => {
	it('räknar mående och text som olika datakällor men samma aktiva dag', () => {
		const activity = buildHistoryActivity(
			{
				'2026-08-02': 2,
				'2026-07-30': 1
			},
			[
				{ date: '2026-08-02', mood: 6 },
				{ date: '2026-08-01', mood: 5 },
				{ date: '2026-07-20', mood: 7 }
			],
			30,
			NOW
		);

		expect(activity).toEqual({
			moodEntryCount: 3,
			textEntryCount: 3,
			moodActiveDays: 3,
			textActiveDays: 2,
			activeDays: 4,
			activeWeeks: 2
		});
	});

	it('visar måendeaktivitet även utan sparade texter', () => {
		const activity = buildHistoryActivity(
			{},
			[{ date: '2026-08-02', mood: 6 }, { date: '2026-07-31', mood: 4 }],
			30,
			NOW
		);

		expect(activity).toMatchObject({
			moodEntryCount: 2,
			textEntryCount: 0,
			activeDays: 2,
			activeWeeks: 1
		});
	});
});

describe('jämförelse av jämnhet', () => {
	it('kräver tillräckligt underlag i båda fönstren', () => {
		// Fyra punkter i det senaste fönstret, bara två i det föregående.
		const samples = [
			sample(1, 5),
			sample(3, 6),
			sample(5, 5),
			sample(7, 6),
			sample(16, 4),
			sample(18, 8)
		];
		const result = buildSteadinessObservation(samples, NOW);
		expect(result.hasComparison).toBe(false);
		expect(result.direction).toBe('insufficient');
		expect(result.text).toBe(NEUTRAL_OBSERVATION_COPY);
	});

	it('säger jämnare först när skillnaden passerar tröskeln', () => {
		// Föregående fönster växlar kraftigt, senaste ligger stilla.
		const samples = [
			sample(1, 6),
			sample(3, 6),
			sample(5, 6),
			sample(7, 6),
			sample(16, 2),
			sample(18, 9),
			sample(20, 3),
			sample(22, 10)
		];
		const result = buildSteadinessObservation(samples, NOW);
		expect(result.hasComparison).toBe(true);
		expect(result.direction).toBe('steadier');
		expect(result.text).toBe('Något jämnare de senaste två veckorna än de två veckorna innan.');
	});

	it('säger mer växlande när spridningen ökat över tröskeln', () => {
		const samples = [
			sample(1, 2),
			sample(3, 9),
			sample(5, 3),
			sample(7, 10),
			sample(16, 6),
			sample(18, 6),
			sample(20, 6),
			sample(22, 6)
		];
		const result = buildSteadinessObservation(samples, NOW);
		expect(result.direction).toBe('more-varied');
	});

	it('påstår ingen riktning när skillnaden är för liten', () => {
		const samples = [
			sample(1, 5),
			sample(3, 6),
			sample(5, 5),
			sample(7, 6),
			sample(16, 5),
			sample(18, 6),
			sample(20, 5),
			sample(22, 6)
		];
		const result = buildSteadinessObservation(samples, NOW);
		expect(result.hasComparison).toBe(true);
		expect(result.direction).toBe('unchanged');
	});
});

describe('tema', () => {
	const themes = [
		{ label: 'Sömn', count: 7 },
		{ label: 'Arbete', count: 9 }
	];

	it('visar det vanligaste temat när samtycke finns', () => {
		const observation = buildThemeObservation(themes, true);
		expect(observation).toEqual({
			id: 'theme',
			label: 'Återkommande tema',
			text: 'Arbete nämns i 9 reflektioner.'
		});
	});

	it('visar inget tema utan samtycke', () => {
		expect(buildThemeObservation(themes, false)).toBeNull();
	});

	it('visar inget tema utan data', () => {
		expect(buildThemeObservation([], true)).toBeNull();
		expect(buildThemeObservation(null, true)).toBeNull();
		expect(buildThemeObservation(undefined, true)).toBeNull();
	});

	it('kräver att temat nämnts i minst två reflektioner', () => {
		expect(buildThemeObservation([{ label: 'Sömn', count: 1 }], true)).toBeNull();
	});
});

describe('buildRecentPeriodView', () => {
	const heatmap = {
		'2026-08-02': 1,
		'2026-07-30': 1,
		'2026-07-20': 2,
		'2026-07-13': 1
	};

	it('visar reservläget vid färre än fyra humörpunkter', () => {
		const view = buildRecentPeriodView({
			samples: [sample(1, 5), sample(3, 6), sample(5, 7)],
			heatmapData: heatmap,
			themes: null,
			hasConsent: false,
			periodDays: 30,
			now: NOW
		});

		expect(view.sampleCount).toBe(3);
		expect(view.sampleCount).toBeLessThan(MIN_MOOD_POINTS);
		expect(view.hasChart).toBe(false);
		expect(view.points).toEqual([]);
		expect(view.summary).toBe(CHART_FALLBACK_COPY);
		// Återkomsten finns kvar som observation även utan humörkurva.
		expect(view.observations.map((item) => item.id)).toEqual(['return']);
		expect(view.observations[0].text).toBe('Aktiv under 3 olika veckor senaste 30 dagarna.');
	});

	it('ritar kurvan och faller tillbaka på neutral copy utan jämförelseunderlag', () => {
		const view = buildRecentPeriodView({
			samples: [sample(1, 5), sample(3, 6), sample(5, 7), sample(7, 6)],
			heatmapData: heatmap,
			themes: null,
			hasConsent: false,
			periodDays: 30,
			now: NOW
		});

		expect(view.hasChart).toBe(true);
		expect(view.points).toHaveLength(4);
		expect(view.summary).toBe(NEUTRAL_OBSERVATION_COPY);
		// Observationen räknar bara underlaget, jämförelsen ligger i sammanfattningen.
		expect(view.observations[0]).toEqual({
			id: 'mood',
			label: 'Mående',
			text: '4 humörnoteringar, mellan 5 och 7 på skalan.'
		});
		expect(view.observations[0].text).not.toBe(view.summary);
	});

	it('formulerar mående-observationen utan tolkning när alla värden är lika', () => {
		const view = buildRecentPeriodView({
			samples: [sample(1, 6), sample(3, 6), sample(5, 6), sample(7, 6)],
			heatmapData: heatmap,
			themes: null,
			hasConsent: false,
			periodDays: 30,
			now: NOW
		});

		expect(view.observations[0].text).toBe('4 humörnoteringar, alla på 6.');
	});

	it('tar med tema som egen observation när samtycke finns', () => {
		const view = buildRecentPeriodView({
			samples: [sample(1, 5), sample(3, 6), sample(5, 7), sample(7, 6)],
			heatmapData: heatmap,
			themes: [{ label: 'Sömn', count: 5 }],
			hasConsent: true,
			periodDays: 30,
			now: NOW
		});

		expect(view.observations.map((item) => item.id)).toEqual(['mood', 'theme', 'return']);
		expect(view.observations[1].text).toBe('Sömn nämns i 5 reflektioner.');
	});

	it('aggregerar veckovis för 3 månader', () => {
		const view = buildRecentPeriodView({
			samples: [sample(0, 6), sample(1, 8), sample(7, 4), sample(14, 5)],
			heatmapData: heatmap,
			themes: null,
			hasConsent: false,
			periodDays: 90,
			now: NOW
		});

		expect(view.resolution).toBe('week');
		expect(view.sampleCount).toBe(4);
		// Fyra dagar fördelade på tre ISO-veckor.
		expect(view.points).toHaveLength(3);
		expect(view.points.at(-1)?.count).toBe(2);
	});

	it('ger ett textalternativ som beskriver skalan och alla punkter', () => {
		const view = buildRecentPeriodView({
			samples: [sample(1, 5), sample(3, 6), sample(5, 7), sample(7, 6)],
			heatmapData: heatmap,
			themes: null,
			hasConsent: false,
			periodDays: 30,
			now: NOW
		});

		expect(view.textAlternative).toContain('4 mätpunkter');
		expect(view.textAlternative).toContain('1 tungt till 10 ljusare');
		expect(view.textAlternative).not.toContain('NaN');
		expect(view.textAlternative).not.toContain('undefined');
	});

	it('beskriver reservläget i textalternativet', () => {
		const view = buildRecentPeriodView({
			samples: [],
			heatmapData: {},
			themes: null,
			hasConsent: false,
			periodDays: 30,
			now: NOW
		});

		expect(view.textAlternative).toContain(CHART_FALLBACK_COPY);
		expect(view.observations[0].text).toBe('Inga skrivna dagar senaste 30 dagarna.');
	});

	it('lämnar heatmapData oförändrad', () => {
		const heatmapInput = { ...heatmap };
		const before = JSON.stringify(heatmapInput);

		buildRecentPeriodView({
			samples: [sample(1, 5), sample(3, 6), sample(5, 7), sample(7, 6)],
			heatmapData: heatmapInput,
			themes: [{ label: 'Sömn', count: 5 }],
			hasConsent: true,
			periodDays: 180,
			now: NOW
		});

		expect(JSON.stringify(heatmapInput)).toBe(before);
		expect(heatmapInput).toEqual(heatmap);
	});

	it('lämnar humörunderlaget oförändrat mellan perioder', () => {
		const samples = [sample(1, 5), sample(3, 6), sample(40, 7), sample(100, 6)];
		const before = JSON.stringify(samples);

		for (const period of [30, 90, 180] as const) {
			buildRecentPeriodView({
				samples,
				heatmapData: heatmap,
				themes: null,
				hasConsent: false,
				periodDays: period,
				now: NOW
			});
		}

		expect(JSON.stringify(samples)).toBe(before);
	});
});
