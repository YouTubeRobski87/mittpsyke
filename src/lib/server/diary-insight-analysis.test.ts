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
