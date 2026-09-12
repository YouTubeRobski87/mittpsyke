import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import CabinProof from './CabinProof.svelte';

// Komponenten har två varianter sedan stegkortet slutade ligga som överlägg
// ovanpå hero-scenen: `scene` bär landskapet i heron, `card` bär produktbeviset
// i Kvällsstugan. Att de inte överlappar är hela poängen - kortet doldes
// tidigare med display:none under 1120px, vilket lämnade varje telefon utan
// produkt-UI, och landskapet får inte dyka upp två gånger på samma sida.

describe('Stegkortet (card)', () => {
	const { body } = render(CabinProof, { props: { variant: 'card' as const } });

	it('märker exemplet före frågan och svarsalternativen', () => {
		expect(body).toContain('Exempel');
		expect(body.indexOf('Exempel')).toBeLessThan(body.indexOf('Hur är det ikväll?'));
	});

	it('säger i bildtexten vad kortet är och var incheckningen görs', () => {
		expect(body).toContain('Så ser kvällsincheckningen ut. Du gör den i Kvällsstugan.');
	});

	it('har inga interaktiva kontroller, ingen CTA och ingen knappliknande åtgärdsrad', () => {
		expect(body).not.toMatch(/<(?:button|a|input|select|textarea)\b|tabindex=|role="(?:button|link)"/);
		// "Fortsätt" fanns som en falsk åtgärdsrad i kortets fot och läste som
		// knappen i den riktiga incheckningen. Den ska inte komma tillbaka.
		expect(body).not.toContain('Fortsätt');
		expect(body).not.toContain('cabin-proof-primary');
	});

	// Kvällsstugan har redan interiörbilden som sektionens scen. Skulle kortet
	// dra med sig landskapet låg samma motiv två gånger på startsidan.
	it('drar inte med sig landskapsscenen', () => {
		expect(body).not.toContain('cabin-proof-scene');
		expect(body).not.toContain('cabin-proof-bear');
	});
});

describe('Hero-scenen (scene)', () => {
	const { body } = render(CabinProof, { props: { variant: 'scene' as const } });

	it('visar solnedgångsscenen med personen och lägerelden, inte den tomma bilden', () => {
		expect(body).toContain('progress-cabin-lakeside-afternoon-800.webp');
		expect(body).toContain('progress-cabin-lakeside-afternoon-1200.webp');
		expect(body).toContain('progress-cabin-lakeside-afternoon.webp 1672w');
		// Den tomma varianten saknar både människa och eld och får inte smyga
		// tillbaka in i heron.
		expect(body).not.toContain('progress-cabin-lakeside-800.webp');
	});

	it('ritar björnen som eget lager och beskriver hela scenen i alt-texten', () => {
		expect(body).toMatch(/class="cabin-proof-bear[^"]*"/);
		expect(body).toContain('/images/avatars/presets/bear-sitting-back.png');
		// Lagret är dekor ovanpå scenen - bakgrundsbildens alt bär beskrivningen.
		expect(body).toMatch(/<img[^>]*class="cabin-proof-bear[^"]*"[^>]*alt=""/);
		expect(body).toContain('en person och en björn sitter tillsammans vid en lägereld');
		expect(body).toContain('blickar ut över sjön');
		expect(body).toContain('solen står lågt');
	});

	it('har inga interaktiva kontroller', () => {
		expect(body).not.toMatch(/<(?:button|a|input|select|textarea)\b|tabindex=|role="(?:button|link)"/);
	});

	// Scenen ska bära stämning, inte bevis. Ligger kortet här igen är vi
	// tillbaka i överlägget som täckte personen vid elden.
	it('bär inget stegkort ovanpå scenen', () => {
		expect(body).not.toContain('cabin-proof-card');
		expect(body).not.toContain('Hur är det ikväll?');
		expect(body).not.toContain('Steg 1 av 4');
	});
});
