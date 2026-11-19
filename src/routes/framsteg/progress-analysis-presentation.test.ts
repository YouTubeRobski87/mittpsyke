import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PERIOD_OPTIONS } from '$lib/progress-recent-period';
import { getProgressLowDataCopy } from '$lib/progress-low-data-copy';

const route = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

// Enbart halvårsblocket, inte hela analyssektionen.
const halfYearBlock = route.slice(
	route.indexOf('{#if selectedPeriod === 180 && halfYear}'),
	route.indexOf('{#if moodInsights.length === 0 && showRecurringThemes}')
);
const analysisBlock = route.slice(
	route.indexOf('<section class="card reflection-card analysis-card"'),
	route.indexOf('{#if showSupportCard}')
);

const currentEmptyState = route.slice(
	route.indexOf('{:else if emptyProgress}'),
	route.indexOf('{:else if hasSensitiveDataConsent}', route.indexOf('{:else if emptyProgress}'))
);
const insightsPanel = route.slice(route.indexOf('id="progress-panel-insights"'), route.indexOf('id="progress-panel-place"'));
const lowDataWorldCopy = route.slice(
	route.indexOf('{#if showLowDataOverview}', route.indexOf('<div class="companion-copy">')),
	route.indexOf('{:else}', route.indexOf('{#if showLowDataOverview}', route.indexOf('<div class="companion-copy">')))
);

describe('Framstegs första blick', () => {
	it('gör kärnlöftet till sidans huvudrubrik', () => {
		expect(route).toContain(`<p class="auth-eyebrow">{isAnonymous ? 'Återblick' : 'Framsteg'}</p>`);
		expect(route).toContain('<h1>Din historia, i dina egna ord</h1>');
		expect(route).toContain(`<title>{isAnonymous ? 'Återblick' : 'Framsteg'} | MittPsyke</title>`);
	});

	it('samlar lågt underlag i en lugn modul och döljer tomma analyskort', () => {
		expect(route).toContain('data-testid="low-data-overview"');
		expect(route).toContain('{lowDataCopy.heading}');
		expect(route).toContain('{lowDataCopy.description}');
		expect(route).toContain('data-low-data-hidden={showLowDataOverview}');
		expect(route).toContain("[data-low-data-hidden='true']");
	});

	it('öppnar Min plats som standard och läser uttryckliga flikval från länken', () => {
		// Själva tolkningen av ?tab= och standardvärdet testas i progress-url.test.ts.
		expect(route).toContain('readProgressTab(page.url.searchParams)');
		expect(route).toContain('selectedTab ?? linkedTab ?? DEFAULT_PROGRESS_TAB');
	});

	it('skriver flik och period till adressen utan nya historikposter', () => {
		expect(route).toContain('progressHref(activeTab, selectedPeriod)');
		expect(route).toContain('goto(href, { replaceState: true, noScroll: true, keepFocus: true })');
		expect(route).toContain('<ProgressTabs active={activeTab} onSelect={selectTab} />');
		expect(route).toContain('readProgressPeriod(page.url.searchParams) ?? DEFAULT_PROGRESS_PERIOD');
	});

	it('visar tunt underlag under Mina insikter och scenen under Min plats', () => {
		expect(insightsPanel).toContain('data-testid="low-data-overview"');
		expect(insightsPanel).not.toContain('class="companion-banner"');
		expect(route.slice(route.indexOf('id="progress-panel-place"'), route.indexOf('id="progress-panel-mood"')))
			.toContain('class="companion-banner"');
	});

	it('använder kontinuitetsspråk i scenen vid tunt underlag', () => {
		expect(lowDataWorldCopy).toContain('Din plats finns kvar');
		expect(lowDataWorldCopy).toContain('ett lugnt lager runt det du sparar och reflekterar över');
		expect(lowDataWorldCopy).not.toMatch(/har vuxit|låst upp|belöning|prestation/i);
		expect(lowDataWorldCopy).not.toMatch(/har hittat|vi ser att|ditt mående har|beror på/i);
	});

	it('beskriver ett enda sparat inlägg utan att påstå att ett mönster finns', () => {
		const copy = getProgressLowDataCopy(1);

		expect(copy.heading).toBe('Din första text finns med');
		expect(copy.description).toContain(
			'Det är för tidigt att visa ett mönster, men texten finns med i underlaget här.'
		);
		expect(copy.description).not.toMatch(/har hittat|vi ser att|ditt mående har|beror på/i);
	});

	it('beskriver flera sparade texter med en saklig pluralvariant', () => {
		const copy = getProgressLowDataCopy(2);

		expect(copy.heading).toBe('Dina texter finns med');
		expect(copy.description).toContain(
			'Det är fortfarande för tidigt att visa ett mönster, men dina sparade texter finns med i underlaget här.'
		);
		expect(copy.description).not.toMatch(/har hittat|vi ser att|ditt mående har|beror på/i);
	});

	it('visar inga nollor eller påhittade observationer i lågdataläget', () => {
		const lowDataBlock = route.slice(
			route.indexOf('<section class="card low-data-overview"'),
			route.indexOf('</section>', route.indexOf('<section class="card low-data-overview"'))
		);

		expect(lowDataBlock).not.toMatch(/0 dagar|0 veckor/i);
		expect(lowDataBlock).not.toMatch(/har hittat|vi ser att|ditt mående har|beror på/i);
		for (const count of [0, 1, 2]) {
			const copy = getProgressLowDataCopy(count);
			expect(`${copy.heading} ${copy.description}`).not.toMatch(/0 dagar|0 veckor/i);
		}
	});

	it('visar ett enda lugnt nästa steg när ingen historik finns', () => {
		expect(currentEmptyState).toContain('Din utveckling börjar här');
		expect(currentEmptyState).toContain('det finns inget att hålla igång');
		expect(currentEmptyState).toContain('href="/dagbok/checkin"');
		expect(currentEmptyState).toContain('Skriv i dagboken');
		expect(currentEmptyState).not.toContain('RecentPeriodChart');
		expect(currentEmptyState).not.toContain('ConsentGate');
	});

	it('låter den anonyma, tydligt märkta förhandsvisningen vara kvar', () => {
		expect(route).toContain('{#if isAnonymous}');
		expect(route).toContain('<ProgressExamplePreview />');
		expect(route).toContain('<AccountTeaser variant="progress" />');
	});
});

describe('Framstegsanalysens presentation', () => {
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

	it('visar halvåret i ord, utan faktakort eller månadsrutnät', () => {
		// Robban 2026-11-19: "För mycket statistik". Siffrorna räknas fortfarande
		// fram, men halvåret visas som meningar.
		expect(halfYearBlock).toContain('halfYear.reflection.sentences');
		expect(halfYearBlock).not.toContain('halfYear.stats');
		expect(halfYearBlock).not.toContain('halfYear.months');
		expect(route).not.toContain('Månad för månad');
	});

	it('visar varken snitt eller antal när man väljer en punkt i grafen', () => {
		const detail = route.slice(route.indexOf('<section class="chart-detail"'), route.indexOf('</section>', route.indexOf('<section class="chart-detail"')));
		expect(detail).toContain('{selectedMoodPoint.fullLabel}');
		expect(detail).not.toContain('jämfört med genomsnittet');
		expect(detail).not.toContain('ligger bakom punkten');
	});

	it('visar högst fyra insikter, i den ordning servern rangordnat dem', () => {
		// Servern kapar listan till fyra; vyn lägger inte till egna kort.
		expect(route).toContain('const primaryInsight = $derived(moodInsights[0] ?? null);');
		expect(route).toContain('const remainingInsights = $derived(moodInsights.slice(1));');
		expect(halfYearBlock).not.toContain('analysis-tile');
	});

	it('konkretiserar underlaget bakom en enda "Vad bygger det här på?"', () => {
		expect(route).toContain('{analysisBasisOpen ? \'Dölj datagrunden\' : \'Vad bygger det här på?\'}');
		expect(route).toContain('<p class="analysis-basis">{halfYear.basis}</p>');
		// Varje observations uträkning ligger i samma utfällning, inte bakom egna knappar.
		expect(analysisBlock.match(/Vad bygger det här på\?/g)).toHaveLength(1);
		expect(analysisBlock).toContain('{#each moodInsights as item (item.id)}');
		expect(analysisBlock).toContain('<dd>{item.evidence}</dd>');
		// Snitt och median visas inte längre i datagrunden.
		expect(analysisBlock).not.toContain('medianen');
	});

	it('använder neutral reflektionstext utan prestations- eller diagnosspråk', () => {
		expect(halfYearBlock).not.toMatch(/förbättr|försämr|framgång|resultat|prestation|mål|du borde|diagnos/i);
	});
});

describe('periodens tydligaste insikt', () => {
	it('lyfter den första redan rankade insikten med en rubrik som inte värderar', () => {
		const primaryIndex = analysisBlock.indexOf('{#if primaryInsight}');

		expect(primaryIndex).toBeGreaterThan(-1);
		expect(analysisBlock).toContain('<h3 id="primary-insight-heading">Det som syns tydligast i perioden</h3>');
		// Systemet vet inte vad som är viktigast i någons liv.
		expect(route).not.toContain('Det viktigaste just nu');
		expect(analysisBlock).toContain('{primaryInsight.title}');
		expect(analysisBlock).toContain('{primaryInsight.description}');
	});

	it('visar inte samma förstainsikt igen i rutnätet', () => {
		expect(analysisBlock).toContain('{#each remainingInsights as item (item.id)}');
		expect(analysisBlock).not.toContain('{#each progressAnalysis.insights as item (item.id)}');
	});

	it('behåller serverns ordning för återstående insikter', () => {
		// slice(1) tar bara bort den redan visade förstainsikten; den sorterar inte om resten.
		expect(route).toContain('const remainingInsights = $derived(moodInsights.slice(1));');
		expect(analysisBlock).toContain('{#each remainingInsights as item (item.id)}');
	});

	it('saknar rubriken när analysen inte har någon kvalificerad insikt', () => {
		const emptyIndex = analysisBlock.indexOf('{:else if moodInsights.length === 0}');
		const primaryIndex = analysisBlock.indexOf('{#if primaryInsight}');

		expect(emptyIndex).toBeGreaterThan(primaryIndex);
		expect(analysisBlock).toContain('Inget tydligt mönster syns ännu i den här perioden.');
	});

	it('respekterar tunt underlag utan att skapa en egen insikt', () => {
		expect(analysisBlock).toContain('{#if progressAnalysis.coverage.truncated}');
		expect(analysisBlock).toContain('Analysen bygger på en begränsad del av periodens anteckningar.');
		expect(route).toContain('withoutRecurringThemeInsight(progressAnalysis?.insights ?? [], showRecurringThemes)');
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
		expect(route).toContain('const primaryInsight = $derived(moodInsights[0] ?? null);');
	});
});

// Underlagskortet "Vad det här bygger på" räknade upp registreringar, inlägg,
// dagar och veckor. Robban 2026-11-19: "För mycket statistik", så kortet är borta.
describe('underlagskortet', () => {
	it('finns inte längre under Min utveckling', () => {
		expect(route).not.toContain('garden-presence-card');
		expect(route).not.toContain('Vad det här bygger på');
		expect(route).not.toContain('historyActivity');
	});
});

// Överblicken högst upp ska svara på "hur har den senaste veckan sett ut?" utan
// AI, utan samtycke och utan periodval. Den ersätter inget - den gör bara den
// frågan möjlig att besvara, eftersom kortaste periodval är 30 dagar.
// Bara veckokortet. Temakortet med egna ord ligger direkt efter och har sin
// egen samtyckesgrind.
const weekBlock = route.slice(
	route.indexOf('<section class="card week-summary-card"'),
	route.indexOf('</section>', route.indexOf('<section class="card week-summary-card"'))
);

describe('veckoöverblicken', () => {
	it('ligger under Min utveckling, skilt från kurvan och analysen', () => {
		const development = route.slice(route.indexOf('id="progress-panel-development"'));
		expect(development).toContain('data-testid="week-summary"');
		expect(development).not.toContain('data-testid="mood-history"');
		expect(development).not.toContain('data-testid="mood-analysis"');
	});

	it('bygger texten i den testade modulen i stället för i markupen', () => {
		expect(route).toContain("import { buildWeekSummary } from '$lib/progress-week-summary';");
		expect(route).toContain('const weekSummary = $derived(buildWeekSummary(moodSamples));');
		expect(weekBlock).toContain('{weekSummary.summary}');
	});

	it('visas inte alls när underlaget är för litet', () => {
		expect(route).toContain('{#if !emptyProgress && !weekSummary.insufficient}');
	});

	it('visar jämförelsen bara när modulen lämnat en', () => {
		expect(weekBlock).toContain('{#if weekSummary.comparisonText}');
		expect(weekBlock).toContain('Veckan innan har för få registreringar för en jämförelse.');
	});

	it('ligger utanför samtyckesgrinden så den finns även utan AI', () => {
		expect(weekBlock).not.toContain('hasSensitiveDataConsent');
		expect(weekBlock).not.toContain('progressAnalysis');
		expect(weekBlock).not.toContain('insightsLoading');
	});

	it('färgkodar inte riktningen', () => {
		expect(weekBlock).not.toMatch(/class:is-(higher|lower|positive|negative)/);
		expect(weekBlock).not.toMatch(/data-direction=/);
	});

	it('är inte beroende av periodvalet', () => {
		expect(weekBlock).not.toContain('selectedPeriod');
	});
});

describe('Kanske värt att prova', () => {
	it('visar förslaget utan sifferrad', () => {
		const support = route.slice(route.indexOf('<ul class="support-suggestions">'), route.indexOf('</ul>', route.indexOf('<ul class="support-suggestions">')));
		expect(support).toContain('<strong>{suggestion.title}</strong>');
		expect(support).toContain('<span>{suggestion.body}</span>');
		expect(support).not.toContain('{suggestion.evidence}');
	});
});
