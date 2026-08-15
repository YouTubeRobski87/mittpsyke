import { describe, expect, it } from 'vitest';
import {
	buildDiaryProgressView,
	buildMoodTrend,
	countEntryDays,
	getPeriodWindow,
	MIN_MOOD_DAYS_PER_HALF,
	MOOD_TREND_THRESHOLD,
	toMoodDayAverages,
	type DiaryPeriodDays
} from './diary-progress';
import { shiftDateKey } from './stockholm-date';
import type { MoodSample } from './progress-recent-period';

// Fast tidpunkt: 15 augusti 2026, mitt på dagen svensk tid. Alla förväntade
// datum nedan är räknade från detta.
const NOW = new Date('2026-08-15T10:00:00+02:00');
const TODAY = '2026-08-15';

/** Datum N dagar före dagens datum. */
function daysAgo(days: number): string {
	return shiftDateKey(TODAY, -days);
}

function sample(days: number, mood: number): MoodSample {
	return { date: daysAgo(days), mood };
}

/** Heatmap med ett inlägg per angiven dag. */
function heatmap(...days: number[]): Record<string, number> {
	return Object.fromEntries(days.map((day) => [daysAgo(day), 1]));
}

function view(options: {
	samples?: MoodSample[];
	heatmapData?: Record<string, number> | null;
	period?: DiaryPeriodDays;
}) {
	return buildDiaryProgressView({
		samples: options.samples ?? [],
		heatmapData: options.heatmapData ?? null,
		period: options.period ?? 30,
		now: NOW
	});
}

describe('getPeriodWindow', () => {
	it('räknar perioden inklusive dagens datum', () => {
		expect(getPeriodWindow(7, NOW)).toEqual({ startKey: '2026-08-09', endKey: TODAY });
		expect(getPeriodWindow(30, NOW)).toEqual({ startKey: '2026-07-17', endKey: TODAY });
		expect(getPeriodWindow(90, NOW)).toEqual({ startKey: '2026-05-18', endKey: TODAY });
	});

	it('slutar alltid på dagens datum, så framtida datum ligger utanför', () => {
		for (const period of [7, 30, 90] as DiaryPeriodDays[]) {
			expect(getPeriodWindow(period, NOW).endKey).toBe(TODAY);
		}
	});
});

describe('countEntryDays', () => {
	it('ger 0 utan data', () => {
		expect(countEntryDays(null, getPeriodWindow(30, NOW))).toBe(0);
		expect(countEntryDays({}, getPeriodWindow(30, NOW))).toBe(0);
	});

	it('räknar dagar, inte inlägg', () => {
		const window = getPeriodWindow(30, NOW);
		const data = { [daysAgo(1)]: 4, [daysAgo(2)]: 1 };

		expect(countEntryDays(data, window)).toBe(2);
	});

	it('räknar bara dagar inom perioden', () => {
		const data = heatmap(0, 3, 6, 10, 40);

		expect(countEntryDays(data, getPeriodWindow(7, NOW))).toBe(3);
		expect(countEntryDays(data, getPeriodWindow(30, NOW))).toBe(4);
		expect(countEntryDays(data, getPeriodWindow(90, NOW))).toBe(5);
	});

	it('räknar inte framtida datum', () => {
		const data = { [shiftDateKey(TODAY, 1)]: 3, [shiftDateKey(TODAY, 5)]: 2, [TODAY]: 1 };

		expect(countEntryDays(data, getPeriodWindow(30, NOW))).toBe(1);
	});

	it('ignorerar tomma dagar och skräpnycklar', () => {
		const data = { [daysAgo(1)]: 0, [daysAgo(2)]: 1, 'inte-ett-datum': 5 };

		expect(countEntryDays(data, getPeriodWindow(30, NOW))).toBe(1);
	});
});

describe('toMoodDayAverages', () => {
	it('slår samman flera humörvärden samma dag till ett medelvärde', () => {
		const window = getPeriodWindow(30, NOW);
		const averages = toMoodDayAverages([sample(1, 4), sample(1, 8), sample(2, 6)], window);

		expect(averages.size).toBe(2);
		expect(averages.get(daysAgo(1))).toBe(6);
		expect(averages.get(daysAgo(2))).toBe(6);
	});

	it('utesluter dagar utanför perioden', () => {
		const averages = toMoodDayAverages([sample(2, 5), sample(40, 9)], getPeriodWindow(7, NOW));

		expect([...averages.keys()]).toEqual([daysAgo(2)]);
	});

	it('tar inte med dagar som saknar humör', () => {
		// Dag 3 har inlägg i heatmap men inget humörvärde, och ska därför inte
		// finnas som nyckel alls - inte heller som ett neutralt värde.
		const averages = toMoodDayAverages([sample(1, 7)], getPeriodWindow(30, NOW));

		expect(averages.has(daysAgo(3))).toBe(false);
		expect(averages.size).toBe(1);
	});
});

describe('buildMoodTrend', () => {
	/** Humörvärden på angivna dagar, ett per dag. */
	function averages(entries: [number, number][]): Map<string, number> {
		return new Map(entries.map(([day, mood]) => [daysAgo(day), mood]));
	}

	it('påstår ingen trend utan data', () => {
		const trend = buildMoodTrend(new Map(), getPeriodWindow(30, NOW), 30);

		expect(trend.direction).toBe('insufficient');
		expect(trend.text).toBeNull();
	});

	it('påstår ingen trend när en halva har för få dagar', () => {
		// Senaste halvan (dag 0-14) har 3 dagar, tidigare halvan bara 2.
		const trend = buildMoodTrend(
			averages([
				[1, 6],
				[2, 6],
				[3, 6],
				[20, 5],
				[21, 5]
			]),
			getPeriodWindow(30, NOW),
			30
		);

		expect(trend.earlierMoodDays).toBe(2);
		expect(trend.direction).toBe('insufficient');
		expect(trend.text).toBeNull();
	});

	it('rapporterar ljusare när senaste halvan ligger över neutralzonen', () => {
		const trend = buildMoodTrend(
			averages([
				[1, 7],
				[3, 7],
				[5, 8],
				[20, 4],
				[22, 4],
				[24, 5]
			]),
			getPeriodWindow(30, NOW),
			30
		);

		expect(trend.direction).toBe('lighter');
		expect(trend.text).toContain('något ljusare');
	});

	it('rapporterar tyngre när senaste halvan ligger under neutralzonen', () => {
		const trend = buildMoodTrend(
			averages([
				[1, 4],
				[3, 4],
				[5, 3],
				[20, 7],
				[22, 8],
				[24, 7]
			]),
			getPeriodWindow(30, NOW),
			30
		);

		expect(trend.direction).toBe('heavier');
		expect(trend.text).toContain('något tyngre');
	});

	it('rapporterar ungefär samma inom neutralzonen', () => {
		const trend = buildMoodTrend(
			averages([
				[1, 6],
				[3, 6],
				[5, 6],
				[20, 6],
				[22, 6],
				[24, 6]
			]),
			getPeriodWindow(30, NOW),
			30
		);

		expect(trend.direction).toBe('same');
		expect(trend.text).toContain('ungefär på samma nivå');
	});

	it('behandlar exakt neutralzonens gräns som en riktning, strax under som samma', () => {
		const atThreshold = buildMoodTrend(
			averages([
				[1, 5 + MOOD_TREND_THRESHOLD],
				[3, 5 + MOOD_TREND_THRESHOLD],
				[5, 5 + MOOD_TREND_THRESHOLD],
				[20, 5],
				[22, 5],
				[24, 5]
			]),
			getPeriodWindow(30, NOW),
			30
		);
		const justBelow = buildMoodTrend(
			averages([
				[1, 5 + MOOD_TREND_THRESHOLD - 0.01],
				[3, 5 + MOOD_TREND_THRESHOLD - 0.01],
				[5, 5 + MOOD_TREND_THRESHOLD - 0.01],
				[20, 5],
				[22, 5],
				[24, 5]
			]),
			getPeriodWindow(30, NOW),
			30
		);

		expect(atThreshold.direction).toBe('lighter');
		expect(justBelow.direction).toBe('same');
	});

	it('utesluter mittendagen vid ojämnt antal dagar', () => {
		// 7 dagar ger halvor om 3: dag 0-2 och dag 4-6. Dag 3 är mitten.
		const window = getPeriodWindow(7, NOW);
		const withMiddleOnly = buildMoodTrend(
			averages([
				[0, 9],
				[1, 9],
				[2, 9],
				[3, 1],
				[4, 3],
				[5, 3],
				[6, 3]
			]),
			window,
			7
		);

		expect(withMiddleOnly.recentMoodDays).toBe(3);
		expect(withMiddleOnly.earlierMoodDays).toBe(3);
		expect(withMiddleOnly.direction).toBe('lighter');
	});

	it('kräver humör på alla dagar i båda halvorna vid 7 dagar', () => {
		const trend = buildMoodTrend(
			averages([
				[0, 8],
				[1, 8],
				[5, 4],
				[6, 4]
			]),
			getPeriodWindow(7, NOW),
			7
		);

		expect(MIN_MOOD_DAYS_PER_HALF).toBe(3);
		expect(trend.direction).toBe('insufficient');
	});

	it('låter inte en enskild dag med många inlägg styra jämförelsen', () => {
		// Fem värden samma dag ska väga som en dag, inte fem. Jämförelsen blir
		// därför identisk med att dagen bara hade ett inlägg.
		const window = getPeriodWindow(30, NOW);
		const laterDays = [sample(3, 7), sample(5, 7)];
		const earlierDays = [sample(20, 6), sample(22, 6), sample(24, 6)];

		const fiveOnOneDay = buildMoodTrend(
			toMoodDayAverages(
				[
					sample(1, 1),
					sample(1, 1),
					sample(1, 1),
					sample(1, 1),
					sample(1, 1),
					...laterDays,
					...earlierDays
				],
				window
			),
			window,
			30
		);
		const oneOnThatDay = buildMoodTrend(
			toMoodDayAverages([sample(1, 1), ...laterDays, ...earlierDays], window),
			window,
			30
		);

		expect(fiveOnOneDay.recentMoodDays).toBe(3);
		expect(fiveOnOneDay).toEqual(oneOnThatDay);
	});
});

describe('buildDiaryProgressView', () => {
	it('0 registreringar ger tomt läge utan trend och utan kurva', () => {
		const result = view({});

		expect(result.entryDays).toBe(0);
		expect(result.moodDays).toBe(0);
		expect(result.hasChart).toBe(false);
		expect(result.points).toEqual([]);
		expect(result.summary).toContain('inte tillräckligt många registrerade dagar');
		expect(result.trend.text).toBeNull();
	});

	it('1 registrering räknas men ger ingen trend och ingen kurva', () => {
		const result = view({ samples: [sample(1, 6)], heatmapData: heatmap(1) });

		expect(result.entryDays).toBe(1);
		expect(result.moodDays).toBe(1);
		expect(result.summary).toBe('Du har skrivit 1 av de senaste 30 dagarna.');
		expect(result.hasChart).toBe(false);
		expect(result.trend.text).toBeNull();
	});

	it('sparse humördata ger antal men ingen trendtolkning', () => {
		const result = view({
			samples: [sample(1, 6), sample(4, 7)],
			heatmapData: heatmap(1, 2, 4, 9)
		});

		expect(result.entryDays).toBe(4);
		expect(result.moodDays).toBe(2);
		expect(result.hasChart).toBe(false);
		expect(result.trend.direction).toBe('insufficient');
		expect(result.trend.text).toBeNull();
	});

	it('tillräcklig humördata ger kurva och en neutral jämförelse', () => {
		const samples = [
			sample(1, 7),
			sample(3, 7),
			sample(5, 8),
			sample(20, 4),
			sample(22, 4),
			sample(24, 5)
		];
		const result = view({ samples, heatmapData: heatmap(1, 3, 5, 20, 22, 24) });

		expect(result.moodDays).toBe(6);
		expect(result.hasChart).toBe(true);
		expect(result.points.length).toBeGreaterThan(0);
		expect(result.trend.direction).toBe('lighter');
		expect(result.summary).toBe('Du har skrivit 6 av de senaste 30 dagarna.');
	});

	it('dagar utan humör räknas som skrivdagar men inte som humördagar', () => {
		const result = view({ samples: [sample(1, 6)], heatmapData: heatmap(1, 2, 3, 4, 5) });

		expect(result.entryDays).toBe(5);
		expect(result.moodDays).toBe(1);
	});

	it('framtida poster räknas inte i något av talen', () => {
		const future = shiftDateKey(TODAY, 3);
		const result = view({
			samples: [{ date: future, mood: 10 }, sample(1, 5)],
			heatmapData: { [future]: 2, [daysAgo(1)]: 1 }
		});

		expect(result.entryDays).toBe(1);
		expect(result.moodDays).toBe(1);
	});

	it('7, 30 och 90 använder olika datumintervall för samma data', () => {
		const samples = [sample(2, 6), sample(20, 6), sample(60, 6)];
		const heatmapData = heatmap(2, 20, 60);

		expect(view({ samples, heatmapData, period: 7 }).moodDays).toBe(1);
		expect(view({ samples, heatmapData, period: 30 }).moodDays).toBe(2);
		expect(view({ samples, heatmapData, period: 90 }).moodDays).toBe(3);

		expect(view({ samples, heatmapData, period: 7 }).entryDays).toBe(1);
		expect(view({ samples, heatmapData, period: 30 }).entryDays).toBe(2);
		expect(view({ samples, heatmapData, period: 90 }).entryDays).toBe(3);
	});

	it('periodgränsen är inklusive och deterministisk', () => {
		const samples = [sample(6, 6), sample(7, 6)];
		const heatmapData = heatmap(6, 7);
		const result = view({ samples, heatmapData, period: 7 });

		// Dag 6 är första dygnet i 7-dagarsperioden, dag 7 ligger utanför.
		expect(result.moodDays).toBe(1);
		expect(result.entryDays).toBe(1);
	});

	it('summeringen nämner den valda periodens längd', () => {
		const heatmapData = heatmap(1, 2);

		expect(view({ heatmapData, period: 7 }).summary).toBe('Du har skrivit 2 av de senaste 7 dagarna.');
		expect(view({ heatmapData, period: 90 }).summary).toBe('Du har skrivit 2 av de senaste 90 dagarna.');
	});

	it('90 dagar aggregeras per vecka, 7 och 30 per dag', () => {
		const samples = [sample(1, 6), sample(2, 6), sample(3, 6), sample(4, 6)];
		const heatmapData = heatmap(1, 2, 3, 4);

		expect(view({ samples, heatmapData, period: 30 }).points).toHaveLength(4);
		// Fyra dagar i samma vecka blir en veckopunkt.
		expect(view({ samples, heatmapData, period: 90 }).points).toHaveLength(1);
	});

	it('textalternativet beskriver kurvan utan färg eller form', () => {
		const samples = [sample(1, 7), sample(3, 7), sample(5, 8), sample(7, 6)];
		const result = view({ samples, heatmapData: heatmap(1, 3, 5, 7) });

		expect(result.textAlternative).toContain('1 tungt till 10 ljusare');
		expect(result.textAlternative).toContain('av 10');
	});

	it('formulerar sig om registreringarna, inte om personen', () => {
		const samples = [
			sample(1, 8),
			sample(3, 8),
			sample(5, 9),
			sample(20, 3),
			sample(22, 3),
			sample(24, 4)
		];
		const result = view({ samples, heatmapData: heatmap(1, 3, 5, 20, 22, 24) });
		const allText = [result.summary, result.trend.text ?? '', result.textAlternative].join(' ');

		expect(allText).not.toMatch(/du mår|mår bättre|mår sämre|psykisk|du verkar|förbättrat/i);
	});
});
