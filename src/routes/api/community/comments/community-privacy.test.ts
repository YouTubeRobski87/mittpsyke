import { beforeEach, describe, expect, it, vi } from 'vitest';

// Regressionsskydd (säkerhetsrevision 2026-09-26): Gemenskapen visas anonymt,
// och RLS släpper nu bara igenom egna rader för klientrollen. Andras inlägg och
// kommentarer läses därför av servern med service role. Testerna säkerställer
// att (1) andras rader aldrig läses eller skrivs via användarens klient,
// (2) user_id aldrig följer med i svaret, och (3) user_id i skrivningar alltid
// kommer från auth och inte från request-body.

const USER_A = '00000000-0000-4000-8000-00000000000a';
const USER_B = '00000000-0000-4000-8000-00000000000b';
const POST_OF_A = '10000000-0000-4000-8000-000000000009';

type Row = Record<string, unknown>;
type QueryLog = { client: 'user' | 'service'; table: string; op: string; payload?: Row };
type QueryResult = { data: unknown; error: null; count?: number };

const log: QueryLog[] = [];
let serviceAvailable = true;
let postRows: Row[] = [];
let commentRows: Row[] = [];

function resultFor(table: string, op: string, payload?: Row): QueryResult {
	if (op === 'insert' && table === 'community_comments') {
		return {
			data: { id: 'c-new', post_id: payload?.post_id, body: payload?.body, created_at: 'nu' },
			error: null
		};
	}
	if (op === 'insert') return { data: null, error: null };
	if (table === 'community_posts') return { data: postRows, error: null, count: postRows.length };
	if (table === 'community_comments') return { data: commentRows, error: null };
	return { data: null, error: null };
}

/** Kedjbar fejk av en PostgREST-fråga. Loggar tabell, operation och klient. */
function makeQuery(client: QueryLog['client'], table: string) {
	let op = 'select';
	let payload: Row | undefined;
	let logged = false;
	const record = () => {
		if (!logged) {
			log.push({ client, table, op, payload });
			logged = true;
		}
	};
	const settle = (single: boolean) => {
		record();
		const result = resultFor(table, op, payload);
		if (single && Array.isArray(result.data)) {
			return Promise.resolve({ ...result, data: result.data[0] ?? null });
		}
		return Promise.resolve(result);
	};
	const query = {
		select: () => query,
		insert: (value: Row) => {
			op = 'insert';
			payload = value;
			return query;
		},
		eq: () => query,
		is: () => query,
		order: () => query,
		range: () => settle(false),
		limit: () => settle(false),
		maybeSingle: () => settle(true),
		single: () => settle(true),
		then: (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
			settle(false).then(resolve, reject)
	};
	return query;
}

function makeUserClient(userId: string) {
	return {
		auth: { getUser: () => Promise.resolve({ data: { user: { id: userId } }, error: null }) },
		from: (table: string) => makeQuery('user', table)
	};
}

vi.mock('$env/dynamic/private', () => ({
	env: { SUPABASE_URL: 'http://supabase.test', SUPABASE_ANON_KEY: 'anon-key' }
}));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

vi.mock('@supabase/supabase-js', () => ({
	createClient: () => makeUserClient(USER_B)
}));

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: () =>
		serviceAvailable ? { from: (table: string) => makeQuery('service', table) } : null
}));

const { POST, GET } = await import('./+server');
const { load } = await import('../../../dashboard/gemenskap/+page.server');

function postRequest(body: unknown) {
	return POST({
		request: new Request('http://localhost/api/community/comments', {
			method: 'POST',
			headers: { authorization: 'Bearer token-b', 'content-type': 'application/json' },
			body: JSON.stringify(body)
		})
	} as unknown as Parameters<typeof POST>[0]);
}

function getRequest(postId: string) {
	return GET({
		url: new URL(`http://localhost/api/community/comments?postId=${postId}`),
		request: new Request(`http://localhost/api/community/comments?postId=${postId}`, {
			headers: { authorization: 'Bearer token-b' }
		}),
		locals: { supabase: makeUserClient(USER_B) }
	} as unknown as Parameters<typeof GET>[0]);
}

beforeEach(() => {
	log.length = 0;
	serviceAvailable = true;
	postRows = [{ id: POST_OF_A, user_id: USER_A }];
	commentRows = [
		{ id: 'c1', post_id: POST_OF_A, body: 'Ett varsamt svar', created_at: 'igår', user_id: USER_A }
	];
});

describe('POST /api/community/comments', () => {
	it('läser andras inlägg och skriver kommentaren med service role, aldrig via användarens klient', async () => {
		const response = await postRequest({ postId: POST_OF_A, body: 'Jag känner igen mig.' });
		expect(response.status).toBe(200);

		const communityQueries = log.filter((entry) => entry.table.startsWith('community_'));
		expect(communityQueries.length).toBeGreaterThan(0);
		expect(communityQueries.every((entry) => entry.client === 'service')).toBe(true);
	});

	it('tar user_id från auth och ignorerar ett user_id i request-body', async () => {
		await postRequest({ postId: POST_OF_A, body: 'Hej', user_id: USER_A, userId: USER_A });
		const insert = log.find((entry) => entry.table === 'community_comments' && entry.op === 'insert');
		expect(insert?.payload?.user_id).toBe(USER_B);
	});

	it('returnerar aldrig inläggsägarens user_id', async () => {
		const response = await postRequest({ postId: POST_OF_A, body: 'Hej' });
		expect(JSON.stringify(await response.json())).not.toContain(USER_A);
	});

	it('nekar svar på eget inlägg innan något skrivs', async () => {
		postRows = [{ id: POST_OF_A, user_id: USER_B }];
		const response = await postRequest({ postId: POST_OF_A, body: 'Hej' });
		expect(response.status).toBe(403);
		expect(log.some((entry) => entry.op === 'insert')).toBe(false);
	});

	it('validerar innan databasen rörs', async () => {
		const response = await postRequest({ postId: 'inte-ett-id', body: 'Hej' });
		expect(response.status).toBe(400);
		expect(log).toEqual([]);
	});

	it('faller inte tillbaka på användarens klient när service role saknas', async () => {
		serviceAvailable = false;
		const response = await postRequest({ postId: POST_OF_A, body: 'Hej' });
		expect(response.status).toBe(500);
		expect(log.some((entry) => entry.client === 'user' && entry.table.startsWith('community_'))).toBe(false);
	});
});

describe('GET /api/community/comments', () => {
	it('läser andras kommentarer via servern och skickar aldrig user_id', async () => {
		const response = await getRequest(POST_OF_A);
		const body = (await response.json()) as { success: boolean; comments: Row[] };

		expect(response.status).toBe(200);
		expect(body.comments).toHaveLength(1);
		expect(body.comments[0]).not.toHaveProperty('user_id');
		expect(JSON.stringify(body)).not.toContain(USER_A);
		expect(log.filter((entry) => entry.client === 'user')).toEqual([]);
	});

	it('ger tom lista för ett borttaget eller okänt inlägg', async () => {
		postRows = [];
		const response = await getRequest(POST_OF_A);
		const body = (await response.json()) as { comments: Row[] };
		expect(body.comments).toEqual([]);
	});
});

describe('Gemenskapens flöde (/dashboard/gemenskap)', () => {
	it('räknar ut isOwnPost på servern och skickar aldrig user_id till klienten', async () => {
		postRows = [
			{ id: 'p-a', content: 'A:s delade text', mood: null, created_at: 'igår', diary_entry_id: 'd-a', user_id: USER_A },
			{ id: 'p-b', content: 'B:s delade text', mood: null, created_at: 'idag', diary_entry_id: 'd-b', user_id: USER_B }
		];

		const result = (await load({
			locals: { supabase: makeUserClient(USER_B) },
			url: new URL('http://localhost/dashboard/gemenskap')
		} as unknown as Parameters<typeof load>[0])) as { items: Row[] };

		expect(JSON.stringify(result)).not.toContain(USER_A);
		expect(result.items.every((item) => !('user_id' in item))).toBe(true);

		const ofA = result.items.find((item) => item.id === 'p-a');
		const ofB = result.items.find((item) => item.id === 'p-b');
		expect(ofA).toMatchObject({ isOwnPost: false, diaryEntryId: null });
		expect(ofB).toMatchObject({ isOwnPost: true, diaryEntryId: 'd-b' });

		expect(log.filter((entry) => entry.client === 'user')).toEqual([]);
	});

	it('visar ett tomt flöde i stället för att läsa via användarens klient när service role saknas', async () => {
		serviceAvailable = false;
		const result = (await load({
			locals: { supabase: makeUserClient(USER_B) },
			url: new URL('http://localhost/dashboard/gemenskap')
		} as unknown as Parameters<typeof load>[0])) as { items: Row[] };

		expect(result.items).toEqual([]);
		expect(log.filter((entry) => entry.client === 'user')).toEqual([]);
	});
});
