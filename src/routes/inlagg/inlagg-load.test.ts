// Inläggssidans laddnings- och feltillstånd.
//
// Regressionen: när databasen inte svarade returnerade laddaren tomma rader och
// `total: 0`, och sidan visade "0 sparade dagboksrader" och "Du har inga inlägg
// än". Ett läsfel får aldrig se ut som att anteckningarna är borta.
//
// Testerna anropar den riktiga `load` med en mockad Supabase-klient och
// kontrollerar sedan att mallen bara visar tomt läge och räknare vid `ready`.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NOTES_LOAD_ERROR_MESSAGE } from '$lib/load-state';
import { load } from './+page.server';

type QueryError = { code?: string; message?: string };
type ListResult = { data: Record<string, unknown>[] | null; error: QueryError | null };
type CountResult = { count: number | null; error: QueryError | null };

const CONNECTION_ERROR = { code: '08006', message: 'connection failure' };

type Calls = { range: [number, number][] };

/** Supabase-klient där listan och räkningen svarar med givna resultat. */
function supabaseWith(list: ListResult, count: CountResult, calls: Calls = { range: [] }) {
	return {
		auth: {
			getUser: async () => ({ data: { user: { id: 'user-1' } } })
		},
		from() {
			let isCount = false;
			const builder = {
				select(_columns: string, options?: { count?: string; head?: boolean }) {
					isCount = options?.head === true;
					return builder;
				},
				eq() {
					// Räknefrågan avslutas med eq och måste då kunna inväntas.
					return isCount ? Promise.resolve(count) : builder;
				},
				order: () => builder,
				range: async (from: number, to: number) => {
					calls.range.push([from, to]);
					return list;
				}
			};
			return builder;
		}
	};
}

type LoadEvent = Parameters<typeof load>[0];
type LoadResult = {
	status: 'ready' | 'error';
	entries: { id: string; title: string }[];
	page: number;
	totalPages: number;
	total: number;
};

async function runLoad(list: ListResult, count: CountResult, search = '', calls?: Calls) {
	const event = {
		locals: { supabase: supabaseWith(list, count, calls) },
		url: new URL(`https://www.mittpsyke.se/inlagg${search}`)
	} as unknown as LoadEvent;
	return (await load(event)) as unknown as LoadResult;
}

const OK_LIST: ListResult = {
	data: [
		{
			id: 'e1',
			text: 'En lugn kväll.',
			mood: null,
			tags: [],
			prompt_question: null,
			created_at: '2026-10-01T10:00:00Z'
		}
	],
	error: null
};

describe('inläggens laddare', () => {
	it('ett fel i listan markeras som fel, inte som inga inlägg', async () => {
		const result = await runLoad({ data: null, error: CONNECTION_ERROR }, { count: 12, error: null });

		expect(result.status).toBe('error');
		expect(result.entries).toEqual([]);
	});

	it('ett fel i räkningen markeras som fel, inte som 0 sparade rader', async () => {
		const result = await runLoad(OK_LIST, { count: null, error: CONNECTION_ERROR });

		expect(result.status).toBe('error');
	});

	it('en lyckad hämtning utan rader är en verkligt tom lista', async () => {
		const result = await runLoad({ data: [], error: null }, { count: 0, error: null });

		expect(result.status).toBe('ready');
		expect(result.entries).toEqual([]);
		expect(result.total).toBe(0);
	});

	it('en lyckad hämtning returnerar inläggen och antalet', async () => {
		const result = await runLoad(OK_LIST, { count: 41, error: null });

		expect(result.status).toBe('ready');
		expect(result.entries.map((entry) => entry.title)).toEqual(['En lugn kväll']);
		expect(result.total).toBe(41);
		expect(result.totalPages).toBe(3);
	});

	it.each(['?page=abc', '?page=-3', '?page=0', '?page=', ''])(
		'ogiltig sidparameter %s ger sida 1',
		async (search) => {
			const calls: Calls = { range: [] };
			const result = await runLoad(OK_LIST, { count: 1, error: null }, search, calls);

			expect(result.page).toBe(1);
			expect(calls.range).toEqual([[0, 19]]);
		}
	);

	it('en giltig sidparameter hämtar rätt intervall', async () => {
		const calls: Calls = { range: [] };
		const result = await runLoad(OK_LIST, { count: 50, error: null }, '?page=2', calls);

		expect(result.page).toBe(2);
		expect(calls.range).toEqual([[20, 39]]);
	});
});

// Mallens grenar läses direkt ur källan, som i dagbokens test.
const source = readFileSync(join(process.cwd(), 'src/routes/inlagg/+page.svelte'), 'utf8');
const template = source.slice(source.lastIndexOf('</script>'));

describe('inläggens mall', () => {
	const errorStart = template.indexOf("{#if data.status === 'error'}");
	const emptyBranch = template.indexOf('{:else if data.entries.length === 0}');
	const emptyText = template.indexOf('Du har inga inlägg än');

	it('felgrenen prövas före tomt läge', () => {
		expect(errorStart).toBeGreaterThan(-1);
		expect(emptyBranch).toBeGreaterThan(errorStart);
		expect(emptyText).toBeGreaterThan(emptyBranch);
	});

	it('felrutan visar den fasta texten och en knapp för nytt försök', () => {
		const errorBranch = template.slice(errorStart, emptyBranch);

		expect(errorBranch).toContain('{NOTES_LOAD_ERROR_MESSAGE}');
		expect(errorBranch).toContain('onclick={retry}');
		expect(errorBranch).not.toMatch(/error\.message/);
		expect(NOTES_LOAD_ERROR_MESSAGE).toContain('Det betyder inte att de har raderats.');
	});

	it('räknaren visas bara när hämtningen lyckats', () => {
		expect(template).toMatch(
			/\{#if data\.status === 'ready'\}\s*<p class="lead">\{data\.total\} sparade dagboksrader<\/p>\s*\{\/if\}/
		);
	});
});
