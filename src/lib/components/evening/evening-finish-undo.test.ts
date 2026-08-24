import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Samma kontraktsmönster som evening-next-steps-flow.test.ts: komponenten
// granskas som text, eftersom det inte finns någon DOM-miljö i testuppsättningen.
const flow = readFileSync(
	join(process.cwd(), 'src/lib/components/evening/EveningCheckinFlow.svelte'),
	'utf8'
);

const savedBranch = flow.slice(
	flow.indexOf('{#if saved}'),
	flow.indexOf('{:else if finishedWithoutSaving}')
);

// Enbart grenen för "avslutade utan att spara", inte grenen med spara-knapparna
// som följer efter den.
const undoBranchStart = flow.indexOf('{:else if finishedWithoutSaving}');
const undoBranch = flow.slice(undoBranchStart, flow.indexOf('{:else}', undoBranchStart));

const handler = flow.slice(
	flow.indexOf('function returnToAnswers'),
	flow.indexOf('async function saveAndFinish')
);

describe('ångerväg efter avslut utan att spara', () => {
	it('visar "Tillbaka till dina svar" i just den grenen', () => {
		expect(undoBranch).toContain('Tillbaka till dina svar');
		expect(undoBranch).toContain('onclick={returnToAnswers}');
	});

	it('använder den befintliga sekundärstilen och inte nästa steg-klasserna', () => {
		expect(undoBranch).toContain('class="evening-secondary"');
		expect(undoBranch).not.toContain('evening-primary');
		expect(undoBranch).not.toContain('evening-next');
	});

	it('erbjuds inte i grenen där något faktiskt sparats', () => {
		expect(savedBranch).not.toContain('returnToAnswers');
		expect(savedBranch).not.toContain('Tillbaka till dina svar');
	});

	it('öppnar avslutet igen och nollar felmeddelandet', () => {
		expect(handler).toContain('finishedWithoutSaving = false');
		expect(handler).toContain("saveError = ''");
	});

	it('lämnar tillbaka fokus till stegets rubrik', () => {
		expect(handler).toContain('tick()');
		expect(handler).toContain('stepHeading?.focus()');
		// Rubriken i steg 4 är den bundna, fokuserbara rubriken.
		expect(flow).toContain('<h2 id="evening-flow-title" bind:this={stepHeading} tabindex="-1">Det räcker för ikväll.</h2>');
	});

	it('behåller användarens svar', () => {
		expect(handler).not.toMatch(/\b(themeId|thought|parkingBucket|step|saved)\s*=[^=]/);
	});

	it('sparar inget, mäter inget och navigerar ingenstans', () => {
		expect(handler).not.toMatch(/fetch\(|goto\(|href=|supabase|oncomplete\(|localStorage|track|analytics/i);
	});

	it('släpper tillbaka användaren in i flödet, så sparandet går att välja igen', () => {
		// Guarden i saveAndFinish är det som blockerar sparning efter avslutet.
		// Nollställd flagga betyder att båda avsluten är valbara på nytt.
		expect(flow).toContain(
			'if (!themeId || !parkingBucket || saving || saved || finishedWithoutSaving) return;'
		);
		expect(flow).toContain('Spara kvällens incheckning');
		expect(flow).toContain('Avsluta utan att spara');
	});
});

describe('ångervägen rör inget annat i avslutet', () => {
	it('låter nästa steg ligga kvar enbart i saved-grenen', () => {
		expect(savedBranch).toContain('evening-next');
		expect(undoBranch).not.toContain('evening-next');
	});

	it('lämnar valet att stanna kvar oförändrat', () => {
		expect(flow).toContain('stayingHere = true');
		expect(flow).toContain('{#if stayingHere}');
		expect(handler).not.toContain('stayingHere');
		expect(undoBranch).not.toContain('stayingHere');
	});
});
