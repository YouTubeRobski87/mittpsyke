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
		expect(guestEntry).toContain('href="/register?fromDiary=true"');
	});

	// Besökaren skriver redan utan konto och texten autosparas lokalt, så
	// "Fortsätt utan konto" gjorde inget synligt. Kontoerbjudandet står kvar.
	it('har bara kontots CTA i skrivytans fot, ingen "Fortsätt utan konto"', () => {
		expect(guestEntry).not.toContain('Fortsätt utan konto');
		expect(guestEntry).toContain('Skapa konto för att spara inlägg');
		expect(guestEntry).toContain('saveTimer = setInterval(persistIfDirty, AUTOSAVE_INTERVAL_MS);');
	});

	it('registreringen läser utkastet men skapar inget dagboksinlägg', () => {
		expect(registerPage).toContain('const storedDraft = readDiaryDraft();');
		expect(registerAction).not.toMatch(/from\(['"]diary['"]\)|\/api\/diary|writeDiaryDraft|clearDiaryDraft/);
		// Utkastvägen (/register?fromDiary=true) bär ingen ?redirect=, så den
		// landar numera i Kvällstugan i stället för på gamla dashboarden. Ett
		// mål från /login (t.ex. Kvällstugan) följs bara när det finns.
		expect(guestEntry).not.toContain('/register?fromDiary=true&redirect');
		expect(registerAction).toContain('throw redirect(303, safeInternalRedirect(redirectParam))');
		expect(safeInternalRedirect(new URLSearchParams('fromDiary=true').get('redirect'))).toBe(
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
