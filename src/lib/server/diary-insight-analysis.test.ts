import { describe, expect, it } from 'vitest';
import * as insightAnalysis from './diary-insight-analysis';
import { buildTopicMoodAssociations, prepareEntries, type DiaryInsightRow } from './diary-insight-analysis';

function rows(
	count: number,
	day: number,
	mood: number,
	text: string
): DiaryInsightRow[] {
	return Array.from({ length: count }, (_, index) => ({
		created_at: `2026-02-${String(day + index).padStart(2, '0')}T12:00:00.000Z`,
		mood,
		text
	}));
}

describe('tema och humör i dagboksinläggen', () => {
	it('kopplar bara teman till måendet när jämförelsegruppen är tillräcklig', () => {
		const entries = prepareEntries([
			...rows(4, 1, 3, 'Stress och ekonomi känns tungt i dag.'),
			...rows(4, 5, 8, 'En promenad i naturen gav en lugn stund.'),
			...rows(4, 9, 6, 'Jag skrev några rader om dagen.')
		]);
		const associations = buildTopicMoodAssociations(entries);
		const nature = associations.find((association) => association.label === 'Natur');

		expect(nature).toMatchObject({ matchingCount: 4, otherCount: 8 });
		expect(nature?.difference).toBeGreaterThan(0);
		expect(nature?.evidence).toContain('4 av 12 texter nämner natur');
	});

	it('räknar inget samband för ett enstaka omnämnande', () => {
		const entries = prepareEntries([
			{ created_at: '2026-03-01T12:00:00.000Z', mood: 2, text: 'Ekonomi stressar mig.' },
			...rows(11, 2, 6, 'Jag skrev några rader om dagen.')
		]);

		expect(buildTopicMoodAssociations(entries).some((association) => association.label === 'Ekonomi')).toBe(false);
	});
});

describe('ingen automatisk AI i dagboksanalysen', () => {
	it('har inte längre någon berättande analys som anropar en språkmodell', () => {
		expect(Object.keys(insightAnalysis)).not.toContain('buildDiaryNarrativeInsight');
		for (const value of Object.values(insightAnalysis)) {
			if (typeof value === 'function') expect(value.name).not.toMatch(/ai|narrative|story/i);
		}
	});
});
