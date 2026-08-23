import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Samma kontraktsmönster som progressScene.test.ts: hero-scenen bor i routen,
// så markupen granskas som text i stället för att monteras.
const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');
const cabinLink = route.slice(
	route.indexOf('class="progress-cabin-link"'),
	route.indexOf('></a>', route.indexOf('class="progress-cabin-link"'))
);

describe('genvägen hem via stugan', () => {
	it('är en riktig länk till Mitt Hem, inte en JS-knapp', () => {
		expect(cabinLink).toContain('href="/dashboard"');
		// En vanlig <a> räcker: ingen onclick, ingen goto, inget tangentbordshack.
		expect(cabinLink).not.toMatch(/onclick|on:click|goto\(/);
		expect(route).toMatch(/<a\s+[^>]*class="progress-cabin-link"/s);
	});

	it('har ett tydligt accessible name', () => {
		expect(cabinLink).toContain('aria-label="Gå till Mitt Hem"');
	});

	it('bär ingen synlig textetikett ovanpå bilden', () => {
		// Elementet stängs direkt efter attributen; det finns inget barn att rendera.
		expect(route).toContain('data-testid="progress-cabin-link"\n\t\t\t\t\t></a>');
	});

	it('renderas bara när klickytan faktiskt är uppmätt', () => {
		expect(route).toContain('{#if cabinPlacement}');
	});

	it('positioneras ur scenens cover-geometri, inte ur fasta pixlar', () => {
		expect(route).toContain('getProgressCabinPlacement');
		expect(route).toContain('var(--progress-cabin-left, 0)');
		expect(route).toContain('var(--progress-cabin-top, 0)');
		expect(route).toContain('var(--progress-cabin-width, 0)');
		expect(route).toContain('var(--progress-cabin-height, 0)');
	});

	it('ligger under följeslagaren och scenens copy', () => {
		const rule = route.slice(route.indexOf('.progress-cabin-link {'));

		expect(rule.slice(0, rule.indexOf('}'))).toContain('z-index: var(--scene-midground)');
	});
});

describe('resten av hero-scenen är oförändrad', () => {
	it('gör inga andra scenlager klickbara', () => {
		// Dekorativa lager ska förbli dekorativa. Endast stuglänken och
		// spårlagrets knappar tar emot pekare i scenen.
		for (const layer of [
			'companion-ground-shadow',
			'companion-foreground-edge',
			'progress-ripple progress-ripple--one',
			'progress-ripple progress-ripple--two'
		]) {
			const index = route.indexOf(`class="${layer}"`);
			expect(index, layer).toBeGreaterThan(-1);
			expect(route.slice(index, index + 120), layer).toContain('aria-hidden="true"');
		}
		// Scenbilden är fortfarande dekorativ och utan egen länk.
		expect(route).toMatch(/class="companion-world-scene(?: [^"]*)?"[\s\S]{0,400}?aria-hidden="true"/);
	});

	it('lämnar följeslagaren dekorativ och på sin plats', () => {
		expect(route).toContain('class="progress-companion-pose"');
		expect(route).toContain('behaviourProfile="quiet"');
		expect(route).toContain('getProgressCompanionPlacementStyle');
	});

	it('lämnar hero-copyn orörd', () => {
		expect(route).toContain('<h2>Din plats idag</h2>');
		expect(route).toContain('{getProgressSceneLabel(sceneTransition.visibleBand)}');
	});

	it('har bara en länk till Mitt Hem i scenen', () => {
		const scene = route.slice(route.indexOf('class="companion-media"'), route.indexOf('class="framsteg-layout'));

		expect(scene.match(/href="\/dashboard"/g) ?? []).toHaveLength(1);
	});
});
