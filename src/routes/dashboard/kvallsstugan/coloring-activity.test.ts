import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import WorldColoringExercise from '$lib/components/WorldColoringExercise.svelte';
import { SLEEP_SOURCES } from '$lib/evening-sleep-mode';

const routeDirectory = join(process.cwd(), 'src/routes/dashboard/kvallsstugan');
const route = readFileSync(join(routeDirectory, '+page.svelte'), 'utf8');
const panel = readFileSync(
	join(process.cwd(), 'src/lib/components/evening/SleepModePanel.svelte'),
	'utf8'
);
const sleepMode = readFileSync(join(process.cwd(), 'src/lib/evening-sleep-mode.ts'), 'utf8');

describe('Måla i världen i Kvällstugan', () => {
	it('visas som ett fjärde val i samma lugna aktivitetsyta', () => {
		expect(panel).toContain('aria-label="Välj en lugn aktivitet"');
		expect(panel).toContain('<span class="sleep-option-label">Måla i världen</span>');
		expect(panel).toContain("{#if option.id === 'silence' && onColoring}");
		expect(panel.indexOf('Måla i världen')).toBeLessThan(
			panel.indexOf('onclick={() => chooseSource(option.id)}', panel.indexOf("option.id === 'silence'"))
		);
	});

	it('öppnar den befintliga målkomponenten med rätt copy och alla tre motiv', () => {
		const { body } = render(WorldColoringExercise, { props: { showIntro: false } });

		expect(route).toContain("import WorldColoringExercise from '$lib/components/WorldColoringExercise.svelte'");
		expect(route).toContain('onColoring={openColoringActivity}');
		expect(route).toContain('isColoringActivity = true;');
		expect(route).toContain('<WorldColoringExercise');
		expect(route).toContain('showIntro={false}');
		expect(route).toContain('Måla i världen');
		expect(route).toContain('Måla i din egen takt. Du behöver inte göra färdigt.');
		expect(body).toContain('Blomman');
		expect(body).toContain('Kvällstugan');
		expect(body).toContain('Lövet');
	});

	it('går tillbaka till aktivitetsvalet och flyttar fokus mellan vyerna', () => {
		const closeColoring = route.slice(
			route.indexOf('function closeColoringActivity()'),
			route.indexOf('async function registerWorldColoringMoment()')
		);

		expect(route).toContain('Tillbaka till aktiviteter');
		expect(closeColoring).toContain('isColoringActivity = false;');
		expect(closeColoring).toContain("sleepStage = 'source';");
		expect(route).toContain('void tick().then(() => coloringHeading?.focus())');
		expect(panel).toContain('void tick().then(() => heading?.focus())');
	});

	it('behåller musik, meditation och tystnad som de enda sleep sources', () => {
		expect(SLEEP_SOURCES.map((source) => source.id)).toEqual(['music', 'meditation', 'silence']);
		expect(SLEEP_SOURCES.map((source) => source.label)).toEqual([
			'Lugn musik',
			'Meditation',
			'Tystnad'
		]);
		expect(sleepMode).toContain("export type SleepSourceId = 'music' | 'meditation' | 'silence';");
		expect(sleepMode).not.toMatch(/SleepSourceId[^;]*color/i);
		expect(panel).toContain('onclick={() => chooseSource(option.id)}');
		expect(panel).toContain('onclick={onColoring}');
	});

	it('återanvänder den befintliga creative_moments-kopplingen utan egen logik', () => {
		expect(route).toContain("import { recordCreativeMoment } from '$lib/creative-moments'");
		expect(route).toContain('onCreativeMoment={registerWorldColoringMoment}');
		expect(route).toContain('recordCreativeMoment(supabase, creativeMomentSessionId)');
		expect(route).not.toContain('creative_moments');
	});

	it('öppnar aktivitetsvalet när användaren kommer från Framsteg-länken', () => {
		expect(route).toContain('<div id="evening-activities">');
		expect(route).toContain("window.location.hash === '#evening-activities'");
		expect(route).toContain("sleepStage = 'source'");
	});
});
