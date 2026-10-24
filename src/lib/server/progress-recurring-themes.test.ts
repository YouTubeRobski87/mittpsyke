// "Det som börjar synas i dina anteckningar": återkommande teman med datum och
// ordagranna utdrag. Testerna går genom den riktiga analysen med syntetiska
// anteckningar och kontrollerar beteendet: vad som visas, när, och att varje
// utdrag kommer från rätt anteckning.

import { describe, expect, it } from 'vitest';
import { buildProgressAnalysis, isoWeek, type ProgressAnalysisRow, type ProgressPeriodDays } from './progress-analysis';
import {
	MAX_RECURRING_THEMES,
	MAX_RECURRING_THEME_EVIDENCE,
	MIN_THEME_COUNT,
	MIN_THEME_WEEKS,
	RECURRING_THEME_THRESHOLD_COPY,
	RECURRING_THEME_TIMING_COPY,
	previewQuotes,
	recurringThemeCountCopy,
	recurringThemeEvidenceCopy,
	recurringThemePeriodCopy,
	withoutRecurringThemeInsight
} from '$lib/progress-recurring-themes';
import { findForbiddenProgressPhrase } from '$lib/progress-language';

const NOW = new Date('2026-08-15T12:00:00.000Z');

function entry(id: string, date: string, mood: number | null, text: string | null, tags: string[] = []): ProgressAnalysisRow {
	return { id, created_at: `${date}T10:00:00.000Z`, mood, text, tags };
}

/** Tre anteckningar om sömn, spridda över tre olika veckor. */
const SLEEP_ENTRIES: ProgressAnalysisRow[] = [
	entry('s1', '2026-07-21', 5, 'Har sovit dåligt i natt. Resten av dagen var okej.'),
	entry('s2', '2026-07-29', 6, 'Jag var trött hela förmiddagen.'),
	entry('s3', '2026-08-06', 6, 'Somnade tidigt för en gångs skull.')
];

/** Humörvärden utan text, jämnt fördelade, som ger en räknebar humörtrend. */
function moodOnly(start: string, values: number[], prefix = 'm'): ProgressAnalysisRow[] {
	const base = new Date(`${start}T10:00:00.000Z`);
	return values.map((mood, index) => {
		const date = new Date(base);
		date.setUTCDate(base.getUTCDate() + index);
		return entry(`${prefix}${index}`, date.toISOString().slice(0, 10), mood, null);
	});
}

describe('återkommande teman med underlag', () => {
	it('visar ett tema som klarar trösklarna, med antal, period och anteckningar', () => {
		const analysis = buildProgressAnalysis(SLEEP_ENTRIES, 30, NOW);
		const [sleep] = analysis.recurringThemes;

		expect(sleep).toMatchObject({
			id: 'Sömn',
			label: 'Sömn',
			count: 3,
			textEntryCount: 3,
			weekCount: 3,
			firstDate: '2026-07-21',
			lastDate: '2026-08-06'
		});
		expect(recurringThemeCountCopy(sleep)).toBe('Finns i 3 av 3 anteckningar med text, spritt över 3 veckor.');
		expect(recurringThemePeriodCopy(sleep)).toBe('Från 21 juli 2026 till 6 augusti 2026.');
		expect(recurringThemeEvidenceCopy(sleep)).toBe('Temat bygger på de här 3 anteckningarna.');
	});

	it('kan prioriteras före humörtrenden', () => {
		// Tydlig humörtrend i samma period som ett återkommande tema.
		const rows = [
			...moodOnly('2026-07-17', [3, 3, 4, 3, 3], 'a'),
			...moodOnly('2026-08-10', [8, 8, 7, 8, 8], 'b'),
			...SLEEP_ENTRIES
		];
		const analysis = buildProgressAnalysis(rows, 30, NOW);

		expect(analysis.recurringThemes.map((theme) => theme.label)).toEqual(['Sömn']);
		expect(analysis.trend.direction).not.toBe('insufficient');
		// Insikterna under temakortet börjar med humöret, och temat upprepas inte där.
		const below = withoutRecurringThemeInsight(analysis.insights, analysis.recurringThemes.length > 0);
		expect(below.some((item) => item.category === 'recurring')).toBe(false);
		expect(below[0]?.category).toBe('development');
		// Humörtrenden finns kvar oförändrad.
		expect(below.map((item) => item.id)).toContain('trend');
	});

	it('lämnar insikterna orörda när inget temakort visas', () => {
		const analysis = buildProgressAnalysis(SLEEP_ENTRIES, 30, NOW);
		expect(withoutRecurringThemeInsight(analysis.insights, false)).toEqual(analysis.insights);
	});

	it('visar högst tre teman även när fler klarar trösklarna', () => {
		const texts = [
			'Stress på jobbet och trött efter en promenad i skogen med en vän.',
			'Stressad på jobbet, trött, men en promenad i parken med vännen.',
			'Stress, jobbet igen, trött kväll och promenad med vänner i naturen.'
		];
		const rows = ['2026-07-21', '2026-07-29', '2026-08-06'].map((date, index) => entry(`t${index}`, date, 6, texts[index]));
		const analysis = buildProgressAnalysis(rows, 30, NOW);

		expect(analysis.themes.length).toBeGreaterThan(MAX_RECURRING_THEMES);
		expect(analysis.recurringThemes).toHaveLength(MAX_RECURRING_THEMES);
		// Samma ordning som analysens egen temalista.
		expect(analysis.recurringThemes.map((theme) => theme.label)).toEqual(
			analysis.themes.slice(0, MAX_RECURRING_THEMES).map((theme) => theme.label)
		);
	});

	it('visar inte ett tema med för få anteckningar', () => {
		const analysis = buildProgressAnalysis(SLEEP_ENTRIES.slice(0, MIN_THEME_COUNT - 1), 30, NOW);
		expect(analysis.recurringThemes).toEqual([]);
	});

	it('visar inte ett tema som bara finns under en enda vecka', () => {
		const sameWeek = [
			entry('w1', '2026-08-03', 5, 'Har sovit dåligt.'),
			entry('w2', '2026-08-04', 5, 'Trött igen.'),
			entry('w3', '2026-08-05', 5, 'Vaknade tidigt.'),
			entry('w4', '2026-08-06', 5, 'Somnade sent.')
		];
		expect(new Set(sameWeek.map((row) => isoWeek(row.created_at!.slice(0, 10)))).size).toBeLessThan(MIN_THEME_WEEKS);
		expect(buildProgressAnalysis(sameWeek, 30, NOW).recurringThemes).toEqual([]);
	});

	it('knyter datum och utdrag till exakt den anteckning temat kommer från', () => {
		const rows = [
			...SLEEP_ENTRIES,
			// Andra anteckningar i perioden som inte handlar om sömn.
			entry('x1', '2026-07-25', 7, 'En lugn dag med en bok.'),
			entry('x2', '2026-08-01', 4, 'Mycket att göra med räkningar och pengar.')
		];
		const [sleep] = buildProgressAnalysis(rows, 30, NOW).recurringThemes;
		const byId = new Map(rows.map((row) => [row.id, row]));

		// Senaste först, och bara de anteckningar som räknades in.
		expect(sleep.evidence.map((item) => item.entryId)).toEqual(['s3', 's2', 's1']);
		for (const item of sleep.evidence) {
			const source = byId.get(item.entryId!)!;
			expect(item.date).toBe(source.created_at!.slice(0, 10));
			// Ordagrant: utdraget är en del av just den anteckningens text.
			expect(source.text).toContain(item.excerpt!);
		}
		expect(sleep.evidence.find((item) => item.entryId === 's1')?.excerpt).toBe('Har sovit dåligt i natt.');
		expect(sleep.textEntryCount).toBe(5);
	});

	it('ger ordagranna utdrag även när texten innehåller HTML', () => {
		const html = '<img src=x onerror="alert(1)"> Har sovit dåligt igen <script>alert(2)</script>';
		const rows = [entry('h1', '2026-07-21', 5, html), ...SLEEP_ENTRIES.slice(1)];
		const [sleep] = buildProgressAnalysis(rows, 30, NOW).recurringThemes;
		const excerpt = sleep.evidence.find((item) => item.entryId === 'h1')?.excerpt;

		// Ingenting skrivs om eller tvättas till ny text: utdraget är originalet.
		// Att det aldrig körs som HTML kontrolleras där det renderas.
		expect(excerpt).toBe(html);
	});

	it('visar inte en mening med krisinnehåll som utdrag, men behåller datumet', () => {
		const rows = [entry('c1', '2026-07-21', 2, 'Sömnen är borta och jag orkar inte leva.'), ...SLEEP_ENTRIES.slice(1)];
		const [sleep] = buildProgressAnalysis(rows, 30, NOW).recurringThemes;
		const crisis = sleep.evidence.find((item) => item.entryId === 'c1');

		expect(crisis).toMatchObject({ date: '2026-07-21', excerpt: null });
		expect(previewQuotes(sleep).every((quote) => quote.entryId !== 'c1')).toBe(true);
	});

	it('kapar underlagslistan och säger hur många anteckningar som finns', () => {
		const rows = Array.from({ length: 12 }, (_, index) => {
			const date = new Date('2026-07-17T10:00:00.000Z');
			date.setUTCDate(date.getUTCDate() + index * 2);
			return entry(`n${index}`, date.toISOString().slice(0, 10), 5, `Har sovit dåligt, natt ${index}.`);
		});
		const [sleep] = buildProgressAnalysis(rows, 30, NOW).recurringThemes;

		expect(sleep.count).toBe(12);
		expect(sleep.evidence).toHaveLength(MAX_RECURRING_THEME_EVIDENCE);
		expect(recurringThemeEvidenceCopy(sleep)).toBe(`Visar de ${MAX_RECURRING_THEME_EVIDENCE} senaste av 12 anteckningar där temat finns med.`);
		expect(previewQuotes(sleep)).toHaveLength(2);
	});

	it('respekterar ett tema som användaren tagit bort, och använder användarens eget namn', () => {
		expect(buildProgressAnalysis(SLEEP_ENTRIES, 30, NOW, { themeOverrides: { Sömn: { hidden: true } } }).recurringThemes).toEqual([]);

		const [renamed] = buildProgressAnalysis(SLEEP_ENTRIES, 30, NOW, { themeOverrides: { Sömn: { label: 'Nätterna' } } }).recurringThemes;
		expect(renamed).toMatchObject({ id: 'Sömn', label: 'Nätterna', count: 3 });
		// Utdragen hittas fortfarande via temats egna ord.
		expect(renamed.evidence.find((item) => item.entryId === 's1')?.excerpt).toBe('Har sovit dåligt i natt.');
	});
});

describe('olika sorters underlag', () => {
	it('fungerar med enbart fritext, utan humörvärden', () => {
		const textOnly = SLEEP_ENTRIES.map((row) => ({ ...row, mood: null }));
		const analysis = buildProgressAnalysis(textOnly, 30, NOW);

		expect(analysis.moodSummary.entryCount).toBe(0);
		expect(analysis.recurringThemes.map((theme) => theme.label)).toEqual(['Sömn']);
		expect(analysis.recurringThemes[0].evidence).toHaveLength(3);
	});

	it('fungerar med enbart humörvärden, utan teman', () => {
		const analysis = buildProgressAnalysis(
			[...moodOnly('2026-07-17', [3, 3, 4, 3, 3], 'a'), ...moodOnly('2026-08-10', [8, 8, 7, 8, 8], 'b')],
			30,
			NOW
		);

		expect(analysis.recurringThemes).toEqual([]);
		expect(analysis.insights.map((item) => item.id)).toContain('trend');
	});

	it('ger tomt underlag utan teman eller insikter', () => {
		const analysis = buildProgressAnalysis([], 30, NOW);
		expect(analysis.recurringThemes).toEqual([]);
		expect(analysis.insights).toEqual([]);

		const thin = buildProgressAnalysis([entry('o1', '2026-08-10', null, '   '), entry('o2', '2026-08-11', null, null)], 30, NOW);
		expect(thin.recurringThemes).toEqual([]);
	});

	it.each<[ProgressPeriodDays, string[]]>([
		[30, ['s1', 's2', 's3']],
		[90, ['s1', 's2', 's3', 'old1']],
		[180, ['s1', 's2', 's3', 'old1', 'old2']]
	])('räknar bara anteckningar inom vald period (%i dagar)', (period, expectedIds) => {
		const rows = [
			entry('old2', '2026-03-10', 5, 'Sömnen var orolig.'),
			entry('old1', '2026-06-01', 5, 'Trött efter en lång natt.'),
			...SLEEP_ENTRIES
		];
		const [sleep] = buildProgressAnalysis(rows, period, NOW).recurringThemes;

		expect(sleep.evidence.map((item) => item.entryId).sort()).toEqual([...expectedIds].sort());
		expect(sleep.count).toBe(expectedIds.length);
	});
});

describe('förklaringen av när teman kan synas', () => {
	it('stämmer med analysens faktiska trösklar', () => {
		expect(RECURRING_THEME_THRESHOLD_COPY).toBe(
			`När ett tema återkommer i minst ${MIN_THEME_COUNT} anteckningar under minst ${MIN_THEME_WEEKS} olika veckor kan det börja synas här. Du behöver inte skriva varje dag.`
		);
		// Precis på gränsen: tre anteckningar under två veckor räcker.
		const exactly = [
			entry('e1', '2026-08-03', null, 'Har sovit dåligt.'),
			entry('e2', '2026-08-04', null, 'Trött.'),
			entry('e3', '2026-08-11', null, 'Vaknade tidigt.')
		];
		expect(new Set(exactly.map((row) => isoWeek(row.created_at!.slice(0, 10)))).size).toBe(MIN_THEME_WEEKS);
		expect(buildProgressAnalysis(exactly, 30, NOW).recurringThemes).toHaveLength(1);
	});

	it('är lugn, utan krav, diagnos eller orsak', () => {
		expect(findForbiddenProgressPhrase(RECURRING_THEME_THRESHOLD_COPY)).toBeNull();
		expect(RECURRING_THEME_THRESHOLD_COPY).not.toMatch(/skriv mer|måste|borde|fortsätt skriva/i);
	});

	it('Dagbokens variant säger samma trösklar och är lika lugn', () => {
		expect(RECURRING_THEME_TIMING_COPY).toBe(
			`Ett tema visas i Framsteg när det funnits i minst ${MIN_THEME_COUNT} anteckningar under minst ${MIN_THEME_WEEKS} olika veckor. Du behöver inte skriva varje dag.`
		);
		expect(findForbiddenProgressPhrase(RECURRING_THEME_TIMING_COPY)).toBeNull();
		expect(RECURRING_THEME_TIMING_COPY).not.toMatch(/skriv mer|måste|borde|fortsätt skriva/i);
	});
});
