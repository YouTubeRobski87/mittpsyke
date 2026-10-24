// Framstegs laddnings- och feltillstånd.
//
// Regressionen: när antalet sparade inlägg inte kunde läsas blev det 0, och
// sidan visade "Din utveckling börjar här" som om användaren aldrig skrivit
// något. Ett läsfel får aldrig se ut som att anteckningarna är borta.
//
// Testerna anropar den riktiga `load` med en mockad Supabase-klient. Övriga
// laddare, som inte rör räkningen, ersätts med neutrala svar.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { PROGRESS_LOAD_ERROR_MESSAGE } from '$lib/load-state';
import { loadDiaryEntryCount, loadDiaryEntryCountResult } from '$lib/server/diary-entry-count';

vi.mock('$lib/server/companion-presence', () => ({
	getCompanionRelationshipStageForUser: async () => 0
}));
vi.mock('$lib/server/companion-daily-question', () => ({
	loadCompanionDailyState: async () => null
}));
vi.mock('$lib/server/creative-moments', () => ({
	loadCreativeMomentCount: async () => 0
}));
vi.mock('$lib/server/diary-activity-days', () => ({
	loadDiaryActivityDays: async () => ({})
}));
vi.mock('$lib/server/evening-checkin', () => ({
	loadEveningPatternRows: async () => []
}));
vi.mock('$lib/server/world-progress', () => ({
	syncWorldProgress: async () => null
}));

const { load } = await import('./+page.server');

type CountResult = { count: number | null; error: { code?: string; message?: string } | null };

const CONNECTION_ERROR = { code: '08006', message: 'connection failure' };

/** Supabase-klient där räkningen av diary svarar med givet resultat. */
function supabaseWith(count: CountResult, user: { id: string } | null = { id: 'user-1' }) {
	const query = {
		select: () => query,
		eq: async () => count
	};
	return {
		auth: {
			getUser: async () => ({ data: { user: user ? { ...user, user_metadata: {} } : null } })
		},
		from: () => query
	};
}

type LoadEvent = Parameters<typeof load>[0];
type LoadResult = { entriesStatus: 'ready' | 'error'; entryCount: number; isAnonymous: boolean };

async function runLoad(count: CountResult, user?: { id: string } | null) {
	const event = { locals: { supabase: supabaseWith(count, user) } } as unknown as LoadEvent;
	return (await load(event)) as unknown as LoadResult;
}

describe('Framstegs laddare', () => {
	it('ett fel i räkningen markeras som fel, inte som noll inlägg', async () => {
		const result = await runLoad({ count: null, error: CONNECTION_ERROR });

		expect(result.entriesStatus).toBe('error');
		expect(result.entryCount).toBe(0);
	});

	it('en lyckad räkning utan rader är verkligt tom', async () => {
		const result = await runLoad({ count: 0, error: null });

		expect(result.entriesStatus).toBe('ready');
		expect(result.entryCount).toBe(0);
	});

	it('en lyckad räkning returnerar antalet', async () => {
		const result = await runLoad({ count: 7, error: null });

		expect(result.entriesStatus).toBe('ready');
		expect(result.entryCount).toBe(7);
	});

	it('en anonym besökare får ready, eftersom inget har lästs', async () => {
		const result = await runLoad({ count: null, error: CONNECTION_ERROR }, null);

		expect(result.isAnonymous).toBe(true);
		expect(result.entriesStatus).toBe('ready');
	});
});

describe('räknefunktionen med status', () => {
	const failing = supabaseWith({ count: null, error: CONNECTION_ERROR });

	it('skiljer läsfel från noll', async () => {
		expect(await loadDiaryEntryCountResult(failing as never, 'user-1')).toEqual({
			count: 0,
			status: 'error'
		});
	});

	it('den gamla funktionen beter sig som förut för startsidan', async () => {
		expect(await loadDiaryEntryCount(failing as never, 'user-1')).toBe(0);
	});
});

// Mallens grenar läses direkt ur källan, som i dagbokens och inläggens test.
const source = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');
const template = source.slice(source.lastIndexOf('</script>'));

describe('Framstegs mall', () => {
	const errorBranch = template.indexOf('{:else if !isAnonymous && entriesLoadFailed}');
	const emptyBranch = template.indexOf('{:else if !isAnonymous && entryCount === 0');

	it('felrutan kommer före tomt läge, så att tomt läge aldrig visas vid läsfel', () => {
		expect(errorBranch).toBeGreaterThan(-1);
		expect(emptyBranch).toBeGreaterThan(errorBranch);
	});

	it('felrutan visar den fasta texten och en knapp för att försöka igen', () => {
		const errorBlock = template.slice(errorBranch, emptyBranch);

		expect(errorBlock).toContain('{PROGRESS_LOAD_ERROR_MESSAGE}');
		expect(errorBlock).toContain('onclick={retryEntriesLoad}');
		expect(errorBlock).not.toContain('Din utveckling börjar här');
	});

	it('texten lovar inte att inget har raderats', () => {
		expect(PROGRESS_LOAD_ERROR_MESSAGE).toContain('Det betyder inte att');
		expect(PROGRESS_LOAD_ERROR_MESSAGE).not.toMatch(/inget har raderats/i);
	});

	it('retry laddar om serverdata', () => {
		const retry = source.slice(source.indexOf('async function retryEntriesLoad()'));
		expect(retry.slice(0, 200)).toContain('await invalidateAll();');
	});
});
