// Gemenskapens laddnings- och feltillstånd.
//
// Regressionen: när service role-nyckeln saknades eller databasen inte svarade
// returnerade laddaren en tom lista utan felflagga. Sidan visade då "Här kommer
// inlägg i Gemenskapen att visas", "Kommer i nästa steg" och två påhittade
// exempelinlägg, och även användarens egna delade inlägg försvann ur vyn.
//
// Testerna anropar den riktiga `load` med en mockad service role-klient och
// kontrollerar sedan att mallen bara når tomt läge när hämtningen lyckats.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COMMUNITY_LOAD_ERROR_MESSAGE } from '$lib/load-state';

type QueryError = { code?: string; message?: string };
type ListResult = { data: Record<string, unknown>[] | null; error: QueryError | null };
type CountResult = { count: number | null; error: QueryError | null };

const USER_ID = '00000000-0000-4000-8000-00000000000b';
const OTHER_USER_ID = '00000000-0000-4000-8000-00000000000a';
const CONNECTION_ERROR = { code: '08006', message: 'connection failure' };
const MISSING_TABLE = {
	code: 'PGRST205',
	message: "Could not find the table 'public.community_posts'"
};

let serviceAvailable = true;
let listResult: ListResult = { data: [], error: null };
let countResult: CountResult = { count: 0, error: null };

/** Service role-klient där räkningen och listan svarar med givna resultat. */
function serviceClient() {
	return {
		from() {
			let isCount = false;
			const builder = {
				select(_columns: string, options?: { count?: string; head?: boolean }) {
					isCount = options?.head === true;
					return builder;
				},
				is() {
					// Räknefrågan avslutas med is och måste då kunna inväntas.
					return isCount ? Promise.resolve(countResult) : builder;
				},
				order: () => builder,
				range: async () => listResult
			};
			return builder;
		}
	};
}

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: () => (serviceAvailable ? serviceClient() : null)
}));

const { load } = await import('./+page.server');

type LoadEvent = Parameters<typeof load>[0];
type LoadResult = {
	status: 'ready' | 'error';
	items: Record<string, unknown>[];
	totalItems: number;
};

async function runLoad() {
	const event = {
		locals: {
			supabase: { auth: { getUser: async () => ({ data: { user: { id: USER_ID } } }) } }
		},
		url: new URL('https://www.mittpsyke.se/dashboard/gemenskap')
	} as unknown as LoadEvent;
	return (await load(event)) as unknown as LoadResult;
}

const POSTS = [
	{
		id: 'p-other',
		content: 'Någon annans delade text',
		mood: null,
		created_at: '2026-10-23T10:00:00Z',
		diary_entry_id: 'd-other',
		user_id: OTHER_USER_ID
	},
	{
		id: 'p-own',
		content: 'Min delade text',
		mood: '6',
		created_at: '2026-10-22T10:00:00Z',
		diary_entry_id: 'd-own',
		user_id: USER_ID
	}
];

beforeEach(() => {
	serviceAvailable = true;
	listResult = { data: [], error: null };
	countResult = { count: 0, error: null };
});

describe('Gemenskapens laddare', () => {
	it('saknad service role-klient markeras som fel, inte som tomt flöde', async () => {
		serviceAvailable = false;
		const result = await runLoad();

		expect(result.status).toBe('error');
		expect(result.items).toEqual([]);
	});

	it('ett fel i räkningen markeras som fel', async () => {
		countResult = { count: null, error: CONNECTION_ERROR };
		listResult = { data: POSTS, error: null };
		const result = await runLoad();

		expect(result.status).toBe('error');
	});

	it('ett fel i listan markeras som fel', async () => {
		countResult = { count: 2, error: null };
		listResult = { data: null, error: CONNECTION_ERROR };
		const result = await runLoad();

		expect(result.status).toBe('error');
		expect(result.items).toEqual([]);
	});

	it('en saknad tabell räknas som tomt flöde, som tidigare', async () => {
		countResult = { count: null, error: MISSING_TABLE };
		listResult = { data: null, error: MISSING_TABLE };
		const result = await runLoad();

		expect(result.status).toBe('ready');
		expect(result.items).toEqual([]);
		expect(result.totalItems).toBe(0);
	});

	it('en lyckad hämtning utan inlägg är ett verkligt tomt flöde', async () => {
		const result = await runLoad();

		expect(result.status).toBe('ready');
		expect(result.items).toEqual([]);
	});

	it('en lyckad hämtning visar inläggen och skickar aldrig andras user_id', async () => {
		countResult = { count: 2, error: null };
		listResult = { data: POSTS, error: null };
		const result = await runLoad();

		expect(result.status).toBe('ready');
		expect(result.items.map((item) => item.id)).toEqual(['p-other', 'p-own']);
		expect(JSON.stringify(result)).not.toContain(OTHER_USER_ID);
		expect(result.items.find((item) => item.id === 'p-other')).toMatchObject({
			isOwnPost: false,
			diaryEntryId: null
		});
		expect(result.items.find((item) => item.id === 'p-own')).toMatchObject({
			isOwnPost: true,
			diaryEntryId: 'd-own'
		});
	});
});

// Mallens grenar läses direkt ur källan, som i dagbokens och inläggens test.
const source = readFileSync(
	join(process.cwd(), 'src/routes/dashboard/gemenskap/+page.svelte'),
	'utf8'
);
const template = source.slice(source.lastIndexOf('</script>'));

describe('Gemenskapens mall', () => {
	const errorStart = template.indexOf("{#if loadStatus === 'error'}");
	const feedBranch = template.indexOf('{:else if posts.length > 0}');
	const emptyText = template.indexOf('Här kommer inlägg i Gemenskapen att visas');
	const samplesGuard = template.indexOf("{#if loadStatus === 'ready' && posts.length === 0}");

	it('felgrenen prövas före flödet och tomt läge', () => {
		expect(errorStart).toBeGreaterThan(-1);
		expect(feedBranch).toBeGreaterThan(errorStart);
		expect(emptyText).toBeGreaterThan(feedBranch);
	});

	it('felrutan visar den fasta texten och en knapp för nytt försök', () => {
		const errorBranch = template.slice(errorStart, feedBranch);

		expect(errorBranch).toContain('{COMMUNITY_LOAD_ERROR_MESSAGE}');
		expect(errorBranch).toContain('onclick={retryLoadFeed}');
		expect(errorBranch).not.toMatch(/error\.message/);
		expect(COMMUNITY_LOAD_ERROR_MESSAGE).toBe(
			'Vi kunde inte hämta Gemenskapen just nu. Försök igen om en liten stund.'
		);
	});

	it('"Kommer i nästa steg" och exempelinläggen visas bara när hämtningen lyckats', () => {
		const future = template.indexOf('Kommer i nästa steg');
		const samples = template.indexOf('Exempel från Gemenskapen');

		expect(samplesGuard).toBeGreaterThan(emptyText);
		expect(future).toBeGreaterThan(samplesGuard);
		expect(samples).toBeGreaterThan(future);
		// Inget annat block får visa dem utan statuskontrollen.
		expect(template.match(/Kommer i nästa steg/g)).toHaveLength(1);
		expect(template.match(/Exempel från Gemenskapen/g)).toHaveLength(1);
		expect(template.slice(samplesGuard, samples)).not.toContain('{/if}');
	});

	it('nytt försök laddar om sidans data', () => {
		const start = source.indexOf('async function retryLoadFeed(');
		const body = source.slice(start, source.indexOf('\n\t}\n', start));

		expect(body).toContain('await invalidateAll()');
	});
});
