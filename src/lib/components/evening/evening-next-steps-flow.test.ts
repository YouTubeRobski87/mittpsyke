import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Kontraktstest på flödets markup. Samma mönster som progressScene.test.ts:
// komponenten bor i en route-nära .svelte-fil, så den granskas som text.
const flow = readFileSync(
	join(process.cwd(), 'src/lib/components/evening/EveningCheckinFlow.svelte'),
	'utf8'
);

describe('sparandet är orört', () => {
	it('skickar fortfarande samma fält till API:t', () => {
		for (const field of ['themeId', 'thought', 'parkingBucket', 'flowVersion']) {
			expect(flow).toContain(field);
		}
		expect(flow).toContain('/api/evening-checkins');
	});

	it('behåller båda avsluten: spara respektive avsluta utan att spara', () => {
		expect(flow).toContain('Spara kvällens incheckning');
		expect(flow).toContain('Avsluta utan att spara');
	});

	it('rör inte inredningsminnet som drivs av checkin_date', () => {
		expect(flow).toContain('isEveningInteriorMemory');
	});
});

// Enbart markupen för nästa steg-blocket, inte importraden med samma ordstam.
const nextBlock = flow.slice(
	flow.indexOf('<div class="evening-next">'),
	flow.indexOf('{:else if finishedWithoutSaving}')
);

describe('nästa steg i avslutet', () => {
	it('visas bara när något faktiskt sparats', () => {
		const savedBranch = flow.slice(flow.indexOf('{#if saved}'), flow.indexOf('{:else if finishedWithoutSaving}'));

		expect(savedBranch).toContain('evening-next');
		// Grenen för "avslutade utan att spara" ska inte erbjuda nästa steg.
		const notSavedBranch = flow.slice(
			flow.indexOf('{:else if finishedWithoutSaving}'),
			flow.indexOf('{#if saveError}')
		);
		expect(notSavedBranch).not.toContain('evening-next');
	});

	it('använder den delade, deterministiska modulen', () => {
		expect(flow).toContain("from '$lib/evening-next-steps'");
		expect(flow).toContain('getEveningNextSteps(themeId)');
	});

	it('renderar det neutrala alternativet som en knapp, inte som en länk', () => {
		expect(flow).toContain('evening-next-stay');
		expect(flow).toMatch(/\{#if nextStep\.href\}[\s\S]*?\{:else\}[\s\S]*?<button/);
	});

	it('låter valet att stanna vara helt lokalt', () => {
		// Enbart knappen, inte de riktiga länkarna i samma lista.
		const stayButton = nextBlock.slice(nextBlock.indexOf('<button'), nextBlock.indexOf('</button>'));

		expect(stayButton).toContain('stayingHere = true');
		// Ingen navigation, inget nätverk, ingen lagring, ingen mätning.
		expect(stayButton).not.toMatch(/href=|goto\(|fetch\(|localStorage|track|analytics/i);
	});

	it('ser inte ut som en inaktiverad knapp', () => {
		expect(nextBlock).not.toMatch(/disabled|aria-disabled/);
		// Delar exakt samma basklass som de riktiga alternativen.
		expect(nextBlock).toContain('class="evening-next-link evening-next-stay"');
	});

	it('tystar nästa steg i stället för att lämna Kvällsstugan', () => {
		expect(flow).toContain('{#if stayingHere}');
		expect(flow).toContain('Då stannar vi här.');
	});

	it('tvingar ingen vidare', () => {
		expect(nextBlock).not.toMatch(/goto\(|autofocus/);
	});

	it('anropar ingen AI för att välja nästa steg', () => {
		expect(nextBlock).not.toMatch(/fetch\(|openai|anthropic|generate/i);
	});

	it('behåller vägen tillbaka till Mitt Hem', () => {
		expect(flow).toContain('href="/dashboard"');
	});
});
