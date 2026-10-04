import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { getToolBySlug } from '$lib/data/seo-architecture';
import WorldColoringExercise, {
	blankColor,
	createCreativeMomentSession,
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

	it('renderar tre motiv, färgval och bevarade tillgänglighetsattribut', () => {
		const { body } = render(WorldColoringExercise);

		expect(body).toContain('Du behöver inte göra det fint, färdigt eller perfekt.');
		expect(body).toContain('Välj motiv');
		expect(body).toContain('Blomman');
		expect(body).toContain('Kvällstugan');
		expect(body).toContain('Lövet');
		expect(body).toContain('role="group"');
		expect(body).toContain('aria-live="polite"');
		expect(body.match(/aria-pressed=/g)).toHaveLength(8);
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
		state = paintColoringPart(state, 'leaf', 'upperLeft', '#e9c979');

		expect(state.fills.flower.petalTop).toBe('#8db7c7');
		expect(state.fills.cabin.roof).toBe('#91ad86');
		expect(state.fills.leaf.upperLeft).toBe('#e9c979');
		expect(state.fills.flower.petalRight).toBe(blankColor);
		expect(state.fills.leaf.upperRight).toBe(blankColor);
		expect(state.history.flower).toHaveLength(1);
		expect(state.history.cabin).toHaveLength(1);
		expect(state.history.leaf).toHaveLength(1);
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

	it('ger Lövet stora klick- och tangentbordsstyrda delar med lugn inramning', () => {
		const leafSource = componentSource
			.split('<!-- Leaf motif -->')[1]
			.split('<!-- End leaf motif -->')[0];

		expect(componentSource).toContain("{#if selectedMotif === 'leaf'}");
		expect(componentSource).toContain('Ta ett lugnt andetag innan du börjar.');
		expect(componentSource).toContain('Lägg märke till färgen du väljer.');
		expect(leafSource).toContain('Ett stort löv att färglägga');
		expect(leafSource.match(/class="paintable"/g)).toHaveLength(6);
		expect(leafSource.match(/role="button"/g)).toHaveLength(6);
		expect(leafSource.match(/tabindex="0"/g)).toHaveLength(6);
		expect(leafSource.match(/onclick=\{\(\) => paintPart/g)).toHaveLength(6);
		expect(leafSource.match(/onkeydown=\{\(event\) => handlePartKeydown/g)).toHaveLength(6);
	});

	it('ångrar och återställer Lövet utan att påverka de andra motiven', () => {
		let state = createColoringState();
		state = paintColoringPart(state, 'flower', 'center', '#8db7c7');
		state = paintColoringPart(state, 'cabin', 'moon', '#91ad86');
		state = paintColoringPart(state, 'leaf', 'upperLeft', '#e9c979');
		state = paintColoringPart(state, 'leaf', 'lowerRight', '#d99a7c');
		state = undoColoringPart(state, 'leaf');

		expect(state.fills.leaf.upperLeft).toBe('#e9c979');
		expect(state.fills.leaf.lowerRight).toBe(blankColor);
		expect(state.history.leaf).toHaveLength(1);

		state = resetColoringMotif(state, 'leaf');
		expect(state.fills.leaf.upperLeft).toBe(blankColor);
		expect(state.history.leaf).toHaveLength(0);
		expect(state.fills.flower.center).toBe('#8db7c7');
		expect(state.fills.cabin.moon).toBe('#91ad86');
	});

	it('integreras bara på den nya övningssidan', () => {
		expect(routeSource).toContain("data.tool.slug === 'mala-i-varlden'");
		expect(routeSource).toContain('<WorldColoringExercise onCreativeMoment={registerWorldColoringMoment} />');
	});

	it('registrerar bara den första faktiska färgläggningen i komponentens session', () => {
		const session = createCreativeMomentSession();

		expect(session.registerColoringChange(false)).toBe(false);
		expect(session.registerColoringChange(true)).toBe(true);
		expect(session.registerColoringChange(true)).toBe(false);
		expect(session.registerColoringChange(false)).toBe(false);
	});

	it('låter motivbyte, ångra och återställ vara separata från registreringen', () => {
		for (const functionName of ['selectMotif', 'undoLatest', 'resetDrawing']) {
			const start = componentSource.indexOf(`function ${functionName}`);
			const end = componentSource.indexOf('\n\t}', start) + 3;
			expect(componentSource.slice(start, end)).not.toContain('onCreativeMoment');
			expect(componentSource.slice(start, end)).not.toContain('registerColoringChange');
		}

		const paintPart = componentSource.slice(
			componentSource.indexOf('function paintPart'),
			componentSource.indexOf('function handlePartKeydown')
		);
		expect(paintPart).toContain('nextState !== coloringState');
		expect(paintPart).toContain('if (shouldRecord) void onCreativeMoment?.();');
	});
});
