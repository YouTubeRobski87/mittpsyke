import { describe, expect, it } from 'vitest';
import {
	MIN_WEEK_SAMPLES,
	buildWeekSummary,
	splitWeekWindows,
	WEEK_WINDOW_DAYS
} from '$lib/progress-week-summary';
import type { MoodSample } from '$lib/progress-recent-period';

// Fast "nu" så testerna inte glider med kalendern.
const NOW = new Date('2026-09-05T09:00:00+02:00');

const sample = (date: string, mood: number): MoodSample => ({ date, mood });

describe('veckofönstren', () => {
	it('täcker sju kalenderdagar inklusive idag', () => {
		const { recentStart, end, previousStart, previousEnd } = splitWeekWindows([], NOW);
		expect(end).toBe('2026-09-05');
		expect(recentStart).toBe('2026-08-30');
		expect(previousEnd).toBe('2026-08-29');
		expect(previousStart).toBe('2026-08-23');
	});

	it('lägger fönstren kant i kant utan överlapp eller glapp', () => {
		const { recentStart, previousEnd } = splitWeekWindows([], NOW);
		const previousDay = new Date(`${recentStart}T12:00:00Z`);
		previousDay.setUTCDate(previousDay.getUTCDate() - 1);
		expect(previousEnd).toBe(previousDay.toISOString().slice(0, 10));
	});

	// Sommartiden i Sverige upphör sista söndagen i oktober. Ett fönster som
	// räknas med millisekunder glider ett dygn här; kalenderdatum gör inte det.
	it('håller sju dagar även över höstens tidsomställning', () => {
		const dstNow = new Date('2026-10-27T09:00:00+01:00');
		const { recentStart, end } = splitWeekWindows([], dstNow);
		expect(end).toBe('2026-10-27');
		expect(recentStart).toBe('2026-10-21');
	});

	it('placerar en registrering på fönstrets första dag i det senaste fönstret', () => {
		const { recent, previous } = splitWeekWindows([sample('2026-08-30', 6)], NOW);
		expect(recent).toHaveLength(1);
		expect(previous).toHaveLength(0);
	});

	it('placerar dagen före fönstret i föregående fönster', () => {
		const { recent, previous } = splitWeekWindows([sample('2026-08-29', 6)], NOW);
		expect(recent).toHaveLength(0);
		expect(previous).toHaveLength(1);
	});
});

describe('för lite underlag', () => {
	it('påstår ingen riktning utan registreringar', () => {
		const result = buildWeekSummary([], NOW);
		expect(result.insufficient).toBe(true);
		expect(result.comparison).toBe('unknown');
		expect(result.comparisonText).toBeNull();
	});

	// Del 35: saknad registrering är saknad data, inte ett sämre mående.
	it('säger uttryckligen att tomma dagar inte betyder något om måendet', () => {
		expect(buildWeekSummary([], NOW).summary).toContain(
			'Dagar utan registrering säger ingenting om hur du haft det.'
		);
	});

	it('beskriver ingen riktning strax under tröskeln', () => {
		const samples = Array.from({ length: MIN_WEEK_SAMPLES - 1 }, (_, index) =>
			sample(`2026-09-0${index + 1}`, 6)
		);
		const result = buildWeekSummary(samples, NOW);
		expect(result.insufficient).toBe(true);
		expect(result.summary).toContain('räcker ännu inte');
	});

	it('hanterar null utan att kasta', () => {
		expect(buildWeekSummary(null, NOW).insufficient).toBe(true);
	});
});

describe('jämförelse mot föregående vecka', () => {
	const recentWeek = [sample('2026-09-01', 7), sample('2026-09-03', 7), sample('2026-09-05', 7)];

	it('avstår från jämförelse när föregående vecka är för tunn', () => {
		const result = buildWeekSummary([...recentWeek, sample('2026-08-25', 4)], NOW);
		expect(result.insufficient).toBe(false);
		expect(result.comparison).toBe('unknown');
		expect(result.comparisonText).toBeNull();
	});

	it('beskriver en högre vecka försiktigt', () => {
		const result = buildWeekSummary(
			[...recentWeek, sample('2026-08-24', 4), sample('2026-08-26', 4), sample('2026-08-28', 4)],
			NOW
		);
		expect(result.comparison).toBe('higher');
		expect(result.comparisonText).toBe('Registreringarna ligger något högre än veckan innan.');
	});

	it('beskriver en lägre vecka utan dramatik', () => {
		const result = buildWeekSummary(
			[
				sample('2026-09-01', 4),
				sample('2026-09-03', 4),
				sample('2026-09-05', 4),
				sample('2026-08-24', 7),
				sample('2026-08-26', 7),
				sample('2026-08-28', 7)
			],
			NOW
		);
		expect(result.comparison).toBe('lower');
		expect(result.comparisonText).toBe('Registreringarna ligger något lägre än veckan innan.');
	});

	it('kallar en liten skillnad ungefär samma nivå', () => {
		const result = buildWeekSummary(
			[
				sample('2026-09-01', 6),
				sample('2026-09-03', 6),
				sample('2026-09-05', 6),
				sample('2026-08-24', 6),
				sample('2026-08-26', 6),
				sample('2026-08-28', 5)
			],
			NOW
		);
		expect(result.comparison).toBe('similar');
	});

	it('uttrycker aldrig förändringen i procent', () => {
		const result = buildWeekSummary(
			[...recentWeek, sample('2026-08-24', 4), sample('2026-08-26', 4), sample('2026-08-28', 4)],
			NOW
		);
		expect(result.comparisonText).not.toMatch(/%|procent/i);
		expect(result.summary).not.toMatch(/%|procent/i);
	});
});

describe('kontexttal', () => {
	it('räknar registreringar och dagar var för sig', () => {
		const result = buildWeekSummary(
			[sample('2026-09-05', 6), sample('2026-09-05', 8), sample('2026-09-04', 7)],
			NOW
		);
		expect(result.checkInCount).toBe(3);
		expect(result.activeDays).toBe(2);
	});

	it('räknar inte in registreringar utanför fönstret', () => {
		const result = buildWeekSummary(
			[sample('2026-09-05', 6), sample('2026-09-04', 7), sample('2026-09-03', 7), sample('2026-01-01', 9)],
			NOW
		);
		expect(result.checkInCount).toBe(3);
	});

	it('håller fönsterlängden på sju dagar', () => {
		expect(WEEK_WINDOW_DAYS).toBe(7);
	});
});
