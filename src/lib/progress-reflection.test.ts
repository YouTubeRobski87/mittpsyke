import { describe, expect, it } from 'vitest';
import {
	buildMoodChangeObservation,
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
