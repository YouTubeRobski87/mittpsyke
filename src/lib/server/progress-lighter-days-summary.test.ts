import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import LighterDaysCard from '$lib/components/progress/LighterDaysCard.svelte';
import { getLighterDaysSummaryView, getVisibleComparisonThemes, MAX_SUMMARY_SOURCES } from '$lib/progress-summary-request';
import { generateAIText, type AITextProvider } from './ai/text-generation';
import { buildLighterDaysView, type LighterDaysRow } from './progress-lighter-days';
import {
	buildLighterDaysSummaryRequest,
	parseLighterDaysSummary
} from './progress-lighter-days-summary';

vi.mock('$lib/supabase', () => ({ supabase: {} }));

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
const facts = getLighterDaysSummaryView(view, false)!.facts;

describe('AI-sammanfattningens underlag', () => {
	it('binder varje observation till serverns siffror och ordagranna utdrag från samma tema', () => {
		expect(facts).toHaveLength(1);
		const [fact] = facts;
		expect(fact.text).toBe(`${view.helpfulPatterns!.themes[0].note} ${view.helpfulPatterns!.themes[0].comparison}`);
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
		const hidden = buildLighterDaysView(rows, 30, { [view.themes[0].id]: { hidden: true } }, NOW);
		expect(getLighterDaysSummaryView(hidden, false)).toBeNull();
		const withoutExcerpts = {
			...view,
			helpfulPatterns: { ready: true, themes: view.helpfulPatterns!.themes.map((theme) => ({
				...theme,
				evidence: theme.evidence.map((item) => ({ ...item, excerpt: null }))
			})) }
		};
		expect(getLighterDaysSummaryView(withoutExcerpts, false)).toBeNull();
		expect(render(LighterDaysCard, { props: { view: withoutExcerpts } }).body)
			.not.toContain('lighter-days-ai-button');
	});
	it('visar varken tema eller AI-knapp när promenader bara förekommer på två olika dagar', () => {
		const oldOnlyRows = [
			...rows.map((row) => row.id === 'e2' ? { ...row, created_at: rows[0].created_at } : row),
			entry('e4', '2026-06-20', 9, 'Vanlig dag hemma.')
		];
		const oldOnly = buildLighterDaysView(oldOnlyRows, 30, {}, NOW);
		expect(oldOnly.themes.map((theme) => theme.id)).toContain('Motion');
		expect(oldOnly.helpfulPatterns).toEqual({ ready: true, themes: [] });
		expect(getLighterDaysSummaryView(oldOnly, false)).toBeNull();
		const { body } = render(LighterDaysCard, { props: { view: oldOnly } });
		expect(body).not.toContain('lighter-days-ai-button');
		expect(body).not.toContain('Visa underlaget');
	});

	it('erbjuder ingen sammanfattning när andelarna skiljer sig med mindre än 15 procentenheter', () => {
		const closeShares = [
			...rows.map((row, index) => index >= 3 && index < 9 ? { ...row, text: 'Promenad.' } : row),
			entry('e4', '2026-06-20', 8, 'Vanlig dag hemma.'),
			entry('b7', '2026-06-21', 4, 'Vanlig dag hemma.'),
			entry('b8', '2026-06-22', 4, 'Vanlig dag hemma.')
		];
		const comparison = buildLighterDaysView(closeShares, 30, {}, NOW);
		expect(comparison.themes).toMatchObject([{ id: 'Motion', count: 3, base: 4, otherCount: 6, otherBase: 9 }]);
		expect(getLighterDaysSummaryView(comparison, false)).toBeNull();
		expect(render(LighterDaysCard, { props: { view: comparison } }).body).not.toContain('lighter-days-ai-button');
	});

	it('använder samma spärr för avkortat underlag i vyn och sammanfattningen', () => {
		const { body: full } = render(LighterDaysCard, { props: { view } });
		expect(full).toContain('lighter-days-ai-button');
		expect(full).toContain('antalet inlägg med temat och det totala antalet inlägg i varje grupp');
		expect(full).toContain('skickas till OpenAI');
		const { body: limited } = render(LighterDaysCard, { props: { view, comparisonLimited: true } });
		expect(limited).not.toContain('lighter-days-ai-button');
		expect(limited).not.toContain('Visa underlaget');
		expect(getLighterDaysSummaryView(view, true)).toBeNull();
	});

	it('begränsar utdragen till synliga teman och samma maximala antal', () => {
		const theme = view.helpfulPatterns!.themes[0];
		const themes = ['Motion', 'Natur', 'Sömn'].map((label) => ({
			...theme,
			id: label,
			label,
			note: label + ' förekom i jämförelsen.',
			evidence: Array.from({ length: 8 }, (_, index) => ({
				...theme.evidence[0],
				excerpt: label + ' utdrag ' + (index + 1)
			}))
		}));
		const comparison = { ...view, helpfulPatterns: { ready: true, themes } };
		expect(getVisibleComparisonThemes(comparison, false)).toEqual(themes);
		const snapshot = getLighterDaysSummaryView(comparison, false)!;
		expect(snapshot.facts.flatMap((fact) => fact.sources)).toHaveLength(MAX_SUMMARY_SOURCES);
		expect(snapshot.facts.map((fact) => fact.sources.length)).toEqual([8, 8, 4]);
		const payload = buildLighterDaysSummaryRequest(snapshot.facts).messages[0].content;
		expect(payload).not.toContain('Sömn utdrag 5');
		expect(payload).not.toContain(theme.evidence[0].entryId);
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
