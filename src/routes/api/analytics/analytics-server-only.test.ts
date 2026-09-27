import { beforeEach, describe, expect, it, vi } from 'vitest';

// Regressionsskydd (säkerhetsrevision 2026-09-26): analytics_events innehåller
// user_id och session_id och är server-only. Endpointen får aldrig skriva via
// användarens klient, och user_id får bara komma från den verifierade sessionen.

const USER_A = '00000000-0000-4000-8000-00000000000a';
const LANDING_PAGE_ID = '20000000-0000-4000-8000-000000000001';

type Insert = { client: 'user' | 'service'; table: string; payload: Record<string, unknown> };
const inserts: Insert[] = [];
let serviceAvailable = true;

function makeInsertClient(client: Insert['client']) {
	return {
		from: (table: string) => ({
			insert: (payload: Record<string, unknown>) => {
				inserts.push({ client, table, payload });
				return Promise.resolve({ error: null });
			}
		})
	};
}

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: () => (serviceAvailable ? makeInsertClient('service') : null),
	isMissingTableError: () => false,
	isUuid: (value: string) => /^[0-9a-f-]{36}$/i.test(value)
}));

const { POST } = await import('./+server');

function request(body: Record<string, unknown>) {
	const userClient = makeInsertClient('user');
	return POST({
		request: new Request('http://localhost/api/analytics', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		}),
		locals: {
			supabase: {
				...userClient,
				auth: { getUser: () => Promise.resolve({ data: { user: { id: USER_A } } }) },
				// Databasen saknar RPC:n, som i produktion idag.
				rpc: () => Promise.resolve({ data: null, error: { code: 'PGRST202', message: 'missing' } })
			}
		}
	} as unknown as Parameters<typeof POST>[0]);
}

beforeEach(() => {
	inserts.length = 0;
	serviceAvailable = true;
});

describe('POST /api/analytics', () => {
	it('skriver analytics_events med service role och user_id från sessionen', async () => {
		const response = await request({
			landingPageId: LANDING_PAGE_ID,
			eventType: 'view',
			user_id: 'forfalskat-id',
			userId: 'forfalskat-id'
		});

		expect(response.status).toBe(200);
		expect(inserts).toHaveLength(1);
		expect(inserts[0].client).toBe('service');
		expect(inserts[0].payload.user_id).toBe(USER_A);
	});

	it('faller aldrig tillbaka på användarens klient när service role saknas', async () => {
		serviceAvailable = false;
		const response = await request({ landingPageId: LANDING_PAGE_ID, eventType: 'view' });

		expect(response.status).toBe(202);
		expect(inserts.filter((entry) => entry.client === 'user')).toEqual([]);
	});
});
