import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Min utveckling visar bara förändring över tid. Förslag och egen lista ligger i
// Mina insikter, och Kvällsstugans målning räknas inte i Framsteg.
const page = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const server = readFileSync(new URL('./+page.server.ts', import.meta.url), 'utf8');

function panel(id: string): string {
	const start = page.indexOf(`id="progress-panel-${id}"`);
	const next = page.indexOf('id="progress-panel-', start + 1);
	return page.slice(start, next === -1 ? undefined : next);
}

describe('Min utveckling', () => {
	const development = panel('development');

	it('innehåller bara veckan, kvällarna och begriplighetsfrågan', () => {
		expect(development).toContain('data-testid="week-summary"');
		expect(development).toContain('data-testid="evening-patterns"');
		expect(development).toContain('<FramstegComprehensionCard');
		expect(development).not.toContain('helpfulReminders()');
		expect(development).not.toContain('data-testid="support-suggestions"');
		expect(development).not.toContain('creative');
	});

	it('säger lugnt när det inte finns något att jämföra, utan krav', () => {
		expect(development).toContain('{#if emptyProgress || showLowDataOverview}');
		expect(development).toContain('data-testid="development-empty"');
		expect(development).toContain('Det finns inget du behöver hinna med.');
		expect(development).not.toMatch(/påminnelser och sparade stunder/);
	});
});

describe('Mina insikter', () => {
	const insights = panel('insights');

	it('samlar Kanske värt att prova och Det här vill jag komma ihåg under lättare dagar', () => {
		const lighter = insights.indexOf('<LighterDaysCard');
		const support = insights.indexOf('data-testid="support-suggestions"');
		const reminders = insights.indexOf('{@render helpfulReminders()}');
		expect(lighter).toBeGreaterThan(-1);
		expect(support).toBeGreaterThan(lighter);
		expect(reminders).toBeGreaterThan(support);
		expect(page.match(/\{@render helpfulReminders\(\)\}/g)).toHaveLength(1);
	});

	it('visar inte förslagen för gäster eller utan anteckningar', () => {
		expect(insights).toContain('{#if !isAnonymous && !emptyProgress && showSupportCard}');
	});
});

describe('Kreativa stunder', () => {
	it('visas inte längre i Framsteg och räknas inte av laddaren', () => {
		expect(page).not.toContain('Kreativa stunder');
		expect(page).not.toContain('creativeMoment');
		expect(server).not.toContain('creativeMoment');
		expect(server).not.toContain('loadCreativeMomentCount');
	});
});
