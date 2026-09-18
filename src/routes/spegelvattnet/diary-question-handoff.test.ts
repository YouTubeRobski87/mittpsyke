import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Produktprincip: AI ska förstärka användarens egen reflektion, inte ersätta
// den. Spegelvattnets fråga fick tidigare `writeDiaryCheckinPrefill(...)`
// skriva rakt in i dagbokseditorns textfält, som om frågan vore användarens
// egna ord. Den ska nu visas separat i editorn — aldrig som förifylld text.
//
// Vitest kör i nodemiljö utan DOM, därför läses källan som text i stället för
// att renderas (samma kontraktsmönster som övriga route-tester, se
// guided-checkin-entry.test.ts).

const spegelvattnet = readFileSync(
	join(process.cwd(), 'src/routes/spegelvattnet/+page.svelte'),
	'utf8'
);

const dagbokCheckin = readFileSync(
	join(process.cwd(), 'src/routes/dagbok/checkin/+page.svelte'),
	'utf8'
);

describe('Spegelvattnet lämnar över frågan som skrivprompt, inte som dagbokstext', () => {
	it('använder inte längre den fria textprefillen', () => {
		expect(spegelvattnet).not.toContain('writeDiaryCheckinPrefill');
		expect(spegelvattnet).not.toMatch(/writeDiaryCheckinPrefill\(`\$\{openQuestion\}/);
	});

	it('lämnar över frågan via den separata prompt-handoffen', () => {
		expect(spegelvattnet).toContain("import { writeDiaryPromptHandoff } from '$lib/diary-draft'");
		expect(spegelvattnet).toMatch(/function prepareDiaryQuestion\(\)\s*\{[\s\S]{0,200}writeDiaryPromptHandoff\(openQuestion\)/);
	});

	it('navigerar fortfarande till samma dagbokssida och sektion som tidigare', () => {
		expect(spegelvattnet).toContain("const diaryHref = '/dagbok/checkin#skriv-sjalv';");
		const link = spegelvattnet.match(/<a href=\{diaryHref\}[^>]*onclick=\{prepareDiaryQuestion\}[^>]*>([\s\S]*?)<\/a>/);
		expect(link).not.toBeNull();
		expect(link?.[1].trim()).toBe('Skriv om det här');
	});

	it('rör inte Spegelvattnets egen AI-generering', () => {
		// Frågans källa (open_question från reflektionen) är oförändrad — bara
		// vägen in i dagboken ändras.
		expect(spegelvattnet).toContain(
			"const openQuestion = $derived(reflection?.open_question || 'Vad vill du ta med dig från veckan som varit?');"
		);
	});
});

describe('Dagbokseditorn håller frågan skild från användarens egna ord', () => {
	it('tar emot skrivfrågan via en egen konsument, inte fritextprefillen', () => {
		expect(dagbokCheckin).toContain(
			"consumeDiaryPromptHandoff,"
		);
		expect(dagbokCheckin).toMatch(
			/const promptQuestion =\s*\n?\s*consumeDiaryPromptHandoff\(\) \|\| \$page\.url\.searchParams\.get\('prompt'\)\?\.trim\(\);/
		);
	});

	it('fritextprefillen har fortfarande företräde framför en skrivfråga', () => {
		const prefillBranch = dagbokCheckin.indexOf('if (prefill) {');
		const promptBranch = dagbokCheckin.indexOf('} else if (promptQuestion) {');
		expect(prefillBranch).toBeGreaterThan(-1);
		expect(promptBranch).toBeGreaterThan(prefillBranch);
	});

	it('dagbokstextfältet börjar tomt när editorn öppnas från en skrivfråga', () => {
		const branch = dagbokCheckin.slice(
			dagbokCheckin.indexOf('} else if (promptQuestion) {'),
			dagbokCheckin.indexOf('} else if (typeof window !== ')
		);
		expect(branch).toContain('draftPromptQuestion = promptQuestion;');
		expect(branch).toContain("draftText = '';");
	});

	it('visar frågan som en tydligt separerad prompt ovanför textfältet, inte i det', () => {
		const editorSection = dagbokCheckin.slice(
			dagbokCheckin.indexOf('id="skriv-sjalv"'),
			dagbokCheckin.indexOf('</textarea>')
		);
		const promptBlockIndex = editorSection.indexOf('<blockquote>{draftPromptQuestion}</blockquote>');
		const textareaIndex = editorSection.indexOf('bind:value={draftText}');

		expect(promptBlockIndex).toBeGreaterThan(-1);
		expect(textareaIndex).toBeGreaterThan(-1);
		expect(promptBlockIndex).toBeLessThan(textareaIndex);
		expect(editorSection).toContain(
			'Svara fritt. Frågan sparas bara som koppling, inte som text i ditt inlägg.'
		);
	});

	it('sparar frågan som en egen koppling, aldrig sammanslagen med användarens text', () => {
		const saveCall = dagbokCheckin.slice(
			dagbokCheckin.indexOf("fetch('/api/diary/create'"),
			dagbokCheckin.indexOf("fetch('/api/diary/create'") + 800
		);
		expect(saveCall).toContain('text: draftText.trim(),');
		expect(saveCall).toContain('prompt_question: draftPromptQuestion || null,');
		// Texten som sparas får aldrig byggas ihop med frågan.
		expect(saveCall).not.toMatch(/text:\s*`[^`]*draftPromptQuestion/);
		expect(saveCall).not.toContain('draftText + draftPromptQuestion');
		expect(saveCall).not.toContain('draftPromptQuestion + draftText');
	});
});

describe('Ingen regression i /checkin (den befintliga snabb-incheckningen)', () => {
	const quickCheckin = readFileSync(join(process.cwd(), 'src/routes/checkin/+page.svelte'), 'utf8');

	it('använder fortfarande fritextprefillen för sina egna, av användaren skrivna, svar', () => {
		// /checkin samlar bara användarens egna ord (tre korta fält) — det är
		// alltså rätt att den fortsätter använda writeDiaryCheckinPrefill.
		expect(quickCheckin).toContain("import { writeDiaryCheckinPrefill } from '$lib/diary-draft';");
		expect(quickCheckin).toContain('writeDiaryCheckinPrefill(combined);');
		expect(quickCheckin).not.toContain('writeDiaryPromptHandoff');
	});
});
