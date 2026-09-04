import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import CabinProof from './CabinProof.svelte';

describe.each(['hero', 'section'] as const)('Kvällsincheckningens preview (%s)', (variant) => {
	it('märker exemplet före frågan och svarsalternativen', () => {
		const { body } = render(CabinProof, { props: { variant } });
		expect(body).toContain('Exempel på kvällsincheckning');
		expect(body.indexOf('Exempel på kvällsincheckning')).toBeLessThan(body.indexOf('Hur är det ikväll?'));
		expect(body).toContain('Förhandsvisning – går inte att fylla i här.');
	});

	it('har inga interaktiva kontroller eller primär CTA och märker Fortsätt som exempel', () => {
		const { body } = render(CabinProof, { props: { variant } });
		expect(body).not.toMatch(/<(?:button|a|input|select|textarea)\b|tabindex=|role="(?:button|link)"/);
		expect(body).toMatch(/<span[^>]*class="cabin-proof-preview-action[^\"]*"[^>]*>Fortsätt · exempel<\/span>/);
		expect(body).not.toContain('cabin-proof-primary');
	});
});
