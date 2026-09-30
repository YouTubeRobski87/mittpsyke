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

	it('behåller lugna men synliga höstintervall och storlekar', () => {
		expect(source).toContain('minGapMs: 8_000, maxGapMs: 15_000');
		expect(source).toContain('duration: [6_000, 12_000]');
		expect(source).toContain('between(8, 12)');
		expect(source).toContain('between(12, 18)');
		expect(source).toContain('between(18, 22)');
		expect(source).toContain('opacity: [0.72, 0.9]');
	});

	it('släpper högst tre löv per vindpust, en gång per pust', () => {
		expect(source).toContain('const count = Math.min(3, Math.max(1, Math.round(current.count)));');
		expect(source).toContain('if (!current || current.id === releasedGustId) return;');
		// Pusten går genom samma spawn som pulsen, så reduced motion och dold flik gäller även här.
		expect(source).toContain('if (!motion.isActive || motion.reducedMotion) return;');
	});
});
