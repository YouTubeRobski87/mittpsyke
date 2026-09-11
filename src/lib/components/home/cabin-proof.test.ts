import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import CabinProof from './CabinProof.svelte';

describe.each(['hero', 'section'] as const)('Kvällsincheckningens preview (%s)', (variant) => {
	it('märker exemplet före frågan och svarsalternativen', () => {
		const { body } = render(CabinProof, { props: { variant } });
		expect(body).toContain('Exempel');
		expect(body.indexOf('Exempel')).toBeLessThan(body.indexOf('Hur är det ikväll?'));
	});

	it('säger i bildtexten vad kortet är och var incheckningen görs', () => {
		const { body } = render(CabinProof, { props: { variant } });
		expect(body).toContain('Så ser kvällsincheckningen ut. Du gör den i Kvällsstugan.');
	});

	it('har inga interaktiva kontroller, ingen CTA och ingen knappliknande åtgärdsrad', () => {
		const { body } = render(CabinProof, { props: { variant } });
		expect(body).not.toMatch(/<(?:button|a|input|select|textarea)\b|tabindex=|role="(?:button|link)"/);
		// "Fortsätt" fanns som en falsk åtgärdsrad i kortets fot och läste som
		// knappen i den riktiga incheckningen. Den ska inte komma tillbaka.
		expect(body).not.toContain('Fortsätt');
		expect(body).not.toContain('cabin-proof-primary');
	});
});
