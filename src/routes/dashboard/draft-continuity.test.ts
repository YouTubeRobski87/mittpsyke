import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { safeInternalRedirect } from '$lib/safe-redirect';

const workspace = process.cwd();
const guestEntry = readFileSync(join(workspace, 'src/lib/components/GuestQuickEntry.svelte'), 'utf8');
const registerPage = readFileSync(join(workspace, 'src/routes/register/+page.svelte'), 'utf8');
const registerAction = readFileSync(join(workspace, 'src/routes/register/+page.server.ts'), 'utf8');
const diaryPage = readFileSync(join(workspace, 'src/routes/dagbok/checkin/+page.svelte'), 'utf8');

describe('lokalt dagboksutkast efter registrering', () => {
	it('sparar anonymtext före vanlig navigation till registreringen', () => {
		expect(guestEntry).toContain('onDestroy(() => {');
		expect(guestEntry).toMatch(/onDestroy\(\(\) => \{[\s\S]{0,180}?persistIfDirty\(\);/);
		expect(guestEntry).toContain('href={CREATE_ACCOUNT_FROM_DIARY_HREF}');
		// Klicket sparar direkt, utan att vänta på autosparningen.
		expect(guestEntry).toMatch(/function saveAndCreateAccount\(\) \{\s*persistIfDirty\(\);/);
	});

	// Besökaren skriver redan utan konto och texten autosparas lokalt, så
	// "Fortsätt utan konto" gjorde inget synligt. Kontoerbjudandet står kvar.
	it('har bara kontots CTA i skrivytans fot, ingen "Fortsätt utan konto"', () => {
		expect(guestEntry).not.toContain('Fortsätt utan konto');
		expect(guestEntry).toContain('Spara det du skrivit och se vad som återkommer.');
		expect(guestEntry).toContain('Skapa konto och fortsätt');
		expect(guestEntry).toContain('saveTimer = setInterval(persistIfDirty, AUTOSAVE_INTERVAL_MS);');
	});

	it('registreringen läser utkastet men skapar inget dagboksinlägg', () => {
		expect(registerPage).toContain('const storedDraft = readDiaryDraft();');
		expect(registerAction).not.toMatch(/from\(['"]diary['"]\)|\/api\/diary|writeDiaryDraft|clearDiaryDraft/);
		// Utkastvägen bär ?redirect=/dagbok/checkin, så den som skapar konto från
		// skrivytan kommer tillbaka till Dagboken. Utan parameter blir det
		// fortfarande Kvällstugan.
		expect(guestEntry).not.toContain('fromDiary');
		expect(registerAction).toContain('throw redirect(303, safeInternalRedirect(redirectParam))');
		expect(safeInternalRedirect(new URLSearchParams('').get('redirect'))).toBe(
			'/dashboard/kvallsstugan'
		);
	});

	// Kontinuitetskortet ("Ditt utkast finns kvar") låg tidigare inline på
	// gamla /dashboard (nu borttagen). Det lever numera i den delade
	// DraftContinuityCard.svelte, testad separat för Kvällstugan - se
	// src/lib/components/draft-continuity-card.test.ts och
	// src/routes/dashboard/kvallsstugan/*.
	it('öppnar editorn med utkastet via hash-ankaret', () => {
		expect(diaryPage).toContain('draftText = readDiaryDraft();');
		expect(diaryPage).toContain("window.location.hash === '#skriv-sjalv'");
		expect(diaryPage).toContain('await openWriteEditor();');
	});
});
