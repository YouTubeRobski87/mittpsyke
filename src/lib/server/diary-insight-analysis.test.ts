import { describe, expect, it } from 'vitest';
import * as insightAnalysis from './diary-insight-analysis';
import { buildTopicMoodAssociations, detectTopicLabels, prepareEntries, type DiaryInsightRow } from './diary-insight-analysis';

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
	it('låter inte generiska ord ensamma skapa teman', () => {
		for (const text of ['Det är mycket på bordet.', 'Jag vill läsa en bok.', 'Jag var ute en stund.', 'Okej.']) {
			expect(detectTopicLabels(text), text).toEqual([]);
		}
	});

	it('matchar hela svenska ord i stället för delsträngar', () => {
		expect(detectTopicLabels('Jag sökte äventyr på söndagen och fick sparken.')).toEqual([]);
		expect(detectTopicLabels('Jag tog en promenad i skogen efter jobbet.')).toEqual(['Arbete', 'Motion', 'Natur']);
	});

	it('avstår vid tydligt negerade teman men hittar ett senare uttryckligt omnämnande', () => {
		expect(detectTopicLabels('Jag är inte stressad och känner ingen oro. Det blev ingen promenad.')).toEqual([]);
		expect(detectTopicLabels('Jag är inte stressad idag. Stressen var däremot tydlig igår.')).toEqual(['Stress']);
	});

	it('kräver en otvetydig fras för självmedkänsla', () => {
		expect(detectTopicLabels('Det känns okej.')).toEqual([]);
		expect(detectTopicLabels('Jag försöker vara snäll mot mig själv.')).toEqual(['Självmedkänsla']);
	});

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
