// MittPsykes återkomst ska bygga på värde, kontinuitet och frivillighet - inte
// på streaks, prestation eller skuld över missade dagar (docs/NORTH_STAR.md,
// "Ingen skuld").
//
// Testet vaktar Framsteg. Det granskar renderad copy, inte kommentarer -
// kommentarerna förklarar med flit vad som togs bort och varför, och ska inte
// kunna få testet att falla.
//
// Det dolda blocket med veckosammanfattning, lugn överblick och milstolpar
// togs bort helt (värdegranskningen, förslag 3). Testet vaktar att det inte
// kommer tillbaka och att streak- och milstolpshändelser inte längre skickas
// till Google Analytics.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Tar bort HTML-kommentarer och helradskommentarer, men rör inte URL:er. */
function renderedSource(path: string): string {
	return readFileSync(new URL(path, import.meta.url), 'utf8')
		.replace(/<!--[\s\S]*?-->/g, '')
		.split('\n')
		.filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
		.join('\n');
}

const framstegPage = renderedSource('./framsteg/+page.svelte');

const SURFACES = [['Framsteg', framstegPage]] as const;

/**
 * Renderade etiketter som presenterar ett antal sammanhängande dagar.
 *
 * Assertas som exakta element, inte som lösa ord. Ordet "streak" förekommer
 * fortfarande i identifierare (streakData, currentStreak) och i regexen som
 * *tar bort* "N dagar i rad" ur milstolpstexter - båda är avsiktliga och får
 * inte få testet att falla. Det som räknas är vad användaren läser.
 */
const STREAK_LABEL_ELEMENTS = [
	'<small>Dagar i följd</small>',
	'<span class="summary-stat-label">Dagar i följd</span>',
	'<span class="stat-label">dagars streak</span>',
	'<span class="streak-label">dagar i rad',
	'>Dagar i följd<',
	'>dagar i följd<'
];

/**
 * Fritext som presenterar en obruten rad dagar. Etikettlistan ovan matchar bara
 * exakta element och missade därför "Längsta sammanhängande följd: N dagar" i
 * Framstegs historikkort, som låg kvar i renderad copy. Regexen fångar
 * formuleringen oavsett hur den märks upp.
 *
 * Bara "sammanhängande/obruten rad" matchas här. Ett bredare mönster på
 * "dagar i rad" hade träffat sanerings-regexen på Framsteg som *tar bort*
 * den frasen ur milstolpstexter - se filhuvudet.
 */
const STREAK_PHRASE_PATTERNS = [
	/l[äa]ngsta\s+(sammanh[äa]ngande|obrutna)/i,
	/sammanh[äa]ngande\s+f[öo]ljd/i
];

/** Copy som uppmanar till obruten användning eller pekar ut missade dagar. */
const PRESSURE_PHRASES = [
	'fortsätt din',
	'missa inte',
	'du missade',
	'har missat',
	'nytt rekord',
	'behåll din',
	'bryt inte',
	'kom tillbaka imorgon',
	'varje dag för att'
];

describe('inga streak-etiketter i renderad copy', () => {
	for (const [name, source] of SURFACES) {
		it(`${name} visar inget antal sammanhängande dagar`, () => {
			for (const label of STREAK_LABEL_ELEMENTS) {
				expect(source).not.toContain(label);
			}
		});

		it(`${name} beskriver ingen obruten rad dagar i fritext`, () => {
			for (const pattern of STREAK_PHRASE_PATTERNS) {
				expect(source).not.toMatch(pattern);
			}
		});

		it(`${name} uppmanar inte till obruten användning`, () => {
			const lowered = source.toLocaleLowerCase('sv-SE');
			for (const phrase of PRESSURE_PHRASES) {
				expect(lowered).not.toContain(phrase);
			}
		});
	}
});

describe('Framsteg efter ändringen', () => {
	it('renderar inte currentStreak', () => {
		expect(framstegPage).not.toContain('streakData.currentStreak}');
	});

	it('har inget dolt block kvar', () => {
		expect(framstegPage).not.toContain('{#if false}');
	});

	it('visar inga milstolpar eller veckoräkning', () => {
		expect(framstegPage).not.toContain('milestones-card');
		expect(framstegPage).not.toContain('Det som långsamt kan växa fram');
		expect(framstegPage).not.toContain('weeklySummaryText');
		expect(framstegPage).not.toContain('incheckningar den här veckan');
		expect(framstegPage).not.toContain('Lugn överblick');
	});
});

describe('underliggande data behålls', () => {
	it('Framsteg hämtar fortfarande streak-endpointen', () => {
		expect(framstegPage).toContain("fetch('/api/diary/streak'");
	});

	it('streak-endpointen är orörd och svarar med samma fält', () => {
		const endpoint = readFileSync(
			new URL('./api/diary/streak/+server.ts', import.meta.url),
			'utf8'
		);
		expect(endpoint).toContain('currentStreak: number;');
		expect(endpoint).toContain('longestStreak: number;');
		expect(endpoint).toContain('lastEntryDate: string | null;');
		expect(endpoint).toContain('lastEntryDaysAgo: number;');
	});
});

describe('inga streak- eller milstolpshändelser till analys', () => {
	const analytics = readFileSync(new URL('../lib/analytics.ts', import.meta.url), 'utf8');

	it('analysmodulen saknar händelserna', () => {
		expect(analytics).not.toContain('streak_day_reached');
		expect(analytics).not.toContain('milestone_reached');
	});

	it('Framsteg anropar inga streak- eller milstolpsspårningar', () => {
		expect(framstegPage).not.toContain('trackStreakDayReached');
		expect(framstegPage).not.toContain('trackMilestoneReached');
	});
});
