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

	it('visar kvällsscenen med personen och lägerelden, inte den tomma dagbilden', () => {
		const { body } = render(CabinProof, { props: { variant } });
		expect(body).toContain('progress-cabin-lakeside-evening-800.webp');
		expect(body).toContain('progress-cabin-lakeside-evening-1200.webp');
		expect(body).toContain('progress-cabin-lakeside-evening.webp 1672w');
		// Den tomma varianten saknar både människa och eld och får inte smyga
		// tillbaka in i heron.
		expect(body).not.toContain('progress-cabin-lakeside-800.webp');
	});

	it('ritar björnen som eget lager och beskriver hela scenen i alt-texten', () => {
		const { body } = render(CabinProof, { props: { variant } });
		expect(body).toMatch(/class="cabin-proof-bear[^"]*"/);
		expect(body).toContain('/images/avatars/presets/bear-sitting.png');
		// Lagret är dekor ovanpå scenen - bakgrundsbildens alt bär beskrivningen.
		expect(body).toMatch(/<img[^>]*class="cabin-proof-bear[^"]*"[^>]*alt=""/);
		expect(body).toContain('en person sitter vid en lägereld');
		expect(body).toContain('en björn vilar en bit bort');
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
