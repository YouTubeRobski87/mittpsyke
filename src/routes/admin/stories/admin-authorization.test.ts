// Auktorisationsgrinden för berättelsemoderering.
//
// Testerna är beteendebaserade: de anropar de riktiga form actions och
// kontrollerar om en skrivning mot databasen faktiskt sker. Ett source-string-
// test hade inte fångat regressionen nedan, eftersom den satt i vilken
// egenskap som lästes - inte i om en grind fanns.
//
// Regressionen: ensureAdmin returnerar fail(), dvs en ActionFailure med bara
// `status` och `data`. Actions kontrollerade `'error' in admin`, vilket alltid
// är falskt eftersom felmeddelandet ligger i `data.error`. Grinden returnerade
// därför aldrig tidigt. Eftersom SvelteKit kör actions FÖRE `load` skyddade
// requireAdmin() i load inte POST, och skrivningen görs med service role som
// kringgår RLS. Vem som helst kunde alltså godkänna, avvisa eller radera en
// berättelse.
//
// Acceptanskriterium: NO ADMIN → NO SERVICE-ROLE WRITE.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const STORY_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const mocks = vi.hoisted(() => ({
	createServiceClient: vi.fn(),
	isMissingTableError: vi.fn(() => false),
	isUuid: vi.fn((value: string) => /^[0-9a-f-]{36}$/i.test(value))
}));

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: mocks.createServiceClient,
	isMissingTableError: mocks.isMissingTableError,
	isUuid: mocks.isUuid
}));

import { actions } from './+page.server';

type Writes = { table: string; values: Record<string, unknown>; id?: string }[];

/**
 * Service role-klient som registrerar varje skrivning. Om en enda write dyker
 * upp utan admin har grinden fallerat.
 */
function recordingServiceClient() {
	const writes: Writes = [];
	const client = {
		from(table: string) {
			return {
				update(values: Record<string, unknown>) {
					const entry: Writes[number] = { table, values };
					const builder = {
						eq(_column: string, value: string) {
							entry.id = value;
							return builder;
						},
						select() {
							return builder;
						},
						async maybeSingle() {
							writes.push(entry);
							return { data: { id: entry.id }, error: null };
						},
						then(resolve: (value: { error: null }) => unknown) {
							writes.push(entry);
							return resolve({ error: null });
						}
					};
					return builder;
				}
			};
		}
	};
	return { client, writes };
}

/** locals med en given sessionsanvändare (null = utloggad). */
function localsFor(user: { id: string; is_super_admin: boolean } | null) {
	return {
		getSession: vi.fn().mockResolvedValue(user),
		supabase: {}
	} as unknown as Parameters<typeof actions.approve>[0]['locals'];
}

function event(user: { id: string; is_super_admin: boolean } | null, id = STORY_ID) {
	const body = new URLSearchParams({ id });
	return {
		locals: localsFor(user),
		request: new Request('http://localhost/admin/stories?/approve', {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: body.toString()
		})
	} as unknown as Parameters<typeof actions.approve>[0];
}

const ACTIONS = ['approve', 'reject', 'delete'] as const;

let service: ReturnType<typeof recordingServiceClient>;

beforeEach(() => {
	service = recordingServiceClient();
	mocks.createServiceClient.mockReset().mockReturnValue(service.client);
	mocks.isMissingTableError.mockReturnValue(false);
});

describe.each(ACTIONS)('%s utan giltig admin', (name) => {
	it('svarar 401 för en utloggad besökare och skriver ingenting', async () => {
		const result = await actions[name](event(null));

		expect(result).toBeDefined();
		expect((result as { status?: number }).status).toBe(401);
		expect(service.writes).toHaveLength(0);
	});

	it('svarar 403 för en inloggad icke-admin och skriver ingenting', async () => {
		const result = await actions[name](event({ id: 'user-1', is_super_admin: false }));

		expect((result as { status?: number }).status).toBe(403);
		expect(service.writes).toHaveLength(0);
	});

	// Kärnan i regressionen: felet låg i vilken egenskap som lästes ur
	// ActionFailure. Låser fast att grinden diskriminerar på `status` och att
	// ett `'error' in`-test inte skulle ha stoppat något.
	it('returnerar en ActionFailure som saknar toppnivå-error', async () => {
		const result = (await actions[name](event(null))) as Record<string, unknown>;

		expect('status' in result).toBe(true);
		expect('data' in result).toBe(true);
		// Just det här var falskt även vid nekad åtkomst, vilket är hela buggen.
		expect('error' in result).toBe(false);
		expect((result.data as { error?: string }).error).toBeTruthy();
	});

	it('slår aldrig upp service role-klienten innan grinden passerats', async () => {
		await actions[name](event({ id: 'user-1', is_super_admin: false }));
		expect(service.writes).toHaveLength(0);
	});
});

describe.each(ACTIONS)('%s med giltig admin', (name) => {
	it('passerar grinden och når den normala databasvägen', async () => {
		const result = await actions[name](event({ id: 'admin-1', is_super_admin: true }));

		expect(service.writes).toHaveLength(1);
		expect(service.writes[0].table).toBe('anonymous_stories');
		expect(service.writes[0].id).toBe(STORY_ID);
		expect((result as { success?: string }).success).toBeTruthy();
	});

	it('avvisar ett ogiltigt id med 400 utan att skriva', async () => {
		const result = await actions[name](
			event({ id: 'admin-1', is_super_admin: true }, 'inte-ett-uuid')
		);

		expect((result as { status?: number }).status).toBe(400);
		expect(service.writes).toHaveLength(0);
	});
});

describe('vilka statusövergångar varje action skriver', () => {
	const admin = { id: 'admin-1', is_super_admin: true };

	it('approve sätter approved och en tidpunkt', async () => {
		await actions.approve(event(admin));
		expect(service.writes[0].values).toMatchObject({ status: 'approved' });
		expect(service.writes[0].values.approved_at).toEqual(expect.any(String));
	});

	it('reject sätter rejected och nollar tidpunkten', async () => {
		await actions.reject(event(admin));
		expect(service.writes[0].values).toEqual({ status: 'rejected', approved_at: null });
	});

	it('delete sätter deleted och nollar tidpunkten', async () => {
		await actions.delete(event(admin));
		expect(service.writes[0].values).toEqual({ status: 'deleted', approved_at: null });
	});
});
