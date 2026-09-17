import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Samma mönster som resten av kodbasen: komponentens markup granskas som
// text i stället för att renderas, eftersom onMount (där readDiaryDraft
// faktiskt läser localStorage) aldrig körs vid serverrendering.
const component = readFileSync(
	join(process.cwd(), 'src/lib/components/DraftContinuityCard.svelte'),
	'utf8'
);

describe('DraftContinuityCard', () => {
	it('läser utkastet via den befintliga, delade funktionen - ingen egen lagringsnyckel', () => {
		expect(component).toContain("import { readDiaryDraft } from '$lib/diary-draft'");
		expect(component).toContain('hasDraft = Boolean(readDiaryDraft());');
		// Ingen ny localStorage-nyckel eller egen parsning introduceras här.
		expect(component).not.toContain('localStorage');
	});

	it('varken raderar eller importerar utkastet automatiskt', () => {
		expect(component).not.toMatch(/writeDiaryDraft|clearDiaryDraft|diary\/create/);
	});

	it('kör ingen AI-analys eller nätverksanrop', () => {
		expect(component).not.toMatch(/fetch\(|openai|anthropic|generate/i);
	});

	it('renderar bara kortet när ett utkast faktiskt finns', () => {
		expect(component).toContain('{#if hasDraft}');
	});

	it('leder till samma skrivyta och samma text som den gamla dashboardkortet gjorde', () => {
		expect(component).toContain('Ditt utkast finns kvar');
		expect(component).toContain(
			'Fortsätt där du slutade. Du väljer själv när du vill spara texten som ett inlägg.'
		);
		expect(component).toContain('href="/dagbok/checkin#skriv-sjalv"');
		expect(component).toContain('Fortsätt skriva');
	});
});
