import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeDirectory = join(process.cwd(), 'src/routes/dashboard/kvallsstugan');
const route = readFileSync(join(routeDirectory, '+page.svelte'), 'utf8');
const sceneDirectory = join(process.cwd(), 'static/images/scenes');

const verandaAssets = [
	'cabin-veranda-evening-v1-800.webp',
	'cabin-veranda-evening-v1-1200.webp',
	'cabin-veranda-evening-v1.webp'
];

/** Klippet mellan `<button` och avslutande `>` för en hotspot med given klass. */
function buttonMarkup(className: string): string {
	const anchor = route.indexOf(`class="scene-door ${className}"`);
	expect(anchor, `hittade ingen hotspot med klassen ${className}`).toBeGreaterThan(-1);
	const start = route.lastIndexOf('<button', anchor);
	return route.slice(start, route.indexOf('</button>', anchor));
}

describe('Kvällsstugans veranda', () => {
	it('använder verandabilden i alla responsiva storlekar', () => {
		for (const asset of verandaAssets) {
			expect(existsSync(join(sceneDirectory, asset)), asset).toBe(true);
			expect(route).toContain(`/images/scenes/${asset}`);
		}
	});

	it('byter vy lokalt i stället för att lägga till en route', () => {
		expect(route).toContain("let sceneView = $state<SceneView>('interior')");
		expect(route).toContain("type SceneView = 'interior' | 'veranda'");
		expect(existsSync(join(routeDirectory, 'veranda'))).toBe(false);
	});

	it('låter hasVeranda styra åtkomsten, utan egen eligibility', () => {
		expect(route).toContain('const hasVeranda = $derived(interiorMemory.hasVeranda)');
		// Dörren renderas inte utan behörighet ...
		expect(route).toContain('{#if hasVeranda && !isVerandaView}');
		// ... och vybytet vägrar även om något annat skulle anropa det.
		expect(route).toContain("if (next === 'veranda' && !hasVeranda) return;");
		// Förlorad behörighet tar alltid användaren inomhus igen.
		expect(route).toContain("if (!hasVeranda && sceneView !== 'interior') sceneView = 'interior';");
	});

	it('har en dörr ut som är en riktig knapp med aria-label', () => {
		const doorOut = buttonMarkup('scene-door-out');
		expect(doorOut).toContain('type="button"');
		expect(doorOut).toContain('aria-label="Gå ut på verandan"');
		expect(doorOut).toContain("onclick={() => setSceneView('veranda')}");
	});

	it('har en returdörr som alltid tar användaren tillbaka in', () => {
		const doorIn = buttonMarkup('scene-door-in');
		expect(doorIn).toContain('type="button"');
		expect(doorIn).toContain('aria-label="Gå in i stugan"');
		expect(doorIn).toContain("onclick={() => setSceneView('interior')}");
		// Returdörren renderas så snart verandan visas.
		expect(route).toContain('{#if isVerandaView}');
	});

	it('ger båda hotspots en träffyta som håller på mobil', () => {
		const doorStyle = route.slice(route.indexOf('\t.scene-door {'));
		expect(doorStyle).toContain('min-width: 44px;');
		expect(doorStyle).toContain('min-height: 44px;');
		expect(doorStyle).toContain(':focus-visible');
	});

	it('korsfadar mjukt men hoppar direkt vid reduced motion', () => {
		expect(route).toContain('transition: opacity 300ms ease');
		const reduced = route.slice(route.indexOf('@media (prefers-reduced-motion: reduce)'));
		expect(reduced).toContain('.scene-layer.is-active { transition: none; }');
	});

	it('säger ingenting om upplåsning, belöning eller prestation', () => {
		const forbidden = [
			'upplåst',
			'upplåsning',
			'ny plats',
			'grattis',
			'belöning',
			'badge',
			'nivå',
			'poäng'
		];
		const lowered = route.toLowerCase();
		for (const word of forbidden) {
			expect(lowered.includes(word), `scenen får inte innehålla "${word}"`).toBe(false);
		}
	});

	it('rör inte interiörminnet', () => {
		for (const memory of ['interior-memory-book', 'interior-memory-rug', 'interior-memory-blanket']) {
			expect(route).toContain(memory);
		}
		expect(route).toContain('{#if hasInteriorBook}');
		expect(route).toContain('{#if hasInteriorRug}');
		expect(route).toContain('{#if hasInteriorBlanket}');
	});
});
