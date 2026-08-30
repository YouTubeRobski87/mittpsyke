import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

// Enbart halvårsblocket, inte hela analyssektionen.
const halfYearBlock = route.slice(
	route.indexOf('{#if selectedPeriod === 180 && halfYear}'),
	route.indexOf('{#if progressAnalysis.insights.length === 0}')
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

	it('visar högst fyra primära insikter, i den ordning servern rangordnat dem', () => {
		// Servern kapar listan till fyra; vyn lägger inte till egna kort.
		expect(route).toContain('{#each progressAnalysis.insights as item (item.id)}');
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
