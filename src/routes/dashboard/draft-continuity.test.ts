import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { safeInternalRedirect } from '$lib/safe-redirect';

const workspace = process.cwd();
const dashboard = readFileSync(join(workspace, 'src/routes/dashboard/+page.svelte'), 'utf8');
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

	it('registreringen läser utkastet men skapar inget dagboksinlägg', () => {
		expect(registerPage).toContain('const storedDraft = readDiaryDraft();');
		expect(registerAction).not.toMatch(/from\(['"]diary['"]\)|\/api\/diary|writeDiaryDraft|clearDiaryDraft/);
		// Utkastvägen (/register?fromDiary=true) bär ingen ?redirect=, så den
		// landar fortfarande på Mitt Hem där "Fortsätt skriva" visas. Ett mål
		// från /login (t.ex. Kvällsstugan) följs bara när det finns.
		expect(guestEntry).not.toContain('/register?fromDiary=true&redirect');
		expect(registerAction).toContain('throw redirect(303, safeInternalRedirect(redirectParam))');
		expect(safeInternalRedirect(new URLSearchParams('fromDiary=true').get('redirect'))).toBe('/dashboard');
	});

	it('visar en kontinuitetsväg bara för en inloggad användare med lokalt utkast', () => {
		expect(dashboard).toContain('hasLocalDraftToResume = !isAnonymous && Boolean(readDiaryDraft());');
		expect(dashboard).toContain('{#if hasLocalDraftToResume}');
		expect(dashboard).toContain('Ditt utkast finns kvar');
		expect(dashboard).toContain("'/dagbok/checkin#skriv-sjalv'");
		expect(dashboard).toContain("'Fortsätt skriva'");
	});

	it('behåller normalläget utan utkast och påstår aldrig att utkastet är sparat', () => {
		expect(dashboard).toContain('<p class="home-card-lead">Hur har du det idag?</p>');
		expect(dashboard).toContain("'Skriv i dagboken'");
		expect(dashboard).not.toMatch(/utkast(?:et)? (?:är|har blivit) sparat/i);
	});

	it('öppnar editorn med utkastet utan att exponera texten på dashboarden', () => {
		expect(diaryPage).toContain('draftText = readDiaryDraft();');
		expect(diaryPage).toContain("window.location.hash === '#skriv-sjalv'");
		expect(diaryPage).toContain('await openWriteEditor();');
		expect(dashboard).not.toContain('{readDiaryDraft()}');
		expect(dashboard).not.toContain('{draftText}');
	});
});
