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
		expect(nature?.evidence).toContain('4 av 12 dagar med registrerat humör nämner natur');
	});

	it('räknar inget samband för ett enstaka omnämnande', () => {
		const entries = prepareEntries([
			{ created_at: '2026-03-01T12:00:00.000Z', mood: 2, text: 'Ekonomi stressar mig.' },
			...rows(11, 2, 6, 'Jag skrev några rader om dagen.')
		]);

		expect(buildTopicMoodAssociations(entries).some((association) => association.label === 'Ekonomi')).toBe(false);
	});
});

describe('tema och humör räknas per självständig kalenderdag', () => {
	const diaryRow = (createdAt: string, mood: number | null, text: string): DiaryInsightRow => ({
		created_at: createdAt,
		mood,
		text
	});
	const ordinaryDay = (day: number, mood = 4) =>
		diaryRow(`2026-04-${String(day).padStart(2, '0')}T12:00:00.000Z`, mood, 'En vanlig dag hemma.');

	it('A. låter inte fyra anteckningar samma dag ensamma uppfylla återkomsttröskeln', () => {
		const entries = prepareEntries([
			...Array.from({ length: 4 }, (_, hour) =>
				diaryRow(`2026-04-01T${String(8 + hour).padStart(2, '0')}:00:00.000Z`, 9, 'Promenad i parken.')
			),
			ordinaryDay(2), ordinaryDay(3), ordinaryDay(4), ordinaryDay(5)
		]);
		expect(buildTopicMoodAssociations(entries).some((item) => item.label === 'Motion')).toBe(false);
	});

	it('B. räknar fyra anteckningar på fyra olika dagar som fyra observationer', () => {
		const entries = prepareEntries([
			...rows(4, 1, 8, 'Promenad i parken.'),
			ordinaryDay(5), ordinaryDay(6), ordinaryDay(7), ordinaryDay(8)
		]);
		const motion = buildTopicMoodAssociations(entries).find((item) => item.label === 'Motion');
		expect(motion).toMatchObject({ matchingCount: 4, otherCount: 4, matchingEntryCount: 4, otherEntryCount: 4 });
	});

	it('C. väger ihop flera moodvärden samma dag till ett dagsmedel', () => {
		const entries = prepareEntries([
			diaryRow('2026-04-01T08:00:00.000Z', 10, 'Promenad i parken.'),
			diaryRow('2026-04-01T18:00:00.000Z', 2, 'Promenad i parken.'),
			diaryRow('2026-04-02T12:00:00.000Z', 6, 'Promenad i parken.'),
			diaryRow('2026-04-03T12:00:00.000Z', 6, 'Promenad i parken.'),
			ordinaryDay(4, 3), ordinaryDay(5, 3), ordinaryDay(6, 3)
		]);
		const motion = buildTopicMoodAssociations(entries).find((item) => item.label === 'Motion');
		expect(motion).toMatchObject({ matchingCount: 3, matchingEntryCount: 4, matchingAverage: 6 });
	});

	it('D. använder kalenderdygn i Europe/Stockholm runt midnatt', () => {
		const entries = prepareEntries([
			diaryRow('2026-01-01T23:15:00.000Z', 8, 'Promenad i parken.'),
			diaryRow('2026-01-02T00:15:00.000Z', 8, 'Promenad i parken.')
		]);
		expect(entries.map((entry) => entry.dateKey)).toEqual(['2026-01-02', '2026-01-02']);
	});

	it('E. räknar inte dagar som saknar moodvärde i associationen', () => {
		const entries = prepareEntries([
			...rows(4, 1, 8, 'Promenad i parken.').map((row) => ({ ...row, mood: null })),
			ordinaryDay(5), ordinaryDay(6), ordinaryDay(7), ordinaryDay(8)
		]);
		expect(buildTopicMoodAssociations(entries).some((item) => item.label === 'Motion')).toBe(false);
	});

	it('F. avstår när temat förekommer många gånger men på färre än tre unika dagar', () => {
		const entries = prepareEntries([
			...Array.from({ length: 3 }, (_, index) => diaryRow(`2026-04-01T${10 + index}:00:00.000Z`, 8, 'Promenad.')),
			...Array.from({ length: 3 }, (_, index) => diaryRow(`2026-04-02T${10 + index}:00:00.000Z`, 8, 'Promenad.')),
			ordinaryDay(3), ordinaryDay(4), ordinaryDay(5)
		]);
		expect(buildTopicMoodAssociations(entries).some((item) => item.label === 'Motion')).toBe(false);
	});

	it('G. behåller den befintliga tröskeln när tre unika dagar har stöd', () => {
		const entries = prepareEntries([
			...rows(3, 1, 8, 'Promenad i parken.'),
			ordinaryDay(4), ordinaryDay(5), ordinaryDay(6)
		]);
		expect(buildTopicMoodAssociations(entries).find((item) => item.label === 'Motion')).toMatchObject({
			matchingCount: 3,
			otherCount: 3
		});
	});

	it('H. känner igen samma tema på unika dagar i olika veckor', () => {
		const entries = prepareEntries([
			diaryRow('2026-04-01T12:00:00.000Z', 8, 'Promenad i parken.'),
			diaryRow('2026-04-08T12:00:00.000Z', 8, 'Promenad i parken.'),
			diaryRow('2026-04-15T12:00:00.000Z', 8, 'Promenad i parken.'),
			ordinaryDay(20), ordinaryDay(21), ordinaryDay(22)
		]);
		expect(buildTopicMoodAssociations(entries).some((item) => item.label === 'Motion')).toBe(true);
	});

	it('I. håller relevanta temadagar och övriga jämförelsedagar isär', () => {
		const entries = prepareEntries([
			...rows(3, 1, 9, 'Promenad i parken.'),
			ordinaryDay(4, 3), ordinaryDay(5, 4), ordinaryDay(6, 5),
			diaryRow('2026-04-06T18:00:00.000Z', 5, 'Jag läste en bok hemma.')
		]);
		const motion = buildTopicMoodAssociations(entries).find((item) => item.label === 'Motion');
		expect(motion).toMatchObject({ matchingCount: 3, otherCount: 3, otherEntryCount: 4, totalCount: 6 });
		expect(motion?.evidence).toContain('3 av 6 dagar med registrerat humör');
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
