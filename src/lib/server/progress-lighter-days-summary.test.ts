import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import LighterDaysCard from '$lib/components/progress/LighterDaysCard.svelte';
import { getLighterDaysSummaryView } from '$lib/progress-summary-request';
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
const themeId = 'Motion';
const snapshot = getLighterDaysSummaryView(view, false, themeId)!;

describe('AI-sammanfattningens underlag', () => {
	it('skickar ett redan synligt utdrag utan datum, ID eller temastatistik', () => {
		expect(snapshot.sources).toHaveLength(1);
		const [source] = snapshot.sources;
		expect(source.excerpt).toBe(rows[0].text);
		const request = buildLighterDaysSummaryRequest(source);
		expect(JSON.parse(request.messages[0].content)).toEqual({ excerpt: source.excerpt });
		expect(request.outputFormat).toBe('json_object');
	});

	it('erbjuder ingen observation från ett dolt tema eller ett tema utan tillåtna utdrag', () => {
		const hidden = buildLighterDaysView(rows, 30, { [view.themes[0].id]: { hidden: true } }, NOW);
		expect(getLighterDaysSummaryView(hidden, false, themeId)).toBeNull();
		const withoutExcerpts = {
			...view,
			helpfulPatterns: { ready: true, themes: view.helpfulPatterns!.themes.map((theme) => ({
				...theme,
				evidence: theme.evidence.map((item) => ({ ...item, excerpt: null }))
			})) }
		};
		expect(getLighterDaysSummaryView(withoutExcerpts, false, themeId)).toBeNull();
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
		expect(getLighterDaysSummaryView(oldOnly, false, themeId)).toBeNull();
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
		expect(getLighterDaysSummaryView(comparison, false, themeId)).toBeNull();
		expect(render(LighterDaysCard, { props: { view: comparison } }).body).not.toContain('lighter-days-ai-button');
	});

	it('använder samma spärr för avkortat underlag i vyn och sammanfattningen', () => {
		const { body: full } = render(LighterDaysCard, { props: { view } });
		expect(full).toContain('Visa underlaget');
		expect(full).not.toContain('lighter-days-ai-button');
		const { body: limited } = render(LighterDaysCard, { props: { view, comparisonLimited: true } });
		expect(limited).not.toContain('lighter-days-ai-button');
		expect(limited).not.toContain('Visa underlaget');
		expect(getLighterDaysSummaryView(view, true, themeId)).toBeNull();
	});

	it('markerar samma högst tre användbara utdrag och hämtar inget från andra teman', () => {
		const theme = view.helpfulPatterns!.themes[0];
		const evidence = ['En promenad.', null, 'Jag gick en runda för att få frisk luft.',
			'Jag gick en runda för att få frisk luft.', 'Jag gick en längre sväng före middag.',
			'Jag valde den lugna vägen längs vattnet.', 'Jag tog en annan väg tillbaka till huset.']
			.map((excerpt, index) => ({ ...theme.evidence[0], entryId: 'e-' + index, excerpt }));
		const comparison = { ...view, helpfulPatterns: { ready: true, themes: [
			{ ...theme, evidence }, { ...theme, id: 'Natur', evidence: [{ ...evidence[2], excerpt: 'Jag satt vid ån och lyssnade.' }] }
		] } };
		const selected = getLighterDaysSummaryView(comparison, false, themeId)!;
		expect(selected.sources.map(({ evidenceIndex }) => evidenceIndex)).toEqual([2, 4, 5]);
		const payload = JSON.parse(buildLighterDaysSummaryRequest(selected.sources[1]).messages[0].content);
		expect(payload).toEqual({ excerpt: evidence[4].excerpt });
	});

	it('gömmer frågan när bara korta notiser finns', () => {
		const theme = view.helpfulPatterns!.themes[0];
		const thin = { ...view, helpfulPatterns: { ready: true, themes: [{
			...theme, evidence: theme.evidence.map((item) => ({ ...item, excerpt: 'Promenad före frukost.' }))
		}] } };
		expect(getLighterDaysSummaryView(thin, false, themeId)).toBeNull();
	});
});

const first = 'Jag valde att stanna kvar ett ögonblick.';
const selection = { span: 'stanna kvar ett ögonblick', kind: 'meaning' };
const selectedSource = { ...snapshot.sources[0], ref: 2, excerpt: first };

function parse(value: Record<string, unknown>, input = selectedSource) {
	return parseLighterDaysSummary(JSON.stringify(value), input);
}

describe('serverstyrd reflektionsfråga', () => {
	it('gör en öppen fråga från ett enda verifierat utdrag', () => {
		expect(parse({ selection })).toEqual({
			question: 'Vad betyder orden ”stanna kvar ett ögonblick” för dig när du läser dem nu?',
			sourceRef: 2,
			questionOrigin: 'ai',
			reason: null
		});
	});

	it.each([
		['Jag kände mig inte lugn när jag kom dit.', 'lugn när jag kom dit'],
		['Om jag får tid stannar jag en stund.', 'stannar jag en stund'],
		['Jag ville gå hem men valde att stanna.', 'valde att stanna']
	])('förankrar frågan i hela källan när ett klipp kan tappa förbehållet i %s', (excerpt, span) => {
		const result = parse({ selection: { span, kind: 'notice' } }, { ...selectedSource, excerpt });
		expect(result).toEqual({
			question: 'Vad lägger du märke till när du läser hela utdraget igen?',
			sourceRef: 2,
			questionOrigin: 'ai',
			reason: null
		});
		expect(result?.question).not.toContain(span);
	});

	it.each([
		{ ...selection, ref: 2 },
		{ ...selection, span: 'stannade kvar ett ögonblick' },
		{ ...selection, span: 'tanna kvar ett ögonblick' },
		{ ...selection, kind: 'egen fråga' },
		{ ...selection, question: 'Varför mår du bättre?' },
		[selection]
	])('avvisar ogiltigt källnummer, citat eller format (%#)', (invalid) => {
		expect(parse({ selection: invalid })).toBeNull();
	});

	it('ger bara en allmän fråga när modellen uttryckligen avstår', () => {
		expect(parse({ selection: null })).toEqual({
			question: 'Finns det något i det här utdraget som du vill stanna upp vid?',
			sourceRef: 2,
			questionOrigin: 'mittpsyke',
			reason: null
		});
		expect(parseLighterDaysSummary('{"selection":', selectedSource)).toBeNull();
		expect(parse({ observation: null })).toBeNull();
		expect(parse({ selection: null, perspectives: [] })).toBeNull();
	});

	it('går genom den gemensamma, injicerbara AI-tjänsten', async () => {
		const provider: AITextProvider = { generate: vi.fn().mockResolvedValue(JSON.stringify({ selection })) };
		const result = await generateAIText(buildLighterDaysSummaryRequest(selectedSource), provider);
		expect(provider.generate).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'diary-narrative' }));
		expect(parseLighterDaysSummary(result.text, selectedSource)?.sourceRef).toBe(2);
	});
});
