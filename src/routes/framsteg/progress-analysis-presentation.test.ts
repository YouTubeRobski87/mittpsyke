import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PERIOD_OPTIONS } from '$lib/progress-recent-period';

const route = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

// Enbart halvårsblocket, inte hela analyssektionen.
const halfYearBlock = route.slice(
	route.indexOf('{#if selectedPeriod === 180 && halfYear}'),
	route.indexOf('{#if progressAnalysis.insights.length === 0}')
);
const analysisBlock = route.slice(
	route.indexOf('<section class="card reflection-card analysis-card"'),
	route.indexOf('{#if showSupportCard}')
);

describe('Framstegsanalysens presentation', () => {
	it('beskriver en månad utan mående som saknat måendeunderlag, inte som avsaknad av aktivitet', () => {
		expect(route).toContain('<span>Inget mående registrerat</span>');
		expect(route).not.toContain('<span>Ingen registrering</span>');
	});

	it('visar en tydlig täckningsnotis när analysen har truncerats', () => {
		expect(route).toContain('{#if progressAnalysis.coverage.truncated}');
		expect(route).toContain('Analysen bygger på en begränsad del av periodens anteckningar.');
	});
});

describe('halvårsvyns informationshierarki', () => {
	it('inleder med en reflektion från den deterministiska modulen', () => {
		expect(route).toContain("import { buildHalfYearView } from '$lib/progress-half-year'");
		expect(halfYearBlock).toContain('<h3 id="half-year-summary-heading">Ditt senaste halvår</h3>');
		expect(halfYearBlock).toContain('{#each halfYear.reflection.sentences as sentence}');
		expect(halfYearBlock).toContain('<p>{sentence}</p>');
		expect(halfYearBlock).not.toContain('{halfYear.summary}');
	});

	it('visar högst tre valfria observationer först när det finns tydliga sådana', () => {
		expect(halfYearBlock).toContain('{#if halfYear.reflection.highlights.length > 0}');
		expect(halfYearBlock).toContain('<h4 id="half-year-highlights-heading">Det som sticker ut</h4>');
		expect(halfYearBlock).toContain('{#each halfYear.reflection.highlights as highlight}');
	});

	it('visar nyckeltalen före månadsdetaljen', () => {
		const reflectionIndex = halfYearBlock.indexOf('halfYear.reflection.sentences');
		const statsIndex = halfYearBlock.indexOf('halfYear.stats');
		const monthsIndex = halfYearBlock.indexOf('halfYear.months');

		expect(reflectionIndex).toBeGreaterThan(-1);
		expect(statsIndex).toBeGreaterThan(-1);
		expect(statsIndex).toBeGreaterThan(reflectionIndex);
		expect(monthsIndex).toBeGreaterThan(statsIndex);
	});

	it('gör månadskorten jämförbara med snitt, antal, status och läge mot eget snitt', () => {
		expect(halfYearBlock).toContain('{month.shortLabel}');
		expect(halfYearBlock).toContain('Snitt {month.mean.toFixed(1)');
		expect(halfYearBlock).toContain("{month.entryCount === 1 ? 'registrering' : 'registreringar'}");
		expect(halfYearBlock).toContain('{month.relativeText}');
		expect(halfYearBlock).toContain('Tunt underlag');
	});

	it('visar högst fyra insikter, i den ordning servern rangordnat dem', () => {
		// Servern kapar listan till fyra; vyn lägger inte till egna kort.
		expect(route).toContain('const primaryInsight = $derived(progressAnalysis?.insights[0] ?? null);');
		expect(route).toContain('const remainingInsights = $derived(progressAnalysis?.insights.slice(1) ?? []);');
		expect(halfYearBlock).not.toContain('analysis-tile');
	});

	it('konkretiserar underlaget bakom "Vad bygger det här på?"', () => {
		expect(route).toContain('{analysisBasisOpen ? \'Dölj datagrunden\' : \'Vad bygger det här på?\'}');
		expect(route).toContain('<p class="analysis-basis">{halfYear.basis}</p>');
	});

	it('färgkodar inte månadernas läge som bra eller dåligt', () => {
		const relativeStyle = route.slice(route.indexOf('.monthly-analysis-list .month-relative'));

		expect(relativeStyle.slice(0, 120)).not.toMatch(/red|green|--destructive|--success/i);
	});

	it('använder neutral reflektionstext utan prestations- eller diagnosspråk', () => {
		expect(halfYearBlock).not.toMatch(/förbättr|försämr|framgång|resultat|prestation|mål|du borde|diagnos/i);
	});
});

describe('periodens viktigaste insikt', () => {
	it('lyfter den första redan rankade insikten med en tydlig arbetsrubrik', () => {
		const primaryIndex = analysisBlock.indexOf('{#if primaryInsight}');

		expect(primaryIndex).toBeGreaterThan(-1);
		expect(analysisBlock).toContain('<h3 id="primary-insight-heading">Det viktigaste just nu</h3>');
		expect(analysisBlock).toContain('{primaryInsight.title}');
		expect(analysisBlock).toContain('{primaryInsight.description}');
	});

	it('visar inte samma förstainsikt igen i rutnätet', () => {
		expect(analysisBlock).toContain('{#each remainingInsights as item (item.id)}');
		expect(analysisBlock).not.toContain('{#each progressAnalysis.insights as item (item.id)}');
	});

	it('behåller serverns ordning för återstående insikter', () => {
		// slice(1) tar bara bort den redan visade förstainsikten; den sorterar inte om resten.
		expect(route).toContain('const remainingInsights = $derived(progressAnalysis?.insights.slice(1) ?? []);');
		expect(analysisBlock).toContain('{#each remainingInsights as item (item.id)}');
	});

	it('saknar rubriken när analysen inte har någon kvalificerad insikt', () => {
		const emptyIndex = analysisBlock.indexOf('{#if progressAnalysis.insights.length === 0}');
		const primaryIndex = analysisBlock.indexOf('{#if primaryInsight}');

		expect(emptyIndex).toBeGreaterThan(primaryIndex);
		expect(analysisBlock).toContain('Inget tydligt mönster syns ännu i den här perioden.');
	});

	it('respekterar tunt underlag utan att skapa en egen insikt', () => {
		expect(analysisBlock).toContain('{#if progressAnalysis.coverage.truncated}');
		expect(analysisBlock).toContain('Analysen bygger på en begränsad del av periodens anteckningar.');
		expect(route).toContain('progressAnalysis?.insights[0] ?? null');
	});

	it('visar inte rubriken före samtyckesgrinden eller vid API-fel', () => {
		const consentIndex = analysisBlock.indexOf('{#if !isAnonymous && !hasSensitiveDataConsent}');
		const errorIndex = analysisBlock.indexOf('{:else if insightsError}');
		const analysisIndex = analysisBlock.indexOf('{:else if progressAnalysis}');

		expect(consentIndex).toBeGreaterThan(-1);
		expect(errorIndex).toBeGreaterThan(consentIndex);
		expect(analysisIndex).toBeGreaterThan(errorIndex);
		expect(analysisBlock.indexOf('{#if primaryInsight}')).toBeGreaterThan(analysisIndex);
	});

	it.each([30, 90, 180])('använder samma presentationsväg för %i dagar', (period) => {
		expect(PERIOD_OPTIONS.map((option) => option.value)).toContain(period);
		expect(route).toContain('const primaryInsight = $derived(progressAnalysis?.insights[0] ?? null);');
	});
});
