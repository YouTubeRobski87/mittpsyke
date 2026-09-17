import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
	join(process.cwd(), 'src/routes/dashboard/kvallsstugan/+page.svelte'),
	'utf8'
);

describe('Utkastkontinuitet i Kvällstugan', () => {
	it('återanvänder den delade komponenten i stället för en egen kopia av draft-läsningen', () => {
		expect(page).toContain(
			"import DraftContinuityCard from '$lib/components/DraftContinuityCard.svelte'"
		);
		// Ingen egen readDiaryDraft-import eller egen hasLocalDraftToResume-logik
		// här - all draft-state kommer från den delade komponenten.
		expect(page).not.toContain('readDiaryDraft');
		expect(page).not.toContain('hasLocalDraftToResume');
	});

	it('visar kortet i flödesspalten, inte som en ny redirect via /dashboard', () => {
		const flowColumn = page.slice(
			page.indexOf('class="evening-flow-column"'),
			page.indexOf('class="evening-flow-wrap"')
		);

		expect(flowColumn).toContain('<DraftContinuityCard />');
		expect(page).not.toMatch(/redirect\(303, ['"]\/dashboard['"]\)/);
	});
});
