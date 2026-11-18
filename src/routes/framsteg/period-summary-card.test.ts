// "Det du har skrivit" i Mina insikter. Flödet provas i webbläsare i PR:en;
// här låses de regler som aldrig får glida: inget AI-anrop utan godkännande,
// inget gammalt resultat efter ändrat urval eller återkallat samtycke, och att
// de befintliga AI-funktionerna finns kvar.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
const card = read('src/lib/components/progress/PeriodSummaryCard.svelte');
const route = read('src/routes/framsteg/+page.svelte');
const insightsPanel = route.slice(route.indexOf('id="progress-panel-insights"'), route.indexOf('id="progress-panel-place"'));

describe('kortet Det du har skrivit', () => {
	it('har rubrik, ingress och knapp', () => {
		expect(card).toContain('<h2 id="period-summary-heading">Det du har skrivit</h2>');
		expect(card).toContain('En sammanhängande text om allt du har skrivit i dagboken');
		expect(card).toContain("'Sammanfatta mina anteckningar'");
	});

	it('ligger överst i Mina insikter för inloggade med anteckningar och gäller hela dagboken', () => {
		expect(insightsPanel.indexOf('<PeriodSummaryCard')).toBeGreaterThan(-1);
		expect(insightsPanel.indexOf('<PeriodSummaryCard')).toBeLessThan(insightsPanel.indexOf('<LighterDaysCard'));
		expect(insightsPanel).toContain('{#if !isAnonymous && !emptyProgress}');
		expect(insightsPanel).toContain('<PeriodSummaryCard />');
		expect(card).not.toContain('period=');
	});

	it('anropar AI bara efter granskat och godkänt urval', () => {
		const generate = card.slice(card.indexOf('async function generate()'), card.indexOf('async function saveHealthConsent'));
		expect(generate).toContain('if (request || !preview || !confirmed || includedEntries.length < MIN_PERIOD_SUMMARY_ENTRIES) return;');
		expect(generate).toContain("method: 'POST'");
		expect(generate).toContain('snapshotId: preview.snapshotId, confirmed: true, omit: omitted');
		// Förhandsvisningen är ett GET utan body och kan aldrig nå AI.
		const loadPreview = card.slice(card.indexOf('async function loadPreview()'), card.indexOf('async function generate()'));
		expect(loadPreview).not.toContain("method: 'POST'");
		expect(card).toContain("disabled={!confirmed || step === 'generate' || includedEntries.length < MIN_PERIOD_SUMMARY_ENTRIES}");
		// Ett ändrat urval kräver ett nytt godkännande.
		const toggle = card.slice(card.indexOf('function toggleEntry'), card.indexOf('function hideSummary'));
		expect(toggle).toContain('confirmed = false;');
	});

	it('visar exakt det som skickas innan godkännandet', () => {
		expect(card).toContain('Det här skickas till OpenAI');
		expect(card).toContain("{@render entryList(preview.entries, 'period-summary-review-heading', true)}");
		expect(card).toContain('<p class="period-summary-entry-text">{entry.text}</p>');
	});

	it('tömmer allt vid ändrat urval och återkallat samtycke', () => {
		expect(card).toMatch(/response\.status === 409\) \{\s*\/\/[^\n]*\n\s*reset\(\);/);
		expect(card).toContain('clearForHealthConsent();');
		expect(card).toContain("if (event === 'SIGNED_OUT') reset();");
		const reset = card.slice(card.indexOf('function reset()'), card.indexOf('function clearForHealthConsent'));
		for (const field of ['preview = null', 'result = null', 'confirmed = false', 'omitted = []']) expect(reset).toContain(field);
	});

	it('sparar aldrig resultatet', () => {
		expect(card).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
		expect(card).toContain('Texten sparas inte.');
	});

	it('visar löptext med hänvisningar som länkar till originalanteckningen', () => {
		expect(card).toContain('{#each result.paragraphs as paragraph');
		expect(card).toContain('{@render sourceLinks(segment.sources)}');
		expect(card).toContain('diaryEntryHref(source.entryId)');
		// Resultatet visar inga siffror eller listor av teman.
		expect(card).not.toContain('result.themes');
	});
});

describe('avgränsning', () => {
	it('behåller de befintliga AI-funktionerna och statistiken', () => {
		expect(insightsPanel).toContain('<LighterDaysCard');
		expect(insightsPanel).toContain('<RecurringThemesCard');
		expect(route).toContain('<PersonalRetrospect period={selectedPeriod} />');
		expect(route).toContain('id="progress-panel-mood"');
	});
});
