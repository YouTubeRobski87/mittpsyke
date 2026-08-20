import { describe, expect, it, vi } from 'vitest';
import {
	buildDiaryNarrativeInsight,
	type DiaryInsightRow
} from './diary-insight-analysis';
import type { AITextProvider } from './ai/text-generation';

const rows: DiaryInsightRow[] = Array.from({ length: 12 }, (_, index) => ({
	created_at: `2026-01-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
	mood: index % 2 === 0 ? 4 : 6,
	text: index % 2 === 0 ? 'Stress på jobbet och trött efter en kort natt.' : 'En lugn promenad efter jobbet hjälpte lite.',
	tags: index % 2 === 0 ? ['jobb', 'sömn'] : ['promenad']
}));

describe('dagboksanalysens AI-gräns', () => {
	it('kör den deterministiska analysen utan provider när generering stängs av', async () => {
		const provider: AITextProvider = { generate: vi.fn().mockRejectedValue(new Error('Får inte anropas')) };
		const insight = await buildDiaryNarrativeInsight(rows, { provider, generateWithAi: false });

		expect(provider.generate).not.toHaveBeenCalled();
		expect(insight.generatedWithAi).toBe(false);
		expect(insight.entryCount).toBe(12);
		expect(insight.patterns.length).toBeGreaterThan(0);
	});

	it('använder den gemensamma, injicerbara providern för berättelsen', async () => {
		const provider: AITextProvider = {
			generate: vi.fn().mockResolvedValue(JSON.stringify({ storyParagraphs: ['Första stycket.', 'Andra stycket.', 'Tredje stycket.'] }))
		};
		const insight = await buildDiaryNarrativeInsight(rows, { provider });

		expect(provider.generate).toHaveBeenCalledWith(
			expect.objectContaining({ purpose: 'diary-narrative', outputFormat: 'json_object', timeoutMs: 20_000 })
		);
		expect(insight).toMatchObject({ generatedWithAi: true, storyParagraphs: ['Första stycket.', 'Andra stycket.', 'Tredje stycket.'] });
	});
});

describe('dagboksanalysens datagrund', () => {
	it('kopplar bara teman till måendet när jämförelsegruppen är tillräcklig', async () => {
		const rows: DiaryInsightRow[] = [
			...Array.from({ length: 4 }, (_, index) => ({
				created_at: `2026-02-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
				mood: 3,
				text: 'Stress och ekonomi känns tungt i dag.'
			})),
			...Array.from({ length: 4 }, (_, index) => ({
				created_at: `2026-02-${String(index + 5).padStart(2, '0')}T12:00:00.000Z`,
				mood: 8,
				text: 'En promenad i naturen gav en lugn stund.'
			})),
			...Array.from({ length: 4 }, (_, index) => ({
				created_at: `2026-02-${String(index + 9).padStart(2, '0')}T12:00:00.000Z`,
				mood: 6,
				text: 'Jag skrev några rader om dagen.'
			}))
		];

		const insight = await buildDiaryNarrativeInsight(rows, { generateWithAi: false });

		expect(insight.challenges.some((claim) => claim.title.includes('Stress'))).toBe(true);
		expect(insight.strengths.some((claim) => claim.title.includes('Natur'))).toBe(true);
		const combination = insight.patterns.find((claim) => claim.title.includes('Stress och Ekonomi'));
		expect(combination).toBeDefined();
		for (const claim of [...insight.challenges, ...insight.strengths, combination!]) {
			expect(claim.evidence).toMatch(/humörsnitt|registreringar|texter/);
		}
	});

	it('visar ingen temainsikt för ett enstaka omnämnande', async () => {
		const rows: DiaryInsightRow[] = [
			{ created_at: '2026-03-01T12:00:00.000Z', mood: 2, text: 'Ekonomi stressar mig.' },
			...Array.from({ length: 11 }, (_, index) => ({
				created_at: `2026-03-${String(index + 2).padStart(2, '0')}T12:00:00.000Z`,
				mood: 6,
				text: 'Jag skrev några rader om dagen.'
			}))
		];

		const insight = await buildDiaryNarrativeInsight(rows, { generateWithAi: false });

		expect(insight.challenges.some((claim) => claim.title.includes('Ekonomi'))).toBe(false);
	});

	it('skiljer måenderegistreringar från sparade texter i datagrunden', async () => {
		const rows: DiaryInsightRow[] = [
			{ created_at: '2026-04-01T12:00:00.000Z', mood: 5, text: null },
			{ created_at: '2026-04-02T12:00:00.000Z', mood: 7, text: '' },
			{ created_at: '2026-04-03T12:00:00.000Z', mood: null, text: 'En sparad text utan humör.' }
		];

		const insight = await buildDiaryNarrativeInsight(rows, { generateWithAi: false });

		expect(insight.dataBasis).toMatchObject({ moodEntryCount: 2, textEntryCount: 1 });
	});
});
