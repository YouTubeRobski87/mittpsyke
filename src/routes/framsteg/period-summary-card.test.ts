// "Din period i ord" i Mina insikter. Flödet provas i webbläsare i PR:en;
// här låses de regler som aldrig får glida: inget AI-anrop utan godkännande,
// inget gammalt resultat efter periodbyte eller ändrat urval, och att de
// befintliga AI-funktionerna finns kvar i det här steget.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
const card = read('src/lib/components/progress/PeriodSummaryCard.svelte');
const route = read('src/routes/framsteg/+page.svelte');
const insightsPanel = route.slice(route.indexOf('id="progress-panel-insights"'), route.indexOf('id="progress-panel-place"'));

describe('kortet Din period i ord', () => {
	it('har specens rubrik, ingress och knapp', () => {
		expect(card).toContain('<h2 id="period-summary-heading">Din period i ord</h2>');
		expect(card).toContain('Se vad som återkommer i dina anteckningar, vilka skillnader du själv beskrivit och vilka stunder du vill');
		expect(card).toContain("'Sammanfatta mina anteckningar'");
	});

	it('ligger överst i Mina insikter för inloggade med anteckningar och monteras om vid periodbyte', () => {
		expect(insightsPanel.indexOf('<PeriodSummaryCard')).toBeGreaterThan(-1);
		expect(insightsPanel.indexOf('<PeriodSummaryCard')).toBeLessThan(insightsPanel.indexOf('<LighterDaysCard'));
		expect(insightsPanel).toContain('{#if !isAnonymous && !emptyProgress && isPeriodSummaryPeriod(selectedPeriod)}');
		expect(insightsPanel).toMatch(/\{#key selectedPeriod\}\s*<PeriodSummaryCard period=\{selectedPeriod\} \/>/);
	});

	it('anropar AI bara efter granskat och godkänt urval', () => {
		const generate = card.slice(card.indexOf('async function generate()'), card.indexOf('async function saveHealthConsent'));
		expect(generate).toContain('if (request || !preview || !confirmed) return;');
		expect(generate).toContain("method: 'POST'");
		expect(generate).toContain('snapshotId: preview.snapshotId, confirmed: true');
		// Förhandsvisningen är ett GET utan body och kan aldrig nå AI.
		const loadPreview = card.slice(card.indexOf('async function loadPreview()'), card.indexOf('async function generate()'));
		expect(loadPreview).not.toContain("method: 'POST'");
		expect(card).toContain('disabled={!confirmed || step === \'generate\'}');
	});

	it('visar exakt det som skickas innan godkännandet', () => {
		expect(card).toContain('Det här skickas till OpenAI');
		expect(card).toContain('{@render entryList(preview.entries, \'period-summary-review-heading\')}');
		expect(card).toContain('<p class="period-summary-entry-text">{entry.text}</p>');
	});

	it('tömmer allt vid ändrat urval och återkallat samtycke', () => {
		expect(card).toMatch(/response\.status === 409\) \{\s*\/\/[^\n]*\n\s*reset\(\);/);
		expect(card).toContain('clearForHealthConsent();');
		expect(card).toContain("if (event === 'SIGNED_OUT') reset();");
		const reset = card.slice(card.indexOf('function reset()'), card.indexOf('function clearForHealthConsent'));
		for (const field of ['preview = null', 'result = null', 'confirmed = false']) expect(reset).toContain(field);
	});

	it('sparar aldrig resultatet', () => {
		expect(card).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
		expect(card).toContain('Sammanfattningen');
		expect(card).toContain('sparas inte');
	});

	it('länkar varje del till originalanteckningen', () => {
		expect(card).toContain('diaryEntryHref(source.entryId)');
		expect(card).toContain('{@render sourceLinks(theme.sources)}');
		expect(card).toContain('{@render sourceLinks(change.sources)}');
		expect(card).toContain('{@render sourceLinks([moment.source])}');
	});
});

describe('avgränsning i det här steget', () => {
	it('behåller de befintliga AI-funktionerna och statistiken', () => {
		expect(insightsPanel).toContain('<LighterDaysCard');
		expect(insightsPanel).toContain('<RecurringThemesCard');
		expect(route).toContain('<PersonalRetrospect period={selectedPeriod} />');
		expect(route).toContain('id="progress-panel-mood"');
	});
});
