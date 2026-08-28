import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Page from './+page.svelte';

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

/* Renderar den riktiga sidan i stället för att läsa dess källkod. Textmatchning
   mot +page.svelte kan vara grön medan dörren aldrig når DOM:en - de här testerna
   kan bara passera om markupen faktiskt produceras. */
describe('Verandadörren i renderad markup', () => {
	const pageData = (hasVeranda: boolean) => ({
		progressCompanion: null,
		companionDaily: null,
		interiorMemory: { hasBook: true, hasRug: true, hasBlanket: true, hasVeranda }
	});

	it('renderar ingen väg ut när hasVeranda är false', () => {
		const { body } = render(Page, { props: { data: pageData(false) } });
		expect(body).not.toContain('Gå ut på verandan');
		expect(body).not.toContain('scene-door-out');
	});

	it('renderar dörren som en knapp när hasVeranda är true', () => {
		const { body } = render(Page, { props: { data: pageData(true) } });
		expect(body).toContain('aria-label="Gå ut på verandan"');
		const door = body.slice(body.indexOf('scene-door-out') - 200, body.indexOf('scene-door-out') + 200);
		expect(door).toContain('<button');
		expect(door).toContain('type="button"');
	});

	it('startar alltid inne, med interiörlagret aktivt', () => {
		const { body } = render(Page, { props: { data: pageData(true) } });
		expect(body).toContain('data-view="interior"');
		// Returdörren finns inte förrän man faktiskt är ute.
		expect(body).not.toContain('Gå in i stugan');
	});

	it('behåller interiörminnet i markupen', () => {
		const { body } = render(Page, { props: { data: pageData(true) } });
		for (const asset of ['rug.png', 'blanket.png', 'boken.png']) {
			expect(body, asset).toContain(`/images/evening/interior/${asset}`);
		}
	});
});
