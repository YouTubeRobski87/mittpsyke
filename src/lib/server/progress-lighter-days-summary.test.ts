import { describe, expect, it, vi } from 'vitest';
import { generateAIText, type AITextProvider } from './ai/text-generation';
import { buildLighterDaysView, type LighterDaysRow } from './progress-lighter-days';
import {
	buildLighterDaysSummaryRequest,
	collectSummarySources,
	parseLighterDaysSummary
} from './progress-lighter-days-summary';

const NOW = new Date('2026-06-30T12:00:00Z');

function entry(id: string, date: string, mood: number, text: string): LighterDaysRow {
	return { id, created_at: `${date}T10:00:00.000Z`, mood, text };
}

const rows: LighterDaysRow[] = [
	entry('e1', '2026-06-02', 8, 'Tog en promenad i kvarteret efteråt.'),
	entry('e2', '2026-06-03', 9, 'Promenad före frukost.'),
	entry('e3', '2026-06-10', 8, 'En promenad till affären.'),
	...['06-04', '06-05', '06-11', '06-12', '06-16', '06-17', '06-18'].map((day, index) =>
		entry(`b${index}`, `2026-${day}`, 4, 'Vanlig dag hemma.')
	)
];

const view = buildLighterDaysView(rows, 30, {}, NOW);
const sources = collectSummarySources(view);

describe('AI-sammanfattningens underlag', () => {
	it('skickar bara ordagranna utdrag ur användarens egna inlägg, numrerade', () => {
		expect(sources.map((source) => source.entryId).sort()).toEqual(['e1', 'e2', 'e3']);
		for (const source of sources) {
			const original = rows.find((row) => row.id === source.entryId);
			expect(original?.text).toContain(source.excerpt);
		}
		const request = buildLighterDaysSummaryRequest(view, sources);
		const prompt = request.messages.map((message) => message.content).join('\n');
		expect(prompt).toContain('[1]');
		// Inlägg utan temat (jämförelsegruppen) skickas aldrig.
		expect(prompt).not.toContain('Vanlig dag hemma.');
		expect(request.outputFormat).toBe('json_object');
	});
});

describe('varje påstående måste gå att spåra', () => {
	it('behåller påståenden som pekar på existerande utdrag och bifogar dem', () => {
		const raw = JSON.stringify({
			statements: [{ text: 'Promenad nämns i tre inlägg, bland annat "Promenad före frukost." [2]', sources: [2, 3] }]
		});
		const [statement] = parseLighterDaysSummary(raw, sources);

		expect(statement.text).toBe('Promenad nämns i tre inlägg, bland annat "Promenad före frukost."');
		expect(statement.sources.map((source) => source.ref)).toEqual([2, 3]);
	});

	it('kastar påståenden utan underlag eller med påhittade källnummer', () => {
		const raw = JSON.stringify({
			statements: [
				{ text: 'Promenader återkommer.', sources: [] },
				{ text: 'Promenader återkommer ofta.', sources: [99] },
				{ text: 'Promenader återkommer ofta i juni.' }
			]
		});

		expect(parseLighterDaysSummary(raw, sources)).toEqual([]);
	});

	it('kastar identitets-, diagnos- och orsakspåståenden även med giltiga källor', () => {
		const raw = JSON.stringify({
			statements: [
				{ text: 'Du är en person som behöver röra på dig.', sources: [1] },
				{ text: 'Det kan tyda på depression.', sources: [1] },
				{ text: 'Promenaderna ledde till högre humör.', sources: [1] },
				{ text: 'Promenad fanns med i alla tre inläggen.', sources: [1, 2, 3] }
			]
		});

		expect(parseLighterDaysSummary(raw, sources).map((statement) => statement.text)).toEqual([
			'Promenad fanns med i alla tre inläggen.'
		]);
	});

	it('tål ett trasigt svar utan att visa något', () => {
		expect(parseLighterDaysSummary('inte json', sources)).toEqual([]);
	});

	it('går genom den gemensamma, injicerbara AI-tjänsten', async () => {
		const provider: AITextProvider = {
			generate: vi.fn().mockResolvedValue(JSON.stringify({ statements: [{ text: 'Promenad nämns tre gånger.', sources: [1] }] }))
		};
		const result = await generateAIText(buildLighterDaysSummaryRequest(view, sources), provider);

		expect(provider.generate).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'diary-narrative' }));
		expect(parseLighterDaysSummary(result.text, sources)).toHaveLength(1);
	});
});
