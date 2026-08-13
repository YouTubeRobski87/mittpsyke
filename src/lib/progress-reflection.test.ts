import { describe, expect, it } from 'vitest';
import {
	buildMoodChangeObservation,
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
