// MittPsykes återkomst ska bygga på värde, kontinuitet och frivillighet - inte
// på streaks, prestation eller skuld över missade dagar (docs/NORTH_STAR.md,
// "Ingen skuld").
//
// Testet vaktar de två ytor en inloggad användare möter först: Mitt Hem och
// Framsteg. Det granskar renderad copy, inte kommentarer - kommentarerna
// förklarar med flit vad som togs bort och varför, och ska inte kunna få testet
// att falla.
//
// Neutral historik är inte det testet är emot. "Texter skrivna", "Dagar med
// avtryck" och "Den här veckan" beskriver vad som hänt utan att göra en obruten
// rad till ett resultat, och de assertas som kvarvarande nedan.

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

const dashboardPage = renderedSource('./dashboard/+page.svelte');
const dashboardServer = renderedSource('./dashboard/+page.server.ts');
const framstegPage = renderedSource('./framsteg/+page.svelte');

const SURFACES = [
	['Mitt Hem', dashboardPage],
	['Mitt Hem (server)', dashboardServer],
	['Framsteg', framstegPage]
] as const;

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

		it(`${name} uppmanar inte till obruten användning`, () => {
			const lowered = source.toLocaleLowerCase('sv-SE');
			for (const phrase of PRESSURE_PHRASES) {
				expect(lowered).not.toContain(phrase);
			}
		});
	}
});

describe('Mitt Hem efter ändringen', () => {
	it('renderar inte currentStreak', () => {
		expect(dashboardPage).not.toContain('progressPreview.currentStreak');
	});

	it('behåller de neutrala historiktalen', () => {
		expect(dashboardPage).toContain('{progressPreview.totalEntries}');
		expect(dashboardPage).toContain('<small>Texter skrivna</small>');
		expect(dashboardPage).toContain('{progressPreview.weeklyEntries}');
		expect(dashboardPage).toContain('<small>Den här veckan</small>');
	});

	it('bygger sammanfattningen ur den testade copymodulen', () => {
		expect(dashboardServer).toContain(
			"import { buildProgressSummary } from '$lib/dashboard-progress-summary'"
		);
		expect(dashboardServer).toContain('buildProgressSummary(weeklyEntries, totalEntries)');
	});

	it('säger inte längre att användaren hittat en rytm', () => {
		expect(dashboardServer).not.toContain('nära i tid');
		expect(dashboardServer).not.toContain('hittat en rytm');
		expect(dashboardServer).not.toContain('håller kontakt med dig själv');
	});
});

describe('Framsteg efter ändringen', () => {
	it('renderar inte currentStreak', () => {
		expect(framstegPage).not.toContain('streakData.currentStreak}');
	});

	it('behåller neutral historik som redan fanns', () => {
		expect(framstegPage).toContain('<span class="summary-stat-label">Dagar med avtryck</span>');
		expect(framstegPage).toContain('<span class="summary-stat-label">Den här veckan</span>');
		expect(framstegPage).toContain('Senaste gången du skrev');
	});

	it('pekar aldrig ut ett antal sammanhängande dagar som nästa steg', () => {
		expect(framstegPage).toContain(
			"milestonesData.nextMilestone.metric !== 'longestStreak'"
		);
		expect(framstegPage).toContain('{#if nextMilestone}');
		expect(framstegPage).not.toContain('{#if milestonesData.nextMilestone}');
	});

	it('mjukar fortfarande milstolpar som bygger på sammanhängande dagar', () => {
		// Uppnådda milstolpar får synas, men beskrivs som återkomst - inte som en
		// obruten rad. Regeln togs inte bort av den här ändringen.
		expect(framstegPage).toContain("if (milestone.metric === 'longestStreak')");
		expect(framstegPage).toContain("'Du har återvänt hit'");
	});
});

describe('underliggande data behålls', () => {
	it('Mitt Hem räknar fortfarande sammanhängande dagar och skickar med värdet', () => {
		expect(dashboardServer).toContain('function buildCurrentStreak(');
		expect(dashboardServer).toContain('const currentStreak = buildCurrentStreak(streakEntries)');
		expect(dashboardServer).toContain('currentStreak,');
	});

	it('Framsteg hämtar fortfarande streak-endpointen och använder den för senaste aktivitet', () => {
		expect(framstegPage).toContain("fetch('/api/diary/streak'");
		expect(framstegPage).toContain('streakData.lastEntryDaysAgo');
		expect(framstegPage).toContain('trackStreakDayReachedOnce');
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
