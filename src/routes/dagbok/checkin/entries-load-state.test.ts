// Dagbokens laddnings- och feltillstånd.
//
// Regressionen: när databasen inte svarade returnerade laddaren `entries: []`
// utan någon felflagga, och sidan visade "Din dagbok börjar här" och "Skriv
// första inlägget". För en användare med många anteckningar såg det ut som att
// allt var borta. Ett läsfel får aldrig se ut som en tom dagbok.
//
// Testerna anropar den riktiga `load` med en mockad Supabase-klient och
// kontrollerar sedan att mallen bara når tomt läge när hämtningen lyckats.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	NOTES_LOAD_ERROR_MESSAGE,
	initialLoadState,
	loadStateAfterClientFetch
} from '$lib/load-state';
import { load } from './+page.server';

type QueryResult = {
	data: Record<string, unknown>[] | null;
	error: { code?: string; message?: string } | null;
};

const USER_ID = 'user-1';

const MISSING_TABLE = { code: 'PGRST205', message: "Could not find the table 'public.diary'" };
const CONNECTION_ERROR = { code: '08006', message: 'connection failure' };

/** Supabase-klient där varje tabell svarar med ett givet resultat. */
function supabaseWith(tables: Record<string, QueryResult>) {
	return {
		auth: {
			getUser: async () => ({ data: { user: { id: USER_ID } } })
		},
		from(table: string) {
			const result = tables[table] ?? { data: null, error: CONNECTION_ERROR };
			const builder = {
				select: () => builder,
				eq: () => builder,
				order: () => builder,
				limit: async () => result
			};
			return builder;
		}
	};
}

type LoadEvent = Parameters<typeof load>[0];
type LoadResult = {
	entries: { id: string; content: string }[];
	entriesStatus: 'ready' | 'error';
};

async function runLoad(tables: Record<string, QueryResult>) {
	const event = { locals: { supabase: supabaseWith(tables) } } as unknown as LoadEvent;
	return (await load(event)) as unknown as LoadResult;
}

describe('dagbokens laddare', () => {
	it('markerar ett databasfel som fel, inte som en tom dagbok', async () => {
		const result = await runLoad({ diary: { data: null, error: CONNECTION_ERROR } });

		expect(result.entriesStatus).toBe('error');
	});

	it('en lyckad hämtning utan rader är en verkligt tom dagbok', async () => {
		const result = await runLoad({ diary: { data: [], error: null } });

		expect(result.entriesStatus).toBe('ready');
		expect(result.entries).toEqual([]);
	});

	it('en lyckad hämtning returnerar inläggen', async () => {
		const result = await runLoad({
			diary: {
				data: [{ id: 'e1', text: 'Första raden', created_at: '2026-10-01T10:00:00Z', tags: [] }],
				error: null
			}
		});

		expect(result.entriesStatus).toBe('ready');
		expect(result.entries.map((entry) => entry.content)).toEqual(['Första raden']);
	});

	it('faller tillbaka till journal_entries när diary saknas', async () => {
		const result = await runLoad({
			diary: { data: null, error: MISSING_TABLE },
			journal_entries: {
				data: [{ id: 'j1', content: 'Gammal rad', created_at: '2025-01-01T10:00:00Z', tags: [] }],
				error: null
			}
		});

		expect(result.entriesStatus).toBe('ready');
		expect(result.entries.map((entry) => entry.content)).toEqual(['Gammal rad']);
	});

	it('markerar fel när även reservtabellen fallerar', async () => {
		const result = await runLoad({
			diary: { data: null, error: MISSING_TABLE },
			journal_entries: { data: null, error: CONNECTION_ERROR }
		});

		expect(result.entriesStatus).toBe('error');
	});
});

describe('klientens tillstånd', () => {
	it('ett serverfel visar laddning medan klienten försöker igen', () => {
		expect(initialLoadState('error')).toBe('loading');
	});

	it('en lyckad serverhämtning är klar direkt', () => {
		expect(initialLoadState('ready')).toBe('ready');
	});

	it('ett misslyckat nytt försök efter serverfel blir fel, aldrig tom lista', () => {
		expect(loadStateAfterClientFetch('loading', false)).toBe('error');
	});

	it('ett lyckat nytt försök visar listan', () => {
		expect(loadStateAfterClientFetch('loading', true)).toBe('ready');
	});

	it('en lista som servern redan bekräftat blir inte ett fel av en extra kontroll', () => {
		expect(loadStateAfterClientFetch('ready', false)).toBe('ready');
	});

	// Regression: en långsam automatisk omhämtning kunde fallera efter att ett
	// sparande redan laddat om listan, och då dölja det sparade inlägget igen.
	it('ett gammalt fel döljer inte en lista som en nyare hämtning visat', () => {
		expect(loadStateAfterClientFetch('loading', false, true)).toBe('ready');
	});

	it('båda felvägarna i sidan tar hänsyn till nyare lyckade hämtningar', () => {
		const failureCalls = source.match(/loadStateAfterClientFetch\(\s*[^,]+,\s*false,\s*successfulEntryLoads !== loadsBefore\s*\)/g);
		expect(failureCalls).toHaveLength(2);
	});

	it('feltexten lovar inte mer än vi vet', () => {
		expect(NOTES_LOAD_ERROR_MESSAGE).toBe(
			'Vi kunde inte visa dina anteckningar just nu. Det betyder inte att de har raderats. Försök igen om en liten stund.'
		);
	});
});

// Mallens grenar. Svelte-sidan går inte att serverrendera som inloggad (sessionen
// sätts först i webbläsaren), så grenstrukturen läses direkt ur mallen.
const source = readFileSync(join(process.cwd(), 'src/routes/dagbok/checkin/+page.svelte'), 'utf8');
const template = source.slice(source.lastIndexOf('</script>'));

/**
 * Villkoret för den gren i en {#if}-kedja som innehåller `targetIndex`, samt
 * villkoren för de grenar som prövas före den.
 */
function branchesBefore(markup: string, chainStart: number, targetIndex: number) {
	const tokenPattern = /\{#(if|each|key|await|snippet)\s([^}]*)\}|\{:else if\s([^}]*)\}|\{:else\}|\{\/(if|each|key|await|snippet)\}/g;
	tokenPattern.lastIndex = chainStart;
	const branches: string[] = [];
	let depth = 0;
	let match: RegExpExecArray | null;

	while ((match = tokenPattern.exec(markup)) !== null && match.index < targetIndex) {
		if (match[1]) {
			if (depth === 0) branches.push(match[2].trim());
			depth += 1;
		} else if (match[4]) {
			depth -= 1;
			if (depth === 0) return null;
		} else if (depth === 1) {
			branches.push(match[3]?.trim() ?? 'else');
		}
	}

	return branches;
}

describe('dagbokens mall', () => {
	const chainStart = template.indexOf("{#if entriesState === 'error'}");
	const emptyIndex = template.indexOf('Din dagbok börjar här');

	it('har en felgren före tomt läge', () => {
		expect(chainStart).toBeGreaterThan(-1);
		expect(emptyIndex).toBeGreaterThan(chainStart);
	});

	it('tomt läge nås bara efter att fel och laddning uteslutits', () => {
		const branches = branchesBefore(template, chainStart, emptyIndex);

		expect(branches).toEqual([
			"entriesState === 'error'",
			"entriesState === 'loading'",
			'entries.length === 0'
		]);
	});

	it('felrutan visar den fasta texten och aldrig ett tekniskt felmeddelande', () => {
		const errorBranch = template.slice(chainStart, template.indexOf("{:else if entriesState === 'loading'}"));

		expect(errorBranch).toContain('{NOTES_LOAD_ERROR_MESSAGE}');
		expect(errorBranch).toContain('onclick={retryLoadEntries}');
		expect(errorBranch).not.toMatch(/error\.message|loadError/);
	});

	// Regression: efter ett fel och ett lyckat sparande låg listan kvar dold
	// bakom felrutan, eftersom bara de nya försöken satte tillståndet.
	it('varje lyckad hämtning av inläggen lämnar feltillståndet', () => {
		const start = source.indexOf('async function loadEntries(');
		const body = source.slice(start, source.indexOf('\n\t}\n', start));
		const assignment = body.indexOf('entries = page.entries;');

		expect(assignment).toBeGreaterThan(-1);
		expect(body.indexOf("entriesState = 'ready';", assignment)).toBeGreaterThan(assignment);
	});

	it('skrivfältet ligger utanför kedjan, så det går att skriva även vid fel', () => {
		const editorIndex = template.indexOf('onclick={saveDraftToDiary}');

		expect(editorIndex).toBeGreaterThan(-1);
		expect(editorIndex).toBeLessThan(chainStart);
	});
});
