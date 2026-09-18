import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	CHECKIN_REFLECTION_HEADING,
	buildCheckinDiaryContent,
	type CheckinDiaryInput
} from '$lib/checkin-diary-content';

// MittPsykes AI-reflektion får förstärka användarens egen reflektion, inte
// tyst bli en del av hennes dagbok. Den visas alltid, men sparas bara när
// användaren själv kryssat i valet.

const page = readFileSync(
	join(process.cwd(), 'src/routes/dagars-avtryck/checkin/+page.svelte'),
	'utf8'
);

const REFLECTION = 'Det låter som att kvällen bar mycket. Du behöver inte lösa allt nu.';

function input(overrides: Partial<CheckinDiaryInput> = {}): CheckinDiaryInput {
	return {
		selectedMoods: ['Trött', 'Orolig'],
		selectedFactors: ['Jobbet'],
		selectedDuration: 'Några dagar',
		selectedSelfCare: ['Tog en promenad'],
		selectedHelp: ['Att få vila'],
		moodFreeText: 'Det snurrade mest på kvällen.',
		factorFreeText: 'Mycket att göra.',
		reflection: REFLECTION,
		includeReflection: false,
		...overrides
	};
}

describe('valet är av som standard', () => {
	it('har kryssrutan omarkerad från början', () => {
		expect(page).toContain('let includeReflectionInDiary = false;');
		expect(page).toContain('bind:checked={includeReflectionInDiary}');
		// Inget som sätter den till true automatiskt.
		expect(page).not.toMatch(/includeReflectionInDiary\s*=\s*true/);
	});

	it('erbjuder valet i lugn, frivillig ton', () => {
		expect(page).toContain('Ta med MittPsykes reflektion i dagboksinlägget');
		expect(page).not.toMatch(/jag samtycker|godkänner härmed|villkor/i);
	});
});

describe('reflektionen visas före sparning', () => {
	it('renderar reflektionen och märker den som AI-genererad', () => {
		expect(page).toContain('AI-genererad reflektion');
		expect(page).toMatch(/<div class="reflection-box">\s*<p>\{reflection \|\| reflectionFallback\}<\/p>/);
	});

	it('visar reflektionen före spara-knappen', () => {
		expect(page.indexOf('class="reflection-box"')).toBeLessThan(page.indexOf('Spara i dagboken'));
		expect(page.indexOf('Ta med MittPsykes reflektion')).toBeLessThan(
			page.indexOf('Spara i dagboken')
		);
	});

	it('håller reflektionen oredigerbar, så ägarskapet förblir tydligt', () => {
		const step = page.slice(page.indexOf('AI-genererad reflektion'), page.indexOf('Spara i dagboken'));
		expect(step).not.toContain('bind:value={reflection}');
		expect(step).not.toContain('contenteditable');
	});
});

describe('sparning utan valt AI-tillägg', () => {
	const content = buildCheckinDiaryContent(input({ includeReflection: false }));

	it('sparar bara användarens egna svar', () => {
		expect(content).toContain('Guidad incheckning');
		expect(content).toContain('- Trött');
		expect(content).toContain('- Jobbet');
		expect(content).toContain('Egna ord:');
		expect(content).toContain('Det snurrade mest på kvällen.');
	});

	it('innehåller ingen AI-genererad text alls', () => {
		expect(content).not.toContain(CHECKIN_REFLECTION_HEADING);
		expect(content).not.toContain(REFLECTION);
		expect(content).not.toMatch(/MittPsyke-reflektion/);
	});
});

describe('sparning med valet aktiverat', () => {
	const content = buildCheckinDiaryContent(input({ includeReflection: true }));

	it('tar med reflektionen under sin egen rubrik', () => {
		expect(content).toContain(CHECKIN_REFLECTION_HEADING);
		expect(content).toContain(REFLECTION);
		// Rubriken kommer före texten, så ägarskapet syns i själva inlägget.
		expect(content.indexOf(CHECKIN_REFLECTION_HEADING)).toBeLessThan(content.indexOf(REFLECTION));
	});

	it('lämnar användarens egna svar oförändrade', () => {
		const without = buildCheckinDiaryContent(input({ includeReflection: false }));
		expect(content.startsWith(without)).toBe(true);
	});

	it('lägger inte till en tom rubrik när reflektionen saknas', () => {
		const empty = buildCheckinDiaryContent(input({ includeReflection: true, reflection: '   ' }));
		expect(empty).not.toContain(CHECKIN_REFLECTION_HEADING);
	});
});

describe('"Börja skriva mer" öppnar dagboken utan AI-text', () => {
	const fn = page.slice(
		page.indexOf('function continueToDiaryWriting()'),
		page.indexOf('async function grantDiaryAiConsent')
	);

	it('finns kvar som knapp och navigerar till dagbokseditorn', () => {
		expect(page).toContain('onclick={continueToDiaryWriting}');
		expect(page).toContain('Börja skriva mer');
		expect(fn).toContain("goto('/dagbok/checkin#skriv-sjalv')");
	});

	it('skickar varken reflektionen eller reservtexten som prefill', () => {
		expect(fn).not.toContain('writeDiaryCheckinPrefill');
		expect(fn).not.toContain('reflection');
		expect(fn).not.toContain('reflectionFallback');
	});

	it('lämnar ingen prefill-väg kvar någonstans i incheckningen', () => {
		// Hela sidan: AI-texten får inte skickas vidare till dagboksutkastet.
		expect(page).not.toContain('writeDiaryCheckinPrefill');
		expect(page).not.toContain("from '$lib/diary-draft'");
	});
});

describe('det befintliga incheckningsflödet fungerar fortfarande', () => {
	it('behåller alla frågeblock i samma ordning', () => {
		const content = buildCheckinDiaryContent(input());
		const order = [
			'Guidad incheckning',
			'Hur jag mår just nu:',
			'Vad som påverkar:',
			'Hur länge det har känts så:',
			'Gjort för mig själv idag:',
			'Vad som skulle hjälpa just nu:',
			'Egna ord:'
		];
		let cursor = -1;
		for (const heading of order) {
			const at = content.indexOf(heading);
			expect(at, heading).toBeGreaterThan(cursor);
			cursor = at;
		}
	});

	it('klarar tomma val utan att tappa struktur', () => {
		const content = buildCheckinDiaryContent(
			input({
				selectedMoods: [],
				selectedFactors: [],
				selectedDuration: '',
				selectedSelfCare: [],
				selectedHelp: [],
				moodFreeText: '',
				factorFreeText: ''
			})
		);
		expect(content).toContain('- Inget valt');
		expect(content).not.toContain('Egna ord:');
		expect(content).not.toContain(CHECKIN_REFLECTION_HEADING);
	});

	it('sparar fortfarande via samma diary-endpoint och spara-knapp', () => {
		expect(page).toContain("fetch('/api/diary/create'");
		expect(page).toContain('onclick={saveToDiary}');
		expect(page).toContain('buildCheckinDiaryContent({');
		// AI-endpointen för reflektionen är orörd.
		expect(page).toContain("fetch('/api/diary/checkin-reflection'");
	});
});
