import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// $lib/state/diary drar in $lib/supabase, som skapar sin klient vid import och
// kastar utan PUBLIC_SUPABASE_*-variabler. Här testas bara sidberäkningen.
vi.mock('$lib/supabase', () => ({ supabase: {} }));

const { pageAfterLoadingMore } = await import('$lib/state/diary');

const source = readFileSync(
	join(process.cwd(), 'src/routes/dagbok/checkin/+page.svelte'),
	'utf8'
);

const ENTRIES_PER_PAGE = 10;

/** Index (0-baserat) för inläggen som syns på en listsida. */
function visibleRange(page: number) {
	const start = (page - 1) * ENTRIES_PER_PAGE;
	return { start, end: start + ENTRIES_PER_PAGE };
}

describe('dagboken: "Visa fler inlägg"', () => {
	// Regression: med 20 laddade inlägg stod användaren på "Sida 1 av 2" när
	// knappen klickades. Nya inlägg lades till på sida 3-4, och listan som
	// syntes var oförändrad.
	it('visar första nyhämtade inlägget direkt efter klick', () => {
		const previousCount = 20;
		const page = pageAfterLoadingMore(previousCount, 40, ENTRIES_PER_PAGE, 1);
		const { start, end } = visibleRange(page);

		expect(page).toBe(3);
		expect(previousCount).toBeGreaterThanOrEqual(start);
		expect(previousCount).toBeLessThan(end);
	});

	it('hamnar rätt även när laddat antal inte är jämnt delbart med sidstorleken', () => {
		const previousCount = 25;
		const page = pageAfterLoadingMore(previousCount, 31, ENTRIES_PER_PAGE, 1);
		const { start, end } = visibleRange(page);

		expect(previousCount).toBeGreaterThanOrEqual(start);
		expect(previousCount).toBeLessThan(end);
	});

	it('behåller nuvarande sida när inga nya inlägg kom', () => {
		expect(pageAfterLoadingMore(20, 20, ENTRIES_PER_PAGE, 2)).toBe(2);
		expect(pageAfterLoadingMore(20, 18, ENTRIES_PER_PAGE, 2)).toBe(2);
	});

	it('kraschar inte på en ogiltig sidstorlek', () => {
		expect(pageAfterLoadingMore(20, 40, 0, 1)).toBe(1);
	});

	it('sidan byter listsida efter lyckad hämtning', () => {
		const start = source.indexOf('async function loadMoreEntries');
		const body = source.slice(start, source.indexOf('\n\t}\n', start));

		expect(start).toBeGreaterThan(-1);
		expect(body).toMatch(/currentPage\s*=\s*pageAfterLoadingMore\(/);
	});
});
