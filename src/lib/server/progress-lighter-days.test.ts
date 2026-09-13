import { describe, expect, it } from 'vitest';
import { buildLighterDaysView, extractThemeExcerpt, type LighterDaysRow } from './progress-lighter-days';
import { buildProgressAnalysis } from './progress-analysis';
import { findForbiddenProgressPhrase } from '$lib/progress-language';
import type { ProgressThemeOverrides } from '$lib/progress-theme-overrides';

// Juni 2026: måndag 1 juni inleder ISO-vecka 23, 8 juni vecka 24 osv.
const NOW = new Date('2026-06-30T12:00:00Z');

function entry(id: string, date: string, mood: number | null, text: string | null): LighterDaysRow {
	return { id, created_at: `${date}T10:00:00.000Z`, mood, text };
}

/** Sju vardagliga inlägg med lägre humör och inga teman. */
function baseline(prefix = 'b'): LighterDaysRow[] {
	return ['06-04', '06-05', '06-11', '06-12', '06-16', '06-17', '06-18'].map((day, index) =>
		entry(`${prefix}${index}`, `2026-${day}`, 4, 'Vanlig dag hemma.')
	);
}

describe('tröskeln: minst 3 förekomster under minst 2 veckor', () => {
	it('visar ett tema med 3 förekomster spridda över 2 veckor', () => {
		const rows = [
			entry('p1', '2026-06-02', 8, 'Tog en promenad i kvarteret.'),
			entry('p2', '2026-06-03', 8, 'Promenad före frukost.'),
			entry('p3', '2026-06-10', 8, 'En promenad till affären.'),
			...baseline()
		];
		const view = buildLighterDaysView(rows, 30, {}, NOW);

		expect(view.themes.map((theme) => theme.id)).toEqual(['Motion']);
		expect(view.themes[0]).toMatchObject({ count: 3, base: 3, weekCount: 2, otherCount: 0, otherBase: 7 });
	});

	it('döljer ett tema vars 3 förekomster ligger i samma vecka', () => {
		const rows = [
			entry('p1', '2026-06-02', 8, 'Tog en promenad i kvarteret.'),
			entry('p2', '2026-06-03', 8, 'Promenad före frukost.'),
			entry('p3', '2026-06-06', 8, 'En promenad till affären.'),
			...baseline()
		];

		expect(buildLighterDaysView(rows, 30, {}, NOW).themes).toEqual([]);
	});

	it('döljer ett tema med bara 2 förekomster, även över flera veckor', () => {
		const rows = [
			entry('p1', '2026-06-02', 8, 'Tog en promenad i kvarteret.'),
			entry('p2', '2026-06-10', 8, 'Promenad före frukost.'),
			entry('x1', '2026-06-20', 8, 'Vanlig dag hemma.'),
			...baseline()
		];

		expect(buildLighterDaysView(rows, 30, {}, NOW).themes).toEqual([]);
	});

	it('kräver samma veckospridning för teman i huvudanalysen', () => {
		const oneWeek = [
			entry('p1', '2026-06-02', 6, 'Promenad.'),
			entry('p2', '2026-06-03', 6, 'Promenad igen.'),
			entry('p3', '2026-06-04', 6, 'Ännu en promenad.')
		];
		const twoWeeks = [...oneWeek.slice(0, 2), entry('p3', '2026-06-12', 6, 'Ännu en promenad.')];

		expect(buildProgressAnalysis(oneWeek, 30, NOW).themes).toEqual([]);
		expect(buildProgressAnalysis(twoWeeks, 30, NOW).themes).toMatchObject([{ label: 'Motion', count: 3, weekCount: 2 }]);
	});
});

describe('låg säkerhet under 10 relevanta inlägg', () => {
	it('märker perioden med låg säkerhet vid 9 inlägg med text och humör', () => {
		const rows = [
			...baseline(),
			entry('p1', '2026-06-02', 8, 'Promenad.'),
			entry('p2', '2026-06-10', 8, 'Promenad.'),
			// Inlägg utan text eller utan humör räknas inte som relevanta.
			entry('n1', '2026-06-20', 7, null),
			entry('n2', '2026-06-21', null, 'Bara text.')
		];
		const view = buildLighterDaysView(rows, 30, {}, NOW);

		expect(view.relevantEntryCount).toBe(9);
		expect(view.lowConfidence).toBe(true);
		expect(buildProgressAnalysis(rows, 30, NOW)).toMatchObject({ relevantEntryCount: 9, lowConfidence: true });
	});

	it('släpper märkningen vid 10 relevanta inlägg', () => {
		const rows = [...baseline(), entry('p1', '2026-06-02', 8, 'A.'), entry('p2', '2026-06-10', 8, 'B.'), entry('p3', '2026-06-20', 8, 'C.')];

		expect(buildLighterDaysView(rows, 30, {}, NOW).lowConfidence).toBe(false);
		expect(buildProgressAnalysis(rows, 30, NOW).lowConfidence).toBe(false);
	});
});

describe('anteckningen räknas fram ur data, inte ur temats position', () => {
	const motion = [
		entry('m1', '2026-06-02', 8, 'Promenad i skogen.'),
		entry('m2', '2026-06-03', 8, 'Promenad i skogen igen.'),
		entry('m3', '2026-06-10', 8, 'Kort promenad.'),
		entry('m4', '2026-06-11', 8, 'Promenad på kvällen.')
	];

	it('innehåller tema, n, jämförelsebas och period', () => {
		const view = buildLighterDaysView([...motion, ...baseline()], 30, {}, NOW);
		const theme = view.themes.find((candidate) => candidate.id === 'Motion');

		expect(theme?.note).toBe('Motion fanns med i 4 av 4 inlägg med högre humör (30 dagar).');
		expect(theme?.comparison).toBe('I övriga inlägg: 0 av 7.');
	});

	it('ger samma anteckning oavsett i vilken ordning teman hamnar', () => {
		const first = buildLighterDaysView([...motion, ...baseline()], 30, {}, NOW);
		const reversed = buildLighterDaysView([...baseline(), ...[...motion].reverse()], 30, {}, NOW);
		const note = (view: typeof first, id: string) => view.themes.find((theme) => theme.id === id)?.note;

		for (const theme of first.themes) expect(note(reversed, theme.id)).toBe(theme.note);
		// Natur (skogen, 2 gånger) når inte tröskeln och får ingen egen anteckning.
		expect(first.themes.map((theme) => theme.id)).toEqual(['Motion']);
	});

	it('varje tema bär sina egna siffror', () => {
		const rows = [
			...motion,
			entry('s1', '2026-06-15', 8, 'Sjön var stilla.'),
			entry('s2', '2026-06-22', 8, 'Satt vid sjön.'),
			entry('s3', '2026-06-23', 8, 'Sjön igen.'),
			...baseline()
		];
		const view = buildLighterDaysView(rows, 30, {}, NOW);

		for (const theme of view.themes) {
			expect(theme.note).toBe(`${theme.label} fanns med i ${theme.count} av ${theme.base} inlägg med högre humör (30 dagar).`);
		}
		expect(new Set(view.themes.map((theme) => theme.note)).size).toBe(view.themes.length);
	});

	it('använder inga fasta standardtexter i Framstegs källkod', async () => {
		const { readFileSync } = await import('node:fs');
		const sources = [
			'src/lib/server/progress-lighter-days.ts',
			'src/lib/components/progress/LighterDaysCard.svelte',
			'src/routes/framsteg/+page.svelte'
		].map((path) => readFileSync(path, 'utf8'));
		for (const source of sources) {
			expect(source).not.toContain('HELPING_NOTES');
			expect(source).not.toContain('Förekommer oftare under dina ljusare dagar.');
			expect(source).not.toContain('Det som verkar hjälpa');
			expect(source).not.toMatch(/NOTES\[index\]/);
		}
	});
});

describe('underlaget kommer från riktiga källinlägg', () => {
	const rows = [
		entry('e1', '2026-06-02', 8, 'Det var en lång dag. Tog en promenad i kvarteret efteråt.'),
		entry('e2', '2026-06-03', 9, 'Promenad före frukost.'),
		entry('e3', '2026-06-10', 8, 'Jobbade hemifrån. En promenad till affären på eftermiddagen.'),
		...baseline()
	];

	it('visar datum, humör och ett ordagrant utdrag ur varje inlägg', () => {
		const theme = buildLighterDaysView(rows, 30, {}, NOW).themes[0];
		const byId = new Map(rows.map((row) => [row.id, row]));

		expect(theme.evidence.map((item) => item.entryId).sort()).toEqual(['e1', 'e2', 'e3']);
		for (const item of theme.evidence) {
			const source = byId.get(item.entryId ?? '');
			expect(source).toBeDefined();
			expect(source?.created_at?.slice(0, 10)).toBe(item.date);
			expect(item.mood).toBe(source?.mood);
			expect(item.excerpt).not.toBeNull();
			expect(source?.text).toContain(item.excerpt!.replace(/…/g, ''));
		}
		expect(theme.evidence.find((item) => item.entryId === 'e1')?.excerpt).toBe('Tog en promenad i kvarteret efteråt.');
	});

	it('kapar långa meningar utan att skriva om dem', () => {
		const text = `${'Ord '.repeat(60)}och sedan en promenad längs vattnet ${'mer '.repeat(40)}slut.`;
		const excerpt = extractThemeExcerpt(text, 'Motion');

		expect(excerpt).not.toBeNull();
		expect(excerpt!.length).toBeLessThanOrEqual(162);
		expect(excerpt).toContain('promenad');
		expect(text).toContain(excerpt!.replace(/^…|…$/g, ''));
	});

	it('ändrar inte originalinläggen', () => {
		const snapshot = JSON.stringify(rows);
		buildLighterDaysView(rows, 30, { Motion: { hidden: true } }, NOW);
		buildLighterDaysView(rows, 30, { Motion: { label: 'Promenader' } }, NOW);

		expect(JSON.stringify(rows)).toBe(snapshot);
	});
});

describe('korrigerade teman', () => {
	const rows = [
		entry('p1', '2026-06-02', 8, 'Promenad.'),
		entry('p2', '2026-06-03', 8, 'Promenad.'),
		entry('p3', '2026-06-10', 8, 'Promenad.'),
		...baseline()
	];

	it('använder användarens namn i anteckningen', () => {
		const overrides: ProgressThemeOverrides = { Motion: { label: 'Promenader' } };
		const theme = buildLighterDaysView(rows, 30, overrides, NOW).themes[0];

		expect(theme).toMatchObject({ id: 'Motion', label: 'Promenader', renamed: true });
		expect(theme.note).toBe('Promenader fanns med i 3 av 3 inlägg med högre humör (30 dagar).');
	});

	it('tar bort ett dolt tema ur återblicken men listar det för att kunna visas igen', () => {
		const overrides: ProgressThemeOverrides = { Motion: { hidden: true } };
		const view = buildLighterDaysView(rows, 30, overrides, NOW);

		expect(view.themes).toEqual([]);
		expect(view.hiddenThemes).toEqual([{ id: 'Motion', label: 'Motion' }]);
		expect(buildProgressAnalysis(rows, 30, NOW, { themeOverrides: overrides }).themes).toEqual([]);
	});
});

describe('språkregler för genererad text', () => {
	it('flaggar identitet, diagnos och orsak men släpper igenom observationer', () => {
		expect(findForbiddenProgressPhrase('Du är en person som mår bra av promenader.')?.kind).toBe('identity');
		expect(findForbiddenProgressPhrase('Det tyder på depression.')?.kind).toBe('diagnosis');
		expect(findForbiddenProgressPhrase('Promenaden ledde till bättre humör.')?.kind).toBe('causal');
		expect(findForbiddenProgressPhrase('Promenader hjälper dig att må bättre.')?.kind).toBe('causal');
		expect(findForbiddenProgressPhrase('Promenad fanns med i 4 av 6 inlägg med högre humör (30 dagar).')).toBeNull();
		expect(findForbiddenProgressPhrase('Det visar vad som fanns med, inte vad som orsakade något.')).toBeNull();
	});

	it('all genererad text i återblicken håller sig till samband', () => {
		const rows: LighterDaysRow[] = [];
		const texts = [
			'Stress på jobbet och trött efter en kort natt.',
			'En promenad i naturen, lugn stund med en vän.',
			'Tacksam för en fin kväll med barnen.',
			'Oro inför ekonomin och räkningarna.'
		];
		for (let day = 1; day <= 29; day += 1) {
			const text = texts[day % texts.length];
			rows.push(entry(`r${day}`, `2026-06-${String(day).padStart(2, '0')}`, day % 4 === 1 ? 8 : day % 4 === 3 ? 3 : 6, text));
		}
		const view = buildLighterDaysView(rows, 30, {}, NOW);
		const analysis = buildProgressAnalysis(rows, 30, NOW);
		const generated = [
			view.basis,
			...view.themes.flatMap((theme) => [theme.note, theme.comparison]),
			...analysis.insights.flatMap((insight) => [insight.title, insight.description, insight.evidence]),
			analysis.longPeriodSummary ?? ''
		];

		expect(view.themes.length).toBeGreaterThan(0);
		for (const text of generated) {
			expect(findForbiddenProgressPhrase(text), text).toBeNull();
		}
	});
});
