// En länk från Framsteg till en anteckning i Dagboken.
//
// Testerna anropar den riktiga `load` med en mockad Supabase-klient. De tre
// fallen: anteckningen finns redan i listan, den ligger längre bak och hämtas
// för sig, eller den går inte att hämta. Mallen kontrolleras i källkoden,
// eftersom sidan inte går att serverrendera som inloggad.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LINKED_ENTRY_MISSING_MESSAGE } from '$lib/diary-entry-link';
import { load } from './+page.server';

const USER_ID = 'user-1';

type Row = Record<string, unknown>;
type Filter = [string, unknown];

const LIST_ROWS: Row[] = [
	{ id: 'e2', text: 'Nyast', created_at: '2026-10-20T10:00:00Z', tags: [] },
	{ id: 'e1', text: 'Äldre', created_at: '2026-10-10T10:00:00Z', tags: [] }
];

/**
 * Supabase-klient där listan svarar med `listRows` och en enskild rad hämtas
 * ur `singleRows`. Varje filter på den enskilda hämtningen sparas i `filters`.
 */
function supabaseWith(options: {
	listRows?: Row[];
	listError?: { code: string } | null;
	singleRows?: Row[];
	singleError?: { code: string } | null;
}) {
	const filters: Filter[][] = [];
	const client = {
		auth: { getUser: async () => ({ data: { user: { id: USER_ID } } }) },
		from() {
			const applied: Filter[] = [];
			const builder = {
				select: () => builder,
				eq: (column: string, value: unknown) => {
					applied.push([column, value]);
					return builder;
				},
				order: () => builder,
				limit: async () => ({ data: options.listError ? null : (options.listRows ?? LIST_ROWS), error: options.listError ?? null }),
				maybeSingle: async () => {
					filters.push(applied);
					if (options.singleError) return { data: null, error: options.singleError };
					const id = applied.find(([column]) => column === 'id')?.[1];
					const userId = applied.find(([column]) => column === 'user_id')?.[1];
					const row = (options.singleRows ?? []).find((item) => item.id === id && userId === USER_ID);
					return { data: row ?? null, error: null };
				}
			};
			return builder;
		}
	};
	return { client, filters };
}

type LoadEvent = Parameters<typeof load>[0];
type LoadResult = {
	entriesStatus: 'ready' | 'error';
	linkedEntry:
		| { status: 'none' }
		| { status: 'missing' }
		| { status: 'found'; entry: { id: string; content: string } };
};

async function runLoad(search: string, supabase: ReturnType<typeof supabaseWith>['client']) {
	const event = {
		locals: { supabase },
		url: new URL(`https://mittpsyke.se/dagbok/checkin${search}`)
	} as unknown as LoadEvent;
	return (await load(event)) as unknown as LoadResult;
}

describe('länkad anteckning i dagbokens laddare', () => {
	it('utan länk visas inget extra och ingen rad hämtas', async () => {
		const { client, filters } = supabaseWith({});
		const result = await runLoad('', client);

		expect(result.linkedEntry).toEqual({ status: 'none' });
		expect(filters).toHaveLength(0);
	});

	it('en anteckning som redan finns i listan hämtas inte igen', async () => {
		const { client, filters } = supabaseWith({});
		const result = await runLoad('?anteckning=e1', client);

		expect(result.linkedEntry).toMatchObject({ status: 'found', entry: { id: 'e1', content: 'Äldre' } });
		expect(filters).toHaveLength(0);
	});

	it('en äldre anteckning hämtas för sig, begränsad till användarens egna rader', async () => {
		const { client, filters } = supabaseWith({
			singleRows: [{ id: 'old-1', text: 'Från i våras', created_at: '2026-04-02T10:00:00Z', tags: [] }]
		});
		const result = await runLoad('?anteckning=old-1', client);

		expect(result.linkedEntry).toMatchObject({ status: 'found', entry: { id: 'old-1', content: 'Från i våras' } });
		expect(filters).toEqual([
			[
				['id', 'old-1'],
				['user_id', USER_ID]
			]
		]);
	});

	it('en anteckning som inte går att hitta ger en lugn rad, inget fel för listan', async () => {
		const { client } = supabaseWith({ singleRows: [] });
		const result = await runLoad('?anteckning=borta', client);

		expect(result.linkedEntry).toEqual({ status: 'missing' });
		expect(result.entriesStatus).toBe('ready');
	});

	it('ett läsfel för den enskilda raden ger samma lugna rad', async () => {
		const { client } = supabaseWith({ singleError: { code: '08006' } });
		const result = await runLoad('?anteckning=old-1', client);

		expect(result.linkedEntry).toEqual({ status: 'missing' });
		expect(result.entriesStatus).toBe('ready');
	});

	it('ett ogiltigt id i länken ignoreras och skickas aldrig till databasen', async () => {
		const { client, filters } = supabaseWith({});
		const result = await runLoad('?anteckning=%3Cscript%3E', client);

		expect(result.linkedEntry).toEqual({ status: 'none' });
		expect(filters).toHaveLength(0);
	});

	it('när listan inte gick att läsa visas felet, inte en "hittar inte"-rad', async () => {
		const { client, filters } = supabaseWith({ listError: { code: '08006' } });
		const result = await runLoad('?anteckning=old-1', client);

		expect(result.entriesStatus).toBe('error');
		expect(result.linkedEntry).toEqual({ status: 'none' });
		expect(filters).toHaveLength(0);
	});
});

describe('länkad anteckning i dagbokens mall', () => {
	const page = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

	it('visar en äldre anteckning för sig överst, med väg tillbaka', () => {
		const separate = page.slice(page.indexOf('data-testid="linked-entry"'), page.indexOf('data-testid="linked-entry-missing"'));
		expect(separate).toContain('Anteckningen du öppnade från Framsteg');
		expect(separate).toContain('href="/framsteg"');
	});

	it('säger lugnt att anteckningen inte hittas, utan att gissa varför', () => {
		expect(LINKED_ENTRY_MISSING_MESSAGE).toBe('Vi hittar inte den anteckningen just nu.');
		expect(LINKED_ENTRY_MISSING_MESSAGE).not.toMatch(/radera|borttag|ta bort/i);
		expect(page).toContain('{LINKED_ENTRY_MISSING_MESSAGE}');
	});

	it('ger varje anteckning i listan ett id att skrolla till', () => {
		expect(page).toContain('id={diaryEntryElementId(entry.id)}');
	});
});
