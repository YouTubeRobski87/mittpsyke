import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDiaryProgressView } from '$lib/diary-progress';

// Ett nätverksfel får aldrig se ut som frånvaro av data. Beräkningen kan inte
// själv veta skillnaden - den räknar på det den får - så komponenten håller reda
// på vilka källor som faktiskt svarade. Testerna nedan låser båda halvorna:
// dels vad beräkningen gör med saknad data, dels att komponenten inte visar tal
// eller tomt läge för en källa som inte svarat.

const NOW = new Date('2026-08-15T10:00:00+02:00');
const source = readFileSync(
	join(process.cwd(), 'src/lib/components/DiaryMoodTimeline.svelte'),
	'utf8'
);

describe('beräkningen vid saknad källa', () => {
	it('utan heatmap blir skrivdagar 0, vilket inte får presenteras som ett svar', () => {
		const result = buildDiaryProgressView({
			samples: [
				{ date: '2026-08-14', mood: 7 },
				{ date: '2026-08-12', mood: 6 }
			],
			heatmapData: null,
			period: 30,
			now: NOW
		});

		// Talet är 0 här, och just därför måste komponenten dölja rutan när
		// heatmap-källan inte svarat.
		expect(result.entryDays).toBe(0);
		expect(result.moodDays).toBe(2);
		expect(result.summary).toContain('inte tillräckligt många registrerade dagar');
	});

	it('utan humörkällan påstås ingen trend', () => {
		const result = buildDiaryProgressView({
			samples: [],
			heatmapData: { '2026-08-14': 1, '2026-08-13': 2, '2026-08-10': 1 },
			period: 30,
			now: NOW
		});

		expect(result.entryDays).toBe(3);
		expect(result.moodDays).toBe(0);
		expect(result.hasChart).toBe(false);
		expect(result.trend.text).toBeNull();
	});
});

describe('komponenten skiljer "inget svar" från "ingen data"', () => {
	it('spårar varje källa separat', () => {
		expect(source).toContain('let moodLoaded = $state(false)');
		expect(source).toContain('let entriesLoaded = $state(false)');
	});

	it('sätter flaggan först när svaret gick fram', () => {
		expect(source).toContain('if (timelineResponse.ok)');
		expect(source).toContain('if (heatmapResponse.ok)');
		// Ingen tilldelning av data utanför ok-grenarna.
		expect(source).not.toMatch(/samples = toMoodSamples[^\n]*\n\s*heatmapData =/);
	});

	it('påstår tomt läge bara när båda källorna svarat', () => {
		expect(source).toMatch(/isEmptyPeriod = \$derived\(\s*moodLoaded && entriesLoaded/);
	});

	it('visar varje tal bara när dess egen källa svarat', () => {
		expect(source).toContain('{#if entriesLoaded}');
		expect(source).toContain('{#if moodLoaded}');
	});

	it('visar sammanfattningen bara med heatmap-källan', () => {
		const summaryBlock = source.slice(
			source.indexOf('<!-- Sammanfattningen räknar skrivdagar'),
			source.indexOf('class="timeline-summary"') + 60
		);

		expect(summaryBlock).toContain('{#if entriesLoaded}');
	});

	it('kräver humörkällan för både kurva och trendrad', () => {
		expect(source).toContain('hasChart={moodLoaded && overview.hasChart && !isEmptyPeriod}');
		expect(source).toContain('{#if moodLoaded && overview.trend.text}');
	});

	it('behåller senast kända tal när en omhämtning misslyckas', () => {
		// Inga nollställningar i catch-grenen, och ingen tilldelning av tom data
		// innan anropen görs.
		const loadBody = source.slice(
			source.indexOf('async function loadOverview()'),
			source.indexOf('onMount(')
		);

		expect(loadBody).not.toContain('samples = []');
		expect(loadBody).not.toContain('heatmapData = null');
		expect(loadBody).toContain('catch {');
		expect(loadBody).toContain('loadError = LOAD_ERROR_COPY');
	});

	it('visar en lågmäld rad när ingen källa svarade', () => {
		expect(source).toContain('{:else if !hasAnySource}');
		expect(source).toContain('{loadError || LOAD_ERROR_COPY}');
	});

	it('laddningstexten ersätter inte redan hämtade tal vid omhämtning', () => {
		expect(source).toContain('{#if loading && !hasAnySource}');
	});
});

describe('hämtningen sker en gång per tillfälle', () => {
	it('laddar en gång vid mount, utan effekt som speglar entries', () => {
		const mountBlock = source.slice(source.indexOf('onMount('));
		const loadCalls = mountBlock.match(/loadOverview\(\)/g) ?? [];

		// En i onMount och en i händelsehanteraren, inget mer.
		expect(loadCalls).toHaveLength(2);
		expect(source).not.toContain('$effect(');
	});

	it('lyssnar på den delade signalen och städar upp lyssnaren', () => {
		expect(source).toContain('addEventListener(DIARY_ENTRIES_CHANGED_EVENT');
		expect(source).toContain('removeEventListener(DIARY_ENTRIES_CHANGED_EVENT');
	});
});
