import { describe, expect, it, vi } from 'vitest';
import { generateAIText, type AITextProvider } from './ai/text-generation';
import { buildLighterDaysView, type LighterDaysRow } from './progress-lighter-days';
import {
	buildLighterDaysSummaryRequest,
	collectSummaryFacts,
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
const facts = collectSummaryFacts(view);

describe('AI-sammanfattningens underlag', () => {
	it('binder varje observation till serverns siffror och ordagranna utdrag från samma tema', () => {
		expect(facts).toHaveLength(1);
		const [fact] = facts;
		expect(fact.text).toBe(`${view.themes[0].note} ${view.themes[0].comparison}`);
		expect(fact.sources.map((source) => source.entryId).sort()).toEqual(['e1', 'e2', 'e3']);
		for (const source of fact.sources) {
			expect(rows.find((row) => row.id === source.entryId)?.text).toContain(source.excerpt);
		}
		const request = buildLighterDaysSummaryRequest(facts);
		const prompt = request.messages[0].content;
		expect(prompt).toContain(fact.text);
		expect(prompt).not.toContain('Vanlig dag hemma.');
		expect(request.outputFormat).toBe('json_object');
	});

	it('erbjuder ingen observation från ett dolt tema eller ett tema utan tillåtna utdrag', () => {
		expect(collectSummaryFacts(buildLighterDaysView(rows, 30, { [view.themes[0].id]: { hidden: true } }, NOW))).toEqual([]);
		expect(collectSummaryFacts({
			...view,
			themes: view.themes.map((theme) => ({
				...theme,
				evidence: theme.evidence.map((item) => ({ ...item, excerpt: null }))
			}))
		})).toEqual([]);
	});
});

describe('modellen får enbart välja serverns observationer', () => {
	it('återger endast serverns text och källor, utan dubletter', () => {
		expect(parseLighterDaysSummary('{"factIds":[1,1]}', facts)).toEqual(facts);
	});

	it.each([
		['ogiltigt nummer', { factIds: [99] }],
		['ogiltigt nummer bland giltiga', { factIds: [1, 99] }],
		['felaktigt påstående med giltig källa', { statements: [{ text: 'Arbete förekom.', sources: [1] }] }],
		['påhittat citat med giltigt val', { factIds: [1], quote: 'Jag sprang ett maraton.' }],
		['påhittad siffra med giltigt val', { factIds: [{ id: 1, count: 99 }] }],
		['tomt urval', { factIds: [] }]
	])('visar inget för %s', (_name, reply) => {
		expect(parseLighterDaysSummary(JSON.stringify(reply), facts)).toEqual([]);
	});

	it('visar inget vid trasigt JSON eller tomt serverunderlag', () => {
		expect(parseLighterDaysSummary('inte json', facts)).toEqual([]);
		expect(parseLighterDaysSummary('{"factIds":[1]}', [])).toEqual([]);
	});

	it('går genom den gemensamma, injicerbara AI-tjänsten', async () => {
		const provider: AITextProvider = {
			generate: vi.fn().mockResolvedValue('{"factIds":[1]}')
		};
		const result = await generateAIText(buildLighterDaysSummaryRequest(facts), provider);
		expect(provider.generate).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'diary-narrative' }));
		expect(parseLighterDaysSummary(result.text, facts)).toEqual(facts);
	});
});
