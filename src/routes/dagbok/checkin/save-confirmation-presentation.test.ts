import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const successBlock = route.slice(
	route.indexOf('{#if draftSuccess && !draftText}'),
	route.indexOf('{#if loadError}')
);
const manualMilestoneBlock = route.slice(
	route.indexOf('function recordManualDiaryMilestone'),
	route.indexOf('async function loadEntries')
);

describe('dagbokens sparbekräftelse', () => {
	it('bekräftar sparandet och förklarar kopplingen till Framsteg', () => {
		expect(successBlock).toContain('Inlägget är sparat');
		expect(successBlock).toContain('Din text är nu en del av underlaget i Framsteg.');
		expect(successBlock).toContain('När något faktiskt återkommer eller');
		expect(successBlock).toContain('förändras visas det där – inte innan.');
		// Säger när något kan synas, med samma trösklar som analysen.
		expect(successBlock).toContain('{RECURRING_THEME_TIMING_COPY}');
	});

	it('gör Framsteg till primär handling och behåller lugna alternativ', () => {
		expect(successBlock).toContain('<a href="/framsteg" class="auth-button primary">Gå till Framsteg</a>');
		expect(successBlock).toContain('Se inlägget');
		expect(successBlock).toContain('Skriv igen');
		expect(successBlock).not.toContain('Se dina senaste inlägg');
	});

	it('påstår inte att en insikt eller ett mönster redan har hittats', () => {
		expect(successBlock).not.toMatch(/har hittat|vi ser att|ditt mående har|beror på/i);
	});

	it('sparar Första ordet utan att låta toasten konkurrera med kvittot', () => {
		expect(manualMilestoneBlock).toContain('awardFirstDiaryEntryMilestone(userId)');
		expect(manualMilestoneBlock).toContain('markMilestoneSeen(firstDiaryEntryMilestone.id, userId)');
		expect(manualMilestoneBlock).not.toContain('activeMilestoneToast = firstDiaryEntryMilestone');
		expect(manualMilestoneBlock).toContain("reason: 'save confirmation is primary'");
	});
});
