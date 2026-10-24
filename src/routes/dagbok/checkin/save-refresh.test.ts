// "Sparat" får aldrig följas av ett fel om servern bekräftat sparandet.
//
// Regressionen: efter ett lyckat POST /api/diary/create sattes "Inlägget är
// sparat", men omladdningen av listan låg i samma try. Om den kastade visade
// catch "Kunde inte hämta anteckningar just nu." i redigerarens felruta, bredvid
// beskedet att inlägget var sparat. Användaren kunde tro att sparandet
// misslyckats och spara samma text igen. Samma mönster fanns vid redigering och
// borttagning.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// $lib/state/diary skapar Supabase-klienten vid import och kräver miljövariabler.
vi.mock('$lib/supabase', () => ({ supabase: {} }));

const { DIARY_LIST_REFRESH_NOTICE, refreshAfterConfirmedChange } = await import('$lib/state/diary');

describe('omladdning efter en bekräftad ändring', () => {
	it('lyckad omladdning ger true', async () => {
		await expect(refreshAfterConfirmedChange(async () => {})).resolves.toBe(true);
	});

	it('misslyckad omladdning ger false och kastar inte vidare', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const refresh = vi.fn(async () => {
			throw new Error('Kunde inte hämta anteckningar just nu.');
		});

		await expect(refreshAfterConfirmedChange(refresh)).resolves.toBe(false);
		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it('notisen säger att inlägget är sparat', () => {
		expect(DIARY_LIST_REFRESH_NOTICE).toMatch(/^Inlägget är sparat\./);
	});
});

const source = readFileSync(join(process.cwd(), 'src/routes/dagbok/checkin/+page.svelte'), 'utf8');

/** Kroppen för en funktion i sidans script, fram till nästa toppnivåfunktion. */
function functionBody(name: string): string {
	const start = source.indexOf(`async function ${name}(`);
	expect(start).toBeGreaterThan(-1);
	const next = source.indexOf('\n\tasync function ', start + 1);
	const nextSync = source.indexOf('\n\tfunction ', start + 1);
	const ends = [next, nextSync].filter((index) => index > -1);
	return source.slice(start, Math.min(...ends));
}

describe.each(['saveDraftToDiary', 'saveEdit', 'deleteEntry'])('%s', (name) => {
	it('laddar om listan via refreshAfterConfirmedChange, inte direkt i ändringens try', () => {
		const body = functionBody(name);

		expect(body).toContain('refreshAfterConfirmedChange(');
		expect(body).not.toMatch(/await loadEntries\(/);
	});
});

describe('saveDraftToDiary efter bekräftat sparande', () => {
	const body = functionBody('saveDraftToDiary');

	it('markerar sparandet som bekräftat direkt efter serverns OK', () => {
		const okCheck = body.indexOf('if (!response.ok)');
		const confirmed = body.indexOf('saveConfirmed = true;');

		expect(okCheck).toBeGreaterThan(-1);
		expect(confirmed).toBeGreaterThan(okCheck);
	});

	it('sätter aldrig draftError i catch när sparandet redan är bekräftat', () => {
		const catchBlock = body.slice(body.lastIndexOf('} catch (error) {'));
		const confirmedBranch = catchBlock.slice(
			catchBlock.indexOf('if (saveConfirmed) {'),
			catchBlock.indexOf('} else {')
		);

		expect(confirmedBranch).toContain("draftSuccess = 'Inlägget är sparat';");
		expect(confirmedBranch).not.toContain('draftError');
	});

	it('misslyckad omladdning ger notisen, inte ett fel', () => {
		const afterSuccess = body.slice(body.indexOf("draftSuccess = 'Inlägget är sparat';"));
		const tryEnd = afterSuccess.indexOf('} catch (error) {');

		expect(afterSuccess.slice(0, tryEnd)).toContain('draftListNotice = DIARY_LIST_REFRESH_NOTICE');
		expect(afterSuccess.slice(0, tryEnd)).not.toContain('draftError');
	});
});

describe('mallen för sparat inlägg', () => {
	const template = source.slice(source.lastIndexOf('</script>'));
	const panelStart = template.indexOf('{#if draftSuccess && !draftText}');
	const panel = template.slice(panelStart, template.indexOf('</section>', panelStart));

	it('visar notisen i sparat-rutan', () => {
		expect(panel).toContain('{draftListNotice}');
	});

	it('döljer "Se inlägget" när listan inte kunde uppdateras', () => {
		const button = panel.indexOf('onclick={openLatestEntries}');
		const guard = panel.lastIndexOf('{#if !draftListNotice}', button);

		expect(button).toBeGreaterThan(-1);
		expect(guard).toBeGreaterThan(-1);
	});
});
