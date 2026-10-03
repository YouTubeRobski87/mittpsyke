import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { getToolBySlug } from '$lib/data/seo-architecture';
import WorldColoringExercise from './WorldColoringExercise.svelte';

const routeSource = readFileSync(
	new URL('../../routes/ovningar/[tool]/+page.svelte', import.meta.url),
	'utf8'
);

describe('Måla i världen', () => {
	it('finns i övningsdatan med lugna steg och reflektioner', () => {
		const tool = getToolBySlug('mala-i-varlden');

		expect(tool?.title).toBe('Måla i världen');
		expect(tool?.pillarSlug).toBe('stress-utmattning');
		expect(tool?.steps).toHaveLength(5);
		expect(tool?.reflections).toHaveLength(3);
	});

	it('renderar färgval, klickbara motivdelar och återställning', () => {
		const { body } = render(WorldColoringExercise);

		expect(body).toContain('Du behöver inte göra det fint, färdigt eller perfekt.');
		expect(body).toContain('role="group"');
		expect(body.match(/aria-pressed=/g)).toHaveLength(5);
		expect(body.match(/role="button"/g)).toHaveLength(8);
		expect(body).toContain('Återställ');
	});

	it('integreras bara på den nya övningssidan', () => {
		expect(routeSource).toContain("data.tool.slug === 'mala-i-varlden'");
		expect(routeSource).toContain('<WorldColoringExercise />');
	});
});
