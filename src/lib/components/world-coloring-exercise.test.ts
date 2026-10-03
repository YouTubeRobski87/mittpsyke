import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { getToolBySlug } from '$lib/data/seo-architecture';
import WorldColoringExercise, {
	blankColor,
	createColoringState,
	paintColoringPart,
	resetColoringMotif,
	undoColoringPart
} from './WorldColoringExercise.svelte';

const routeSource = readFileSync(
	new URL('../../routes/ovningar/[tool]/+page.svelte', import.meta.url),
	'utf8'
);
const componentSource = readFileSync(new URL('./WorldColoringExercise.svelte', import.meta.url), 'utf8');

describe('Måla i världen', () => {
	it('finns i övningsdatan med lugna steg och reflektioner', () => {
		const tool = getToolBySlug('mala-i-varlden');

		expect(tool?.title).toBe('Måla i världen');
		expect(tool?.pillarSlug).toBe('stress-utmattning');
		expect(tool?.steps).toHaveLength(5);
		expect(tool?.reflections).toHaveLength(3);
	});

	it('renderar två motiv, färgval och bevarade tillgänglighetsattribut', () => {
		const { body } = render(WorldColoringExercise);

		expect(body).toContain('Du behöver inte göra det fint, färdigt eller perfekt.');
		expect(body).toContain('Välj motiv');
		expect(body).toContain('Blomman');
		expect(body).toContain('Kvällstugan');
		expect(body).toContain('role="group"');
		expect(body).toContain('aria-live="polite"');
		expect(body.match(/aria-pressed=/g)).toHaveLength(7);
		expect(body.match(/role="button"/g)).toHaveLength(8);
		expect(body).toMatch(/class="undo-button[^"]*"[^>]*disabled/);
		expect(body).toContain('Ångra senaste');
		expect(body).toContain('Återställ');
		expect(componentSource).toContain('@media (prefers-reduced-motion: reduce)');
	});

	it('behåller separat färgläggning och historik vid motivbyte', () => {
		let state = createColoringState();
		state = paintColoringPart(state, 'flower', 'petalTop', '#8db7c7');
		state = paintColoringPart(state, 'cabin', 'roof', '#91ad86');

		expect(state.fills.flower.petalTop).toBe('#8db7c7');
		expect(state.fills.cabin.roof).toBe('#91ad86');
		expect(state.fills.flower.petalRight).toBe(blankColor);
		expect(state.history.flower).toHaveLength(1);
		expect(state.history.cabin).toHaveLength(1);
		expect(componentSource).toContain('onclick={() => selectMotif(motif as MotifId)}');
		expect(componentSource).not.toContain('localStorage');
	});

	it('ångrar exakt senaste färgläggningen även efter flera färgbyten', () => {
		let state = createColoringState();
		state = paintColoringPart(state, 'cabin', 'roof', '#8db7c7');
		state = paintColoringPart(state, 'cabin', 'roof', '#d99a7c');
		state = undoColoringPart(state, 'cabin');

		expect(state.fills.cabin.roof).toBe('#8db7c7');
		expect(state.history.cabin).toHaveLength(1);

		state = undoColoringPart(state, 'cabin');
		expect(state.fills.cabin.roof).toBe(blankColor);
		expect(state.history.cabin).toHaveLength(0);

		const unchanged = undoColoringPart(state, 'cabin');
		expect(unchanged).toBe(state);
	});

	it('återställer bara aktuellt motiv och rensar dess undo-historik', () => {
		let state = createColoringState();
		state = paintColoringPart(state, 'flower', 'center', '#e9c979');
		state = paintColoringPart(state, 'cabin', 'moon', '#aa9bc2');
		state = resetColoringMotif(state, 'cabin');

		expect(state.fills.cabin.moon).toBe(blankColor);
		expect(state.history.cabin).toHaveLength(0);
		expect(state.fills.flower.center).toBe('#e9c979');
		expect(state.history.flower).toHaveLength(1);
	});

	it('ger Kvällstugan klick- och tangentbordsstyrda motivdelar', () => {
		const cabinSource = componentSource
			.split('<!-- Cabin motif -->')[1]
			.split('<!-- End cabin motif -->')[0];

		expect(cabinSource).toContain('Kvällstugan och månen att färglägga');
		expect(cabinSource.match(/class="paintable"/g)).toHaveLength(8);
		expect(cabinSource.match(/role="button"/g)).toHaveLength(8);
		expect(cabinSource.match(/tabindex="0"/g)).toHaveLength(8);
		expect(cabinSource.match(/onclick=\{\(\) => paintPart/g)).toHaveLength(8);
		expect(cabinSource.match(/onkeydown=\{\(event\) => handlePartKeydown/g)).toHaveLength(8);
	});

	it('integreras bara på den nya övningssidan', () => {
		expect(routeSource).toContain("data.tool.slug === 'mala-i-varlden'");
		expect(routeSource).toContain('<WorldColoringExercise />');
	});
});
