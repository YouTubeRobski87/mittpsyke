import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { EMPTY_EVENING_INTERIOR_MEMORY } from '$lib/evening-interior-memory';

vi.mock('$lib/supabase', () => ({ supabase: { auth: { getSession: vi.fn() } } }));
const { default: Page } = await import('./+page.svelte');
const pageSource = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

describe('direkt in i Kvällstugan', () => {
	it('serverrenderar insidan och låter användaren själv öppna incheckningen', () => {
		const { body } = render(Page, { props: { data: {
			companionDaily: null,
			interiorMemory: EMPTY_EVENING_INTERIOR_MEMORY,
			hasEveningCheckinToday: false
		} } });
		expect(body).toContain('data-view="interior"');
		expect(body).toContain('cabin-interior-evening-resting-veranda-v1.webp');
		expect(body).toContain('href="/framsteg"');
		expect(body).toContain('Lämna Kvällstugan');
		expect(body).toContain('Starta kvällsincheckningen');
		expect(body).toContain('Vill inte svara');
		expect(body).toContain('Frågorna öppnas bara om du själv vill börja.');
		expect(body).not.toContain('Laddar kvällsincheckningen');
	});

	it('visar en tydlig scenkontroll som faktiskt lämnar Kvällstugan', () => {
		const sceneStart = pageSource.indexOf('<section class="evening-scene"');
		const exitStart = pageSource.indexOf('<a class="evening-exit"', sceneStart);
		const firstSceneLayer = pageSource.indexOf('<div class="scene-layer"', sceneStart);

		expect(exitStart).toBeGreaterThan(sceneStart);
		expect(exitStart).toBeLessThan(firstSceneLayer);
		expect(pageSource.slice(exitStart, firstSceneLayer)).toContain('href="/framsteg"');
		expect(pageSource.slice(exitStart, firstSceneLayer)).toContain('Lämna Kvällstugan');
		expect(pageSource).toMatch(/\.evening-exit\s*\{[\s\S]*?position: absolute;[\s\S]*?min-height: 44px;[\s\S]*?max-width: calc\(100% - 1\.1rem\);/);
	});

	it('låter användaren avstå lokalt utan sparning eller tracking', () => {
		const declineHandler = pageSource.slice(
			pageSource.indexOf('function declineEveningCheckin()'),
			pageSource.indexOf('function setSceneView')
		);

		expect(pageSource).toContain('onclick={declineEveningCheckin}');
		expect(pageSource).toContain('Du behöver inte svara. Du kan bara vara här en stund.');
		expect(declineHandler).toContain('checkinDeclined = true;');
		expect(declineHandler).not.toMatch(/fetch|supabase|localStorage|sessionStorage|track|analytics/i);
	});

	it('visar ett lugnt klart-läge efter en redan sparad incheckning samma kväll', () => {
		const { body } = render(Page, { props: { data: {
			companionDaily: null,
			interiorMemory: EMPTY_EVENING_INTERIOR_MEMORY,
			hasEveningCheckinToday: true
		} } });

		expect(body).toContain('Du har redan checkat in ikväll.');
		expect(body).toContain('Du kan stanna kvar i stugan utan att göra något mer.');
		expect(body).not.toContain('Starta kvällsincheckningen');
		expect(body).not.toContain('Vill inte svara');
		expect(body).not.toContain('Laddar kvällsincheckningen');
	});

	it('håller bilden och introduktionen tillsammans och lägger incheckningen under', () => {
		const introStart = pageSource.indexOf('class="evening-intro-layout"');
		const flowStart = pageSource.indexOf('class="evening-flow-column"');
		const introMarkup = pageSource.slice(introStart, flowStart);

		expect(introMarkup).toContain('class="evening-scene"');
		expect(introMarkup).toContain('class="evening-reassurance"');
		expect(introMarkup).toMatch(/class="evening-reassurance"[\s\S]*class="evening-intro-daily"[\s\S]*<CompanionDailyCard/);
		expect(flowStart).toBeGreaterThan(introStart);
		expect(pageSource).toContain('width: min(100%, 58rem);');
		expect(pageSource).toMatch(/\.evening-intro-daily\s*\{\s*grid-column: 1 \/ -1;/);
		expect(pageSource).toMatch(
			/\.evening-intro-layout\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1\.15fr\) minmax\(20rem, 0\.85fr\)/
		);
		const eveningExperienceRule = pageSource.match(/\.evening-experience\s*\{([^}]*)\}/)?.[1];
		expect(eveningExperienceRule).toBeDefined();
		expect(eveningExperienceRule).not.toContain('grid-template-columns:');
	});
});
