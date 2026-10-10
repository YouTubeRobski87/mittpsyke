import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./LeafLayer.svelte', import.meta.url), 'utf8');

describe('LeafLayer', () => {
	it('ritar tydliga höstlöv i stället för blurrade partiklar', () => {
		expect(source).toContain('<svg viewBox="0 0 32 32"');
		expect(source).toContain('class="leaf-body"');
		expect(source).toContain('class="leaf-vein"');
		expect(source).not.toContain('filter: blur');
	});

	it('behåller lugna men synliga höstlöv och storlekar', () => {
		expect(source).toContain('getFallingLeafVariation(sessionSeed, eventId, season)');
		expect(source).not.toContain('Math.random()');
	});

	it('släpper exakt ett löv per sällsynt vindpust, en gång per pust', () => {
		expect(source).toContain('untrack(() => spawnLeaf(current.id));');
		expect(source).toContain('if (!current || current.id === releasedGustId) return;');
		// Den gemensamma spawnen respekterar både reduced motion och dold flik.
		expect(source).toContain('canReleaseFallingLeaf({');
		expect(source).not.toContain('schedule(true)');
		expect(source).not.toMatch(/localStorage|sessionStorage/);
	});
});
