import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Samma kontraktsmönster som progressScene.test.ts: hero-scenen bor i routen,
// så markupen granskas som text i stället för att monteras.
const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');
const cabinLink = route.slice(
	route.indexOf('class="progress-cabin-link"'),
	route.indexOf('></a>', route.indexOf('class="progress-cabin-link"'))
);

describe('genvägen via stugan', () => {
	it('går direkt till Kvällstugan för inloggade och till startsidan för gäster', () => {
		expect(cabinLink).toContain("href={isAnonymous ? '/' : '/dashboard/kvallsstugan'}");
		// En vanlig <a> räcker: ingen onclick, ingen goto, inget tangentbordshack.
		expect(cabinLink).not.toMatch(/onclick|on:click|goto\(/);
		expect(route).toMatch(/<a\s+[^>]*class="progress-cabin-link"/s);
	});

	it('har ett tydligt accessible name', () => {
		expect(cabinLink).toContain("aria-label={isAnonymous ? 'Gå till Mitt Hem' : 'Gå in i Kvällstugan'}");
	});

	it('har en synlig ingång även utan att man hittar bildens hotspot', () => {
		expect(route).toContain('<a class="cabin-entry-link" href="/dashboard/kvallsstugan">Kvällstugan</a>');
		expect(route).toContain('.cabin-entry-link:focus-visible');
	});

	it('bär ingen synlig textetikett ovanpå bilden', () => {
		// Elementet får bara innehålla whitespace före stängningen, aldrig synlig copy.
		expect(route).toMatch(/<a\s+[^>]*data-testid="progress-cabin-link"[^>]*>\s*<\/a>/s);
	});

	it('renderas bara när klickytan faktiskt är uppmätt', () => {
		expect(route).toContain('{#if cabinPlacement}');
	});

	it('positioneras ur scenens bildgeometri, inte ur fasta pixlar', () => {
		expect(route).toContain('getProgressCabinPlacement');
		expect(route).toContain('var(--progress-cabin-left, 0)');
		expect(route).toContain('var(--progress-cabin-top, 0)');
		expect(route).toContain('var(--progress-cabin-width, 0)');
		expect(route).toContain('var(--progress-cabin-height, 0)');
	});

	it('ligger under scenens copy', () => {
		const rule = route.slice(route.indexOf('.progress-cabin-link {'));

		expect(rule.slice(0, rule.indexOf('}'))).toContain('z-index: var(--scene-midground)');
	});
});

describe('Framstegsscenen runt stuglänken', () => {
	it('gör inga andra scenlager klickbara', () => {
		// Dekorativa lager ska förbli dekorativa. Endast stuglänken och
		// spårlagrets knappar tar emot pekare i scenen.
		for (const layer of [
			'progress-ripple progress-ripple--one',
			'progress-ripple progress-ripple--two'
		]) {
			const index = route.indexOf(`class="${layer}"`);
			expect(index, layer).toBeGreaterThan(-1);
			expect(route.slice(index, index + 120), layer).toContain('aria-hidden="true"');
		}
		// Den synliga scenbilden beskriver motivet men är inte en egen länk.
		expect(route).toContain("'Du sitter vid sjön tillsammans med följeslagaren Balder, med stugan och lägerelden i närheten.'");
		expect(route).toContain("'Du sitter vid sjön, med stugan och lägerelden i närheten.'");
	});

	it('behåller den inloggades följeslagare men inga visitor eller friend', () => {
		expect(route.match(/<CompanionPose/g) ?? []).toHaveLength(1);
		expect(route).not.toContain('<CompanionVisitor');
		expect(route).not.toContain('<CompanionFriend');
	});

	it('behåller hero-rubriken och tidslabeln', () => {
		expect(route).toContain('<h2>Din plats idag</h2>');
		expect(route).toContain('{getProgressSceneLabel(sceneTransition.visibleBand)}');
	});

	it('behåller WorldMarks på samma bildkoordinater när mobilscenen inte beskärs', () => {
		expect(route).toContain(
			'const fullSceneMarks = getWorldMarks(worldPresence, { timeOfDay, unlocked: unlockedWorldMarks })'
		);
		expect(route).toContain('return fullSceneMarks.filter((mark) => narrowMarkIds.has(mark.id))');
	});

	it('låter inloggade gå in via både stugmotivet och den synliga länken', () => {
		const scene = route.slice(route.indexOf('class="companion-media"'), route.indexOf('class="framsteg-layout'));

		expect(scene).toContain("href={isAnonymous ? '/' : '/dashboard/kvallsstugan'}");
		expect(scene.match(/href="\/dashboard\/kvallsstugan"/g) ?? []).toHaveLength(1);
		expect(scene).not.toContain('href="/dashboard"');
		expect(scene).not.toContain("'/dashboard'");
	});
});
