import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
	MAX_THEMES,
	MIN_LOCAL_DAYS_FOR_RETROSPECT,
	MIN_LOCAL_ENTRIES_FOR_RETROSPECT,
	buildLocalRetrospect,
	describeLocalTheme,
	excerptAround,
	normalizeWordForm
} from '$lib/diary-local-retrospect';
import type { LocalDiaryEntry } from '$lib/diary-local-history';
import { findForbiddenProgressPhrase } from '$lib/progress-language';

// Den lokala återblicken räknar återkommande ord i webbläsaren. Den ska visa
// hellre inget än ett svagt tema, aldrig tolka, och aldrig skicka något.

const DAY = 86_400_000;
const BASE = new Date('2026-09-10T20:00:00').getTime();

function entry(text: string, dayOffset: number, id = `e${dayOffset}-${text.length}`): LocalDiaryEntry {
	const at = BASE - dayOffset * DAY;
	return { id, createdAt: at, updatedAt: at, text };
}

describe('trösklar för att visa återblicken', () => {
	it('kräver minst tre inlägg', () => {
		const result = buildLocalRetrospect([
			entry('Sömnen var orolig i natt igen', 0),
			entry('Sömnen kom sent även i går', 1)
		]);

		expect(MIN_LOCAL_ENTRIES_FOR_RETROSPECT).toBe(3);
		expect(result.status).toBe('not-enough');
		expect(result.themes).toEqual([]);
	});

	it('kräver inlägg från minst två olika dagar', () => {
		const sameDay = [
			entry('Sömnen var orolig', 0, 'a'),
			entry('Sömnen igen, klarnade inte', 0, 'b'),
			entry('Sömnen tog tid', 0, 'c')
		];

		expect(MIN_LOCAL_DAYS_FOR_RETROSPECT).toBe(2);
		expect(buildLocalRetrospect(sameDay).status).toBe('not-enough');
	});

	it('räknar tomma inlägg som inget underlag', () => {
		const result = buildLocalRetrospect([
			entry('Sömnen var orolig', 0),
			entry('   ', 1, 'tom'),
			entry('Sömnen igen', 2)
		]);

		expect(result.entryCount).toBe(2);
		expect(result.status).toBe('not-enough');
	});

	it('ger återblick när tröskeln är nådd', () => {
		const result = buildLocalRetrospect([
			entry('Sömnen var orolig i natt', 0),
			entry('Tänkte på sömnen igen', 1),
			entry('Promenad i skogen, skönt', 2)
		]);

		expect(result.status).toBe('ready');
		expect(result.entryCount).toBe(3);
		expect(result.dayCount).toBe(3);
	});
});

describe('vilka ord som räknas', () => {
	const entries = [
		entry('Sömnen var orolig i natt och jag tänkte mycket på jobbet', 0),
		entry('Jobbet tog all energi i dag, sömnen blev sen', 1),
		entry('Promenad efter jobbet, lite lugnare i kroppen', 2)
	];

	it('räknar i hur många inlägg ordet förekommer, inte antal gånger', () => {
		const result = buildLocalRetrospect([
			entry('Sömnen, sömnen, sömnen igen', 0),
			entry('Sömnen var bättre', 1),
			entry('Ingenting särskilt att säga', 2)
		]);

		const theme = result.themes.find((item) => item.stem === 'sömn');
		expect(theme?.entryCount).toBe(2);
		expect(describeLocalTheme(theme!, result.entryCount)).toBe(
			'”Sömnen” förekommer i 2 av dina 3 senaste inlägg.'
		);
	});

	it('filtrerar bort stoppord, korta ord, siffror och tecken', () => {
		const result = buildLocalRetrospect([
			entry('Jag har inte kunnat sova, det var 3 timmar och mycket 100 % oro!!!', 0),
			entry('Jag har inte kunnat sova, det var mycket oro igen???', 1),
			entry('Jag har inte kunnat sova och det var mycket oro', 2)
		]);

		const stems = result.themes.map((theme) => theme.stem);
		for (const stopword of ['inte', 'mycket', 'det', 'har', 'jag', 'var']) {
			expect(stems, stopword).not.toContain(stopword);
		}
		expect(stems.some((stem) => /\d/.test(stem))).toBe(false);
		expect(stems.every((stem) => stem.length >= 4)).toBe(true);
		// Kvar finns de meningsbärande orden.
		expect(stems).toContain('sova');
	});

	it('räknar aldrig ett ord som bara finns i ett inlägg', () => {
		const result = buildLocalRetrospect([
			entry('Trädgården blommade fint', 0),
			entry('Sömnen var orolig', 1),
			entry('Sömnen var orolig igen', 2)
		]);

		expect(result.themes.map((theme) => theme.stem)).not.toContain('trädgård');
		expect(result.themes.map((theme) => theme.stem)).toContain('sömn');
	});

	it('kräver att temat finns på minst två olika dagar', () => {
		const result = buildLocalRetrospect([
			entry('Promenad i morse', 0, 'a'),
			entry('Promenad igen på kvällen', 0, 'b'),
			entry('Sömnen var orolig', 1, 'c')
		]);

		// Två inlägg men samma dag: inget tema.
		expect(result.status).toBe('no-theme');
	});

	it('slår ihop bestämd form och plural utan att slå ihop korta ord', () => {
		expect(normalizeWordForm('sömnen')).toBe('sömn');
		expect(normalizeWordForm('promenader')).toBe('promenad');
		expect(normalizeWordForm('jobbet')).toBe('jobb');
		// Korta ord lämnas som de är, så att olika ord inte blandas ihop.
		expect(normalizeWordForm('vilar')).toBe('vilar');
		expect(normalizeWordForm('oron')).toBe('oron');
	});

	it('visar den vanligaste skrivna formen som etikett', () => {
		const result = buildLocalRetrospect(entries);
		const theme = result.themes.find((item) => item.stem === 'jobb');
		expect(theme?.label).toBe('Jobbet');
	});

	it('visar högst tre teman, starkast först', () => {
		const many = [
			entry('Sömnen jobbet promenaden kaffet musiken', 0),
			entry('Sömnen jobbet promenaden kaffet musiken', 1),
			entry('Sömnen jobbet promenaden', 2)
		];

		const result = buildLocalRetrospect(many);
		expect(result.themes.length).toBeLessThanOrEqual(MAX_THEMES);
		expect(result.themes[0].entryCount).toBeGreaterThanOrEqual(
			result.themes[result.themes.length - 1].entryCount
		);
	});

	it('är deterministisk: samma inlägg ger samma återblick', () => {
		const first = buildLocalRetrospect(entries);
		const second = buildLocalRetrospect([...entries].reverse());

		expect(first.themes.map((theme) => theme.label)).toEqual(
			second.themes.map((theme) => theme.label)
		);
	});

	it('visar inget tema när underlaget är svagt', () => {
		const result = buildLocalRetrospect([
			entry('Ingenting särskilt hände', 0),
			entry('Regnet föll hela förmiddagen', 1),
			entry('Lagade soppa till middag', 2)
		]);

		expect(result.status).toBe('no-theme');
		expect(result.themes).toEqual([]);
	});
});

describe('underlaget pekar på rätt inlägg', () => {
	it('listar de inlägg ordet förekommer i, med datum och utdrag', () => {
		const entries = [
			entry('Sömnen var orolig i natt, vaknade flera gånger', 0, 'natt-1'),
			entry('Promenad i skogen på förmiddagen', 1, 'promenad-1'),
			entry('Sömnen kom sent men blev lugnare mot morgonen', 2, 'natt-2')
		];

		const result = buildLocalRetrospect(entries);
		const theme = result.themes.find((item) => item.stem === 'sömn');

		expect(theme?.occurrences.map((occurrence) => occurrence.entryId)).toEqual([
			'natt-1',
			'natt-2'
		]);
		expect(theme?.occurrences[0].updatedAt).toBe(entries[0].updatedAt);
		expect(theme?.occurrences[0].excerpt).toContain('Sömnen var orolig');
		expect(theme?.occurrences.some((occurrence) => occurrence.entryId === 'promenad-1')).toBe(false);
	});

	it('klipper utdraget runt ordet utan att ändra användarens text', () => {
		const long = `${'inledning '.repeat(20)}sömnen kom sent ${'avslutning '.repeat(20)}`;
		const excerpt = excerptAround(long, 'sömn');

		expect(excerpt).toContain('sömnen kom sent');
		expect(excerpt.length).toBeLessThan(long.length);
		expect(excerpt.startsWith('…')).toBe(true);
	});
});

describe('språk och integritet', () => {
	const source = readFileSync(join(process.cwd(), 'src/lib/diary-local-retrospect.ts'), 'utf8');
	const guestEntry = readFileSync(
		join(process.cwd(), 'src/lib/components/GuestQuickEntry.svelte'),
		'utf8'
	);

	it('genererar ingen diagnos, identitet eller orsak', () => {
		const result = buildLocalRetrospect([
			entry('Sömnen var orolig och oron kom tillbaka', 0),
			entry('Sömnen igen, oron också', 1),
			entry('Sömnen bättre men oron kvar', 2)
		]);

		expect(result.status).toBe('ready');
		for (const theme of result.themes) {
			const line = describeLocalTheme(theme, result.entryCount);
			expect(findForbiddenProgressPhrase(line), line).toBeNull();
			expect(line).toMatch(/förekommer/);
			expect(line).not.toMatch(/betyder|därför|eftersom|du är|orsak/i);
		}
	});

	it('använder observerande ord i rubrik och copy', () => {
		expect(guestEntry).toContain('Det som återkommer i dina ord');
		expect(guestEntry).toContain('Återblicken beräknas bara i den här webbläsaren.');
		expect(guestEntry).toContain(
			'Innehållet i dina texter skickas inte\n\t\t\t\t\tför att skapa återblicken.'
		);
		expect(guestEntry).toContain('Det finns ännu inget tydligt återkommande tema.');
		expect(guestEntry).toContain('Visa underlaget');
		expect(guestEntry).toContain('Öppna inlägget');
	});

	it('gör inga nätverksanrop och använder ingen AI', () => {
		// Kommentarerna nämner att modulen inte anropar API eller AI, så koden
		// granskas utan dem.
		const code = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, ' ');
		expect(code).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|supabase|\/api\/|openai/i);
		expect(code).not.toMatch(/track[A-Z]\w*\(/);

		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
		buildLocalRetrospect([
			entry('Sömnen var orolig', 0),
			entry('Sömnen igen', 1),
			entry('Sömnen bättre', 2)
		]);
		expect(fetchSpy).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	it('skickar ingen text till analytics från skrivytan', () => {
		// Befintliga event räknar bara längd/antal, aldrig innehåll.
		const eventCalls = guestEntry.match(/track\w+\(([^)]*)\)/g) ?? [];
		for (const call of eventCalls) {
			expect(call, call).not.toMatch(/localEntries|retrospect|theme|excerpt|item\.text/);
		}
	});

	it('ger ingen återblick när historiken är rensad', () => {
		const result = buildLocalRetrospect([]);
		expect(result.status).toBe('not-enough');
		expect(result.entryCount).toBe(0);
		expect(result.themes).toEqual([]);
	});

	it('lämnar den inloggade återblicken orörd', () => {
		const progressAnalysis = readFileSync(
			join(process.cwd(), 'src/lib/server/progress-analysis.ts'),
			'utf8'
		);
		expect(progressAnalysis).not.toContain('diary-local-retrospect');
		expect(source).not.toContain('progress-analysis');
	});
});
