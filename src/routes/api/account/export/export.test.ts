import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock('@supabase/supabase-js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
	return { ...actual, createClient: mocks.createClient };
});

vi.mock('$env/dynamic/private', () => ({
	env: {
		SUPABASE_URL: 'https://example.supabase.co',
		SUPABASE_ANON_KEY: 'anon-key',
		SUPABASE_SERVICE_ROLE_KEY: 'service-key'
	}
}));

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SUPABASE_URL: 'https://example.supabase.co', PUBLIC_SUPABASE_ANON_KEY: 'anon-key' }
}));

// GET importeras färskt per test via vi.resetModules() i beforeEach. Det ger en
// ny rate-limiter-instans varje test utan att produktionsrouten behöver
// exportera någon test-hook.
let GET: typeof import('./+server').GET;

const USER = { id: 'user-1', email: 'anvandare@example.com', created_at: '2026-01-01T00:00:00.000Z' };

/** Rader per tabell. Fixturen innehåller även en annan användares rad. */
const TABLE_ROWS: Record<string, Record<string, unknown>[]> = {
	diary: [
		{ id: 'd1', user_id: 'user-1', created_at: '2026-02-01T10:00:00.000Z', text: 'Min text', mood: '7', tags: null },
		{ id: 'd2', user_id: 'user-2', created_at: '2026-02-02T10:00:00.000Z', text: 'ANNAN ANVÄNDARE', mood: '3', tags: null }
	],
	evening_checkins: [{ id: 'e1', user_id: 'user-1', thought: 'Kvällstanke', theme_id: 'tomorrow' }],
	companion_daily_answers: [{ user_id: 'user-1', answer_date: '2026-02-01', question_id: 'q1' }],
	daily_movement: [{ id: 'm1', user_id: 'user-1', entry_date: '2026-02-01', step_count: 4200 }],
	weekly_reflections: [{ id: 'w1', user_id: 'user-1', week_start: '2026-02-01', words: [] }],
	user_memories: [{ id: 'u1', user_id: 'user-1', content: 'Tema', created_at: '2026-02-01T00:00:00.000Z' }],
	user_sms_preferences: [{ user_id: 'user-1', sms_opt_in: false, phone_number: null }],
	conversations: [
		{ id: 'c1', user_id: 'user-1', category: 'A', title: 'Samtal', created_at: '2026-02-01T00:00:00.000Z' },
		{ id: 'c2', user_id: 'user-2', category: 'B', title: 'ANNAN', created_at: '2026-02-01T00:00:00.000Z' }
	],
	messages: [
		{ id: 'm-1', conversation_id: 'c1', role: 'user', content: 'Hej', created_at: '2026-02-01T00:01:00.000Z' },
		{ id: 'm-2', conversation_id: 'c2', role: 'user', content: 'ANNAN', created_at: '2026-02-01T00:01:00.000Z' }
	]
};

type BuilderOptions = { failOn?: string; emptyAll?: boolean };

/** Minimal query-builder som speglar .eq/.in/.order/.maybeSingle. */
function createBuilder(table: string, options: BuilderOptions) {
	let rows = options.emptyAll ? [] : [...(TABLE_ROWS[table] ?? [])];
	const builder: Record<string, unknown> = {
		select: () => builder,
		eq: (column: string, value: unknown) => {
			rows = rows.filter((row) => row[column] === value);
			return builder;
		},
		in: (column: string, values: unknown[]) => {
			rows = rows.filter((row) => values.includes(row[column]));
			return builder;
		},
		order: () => {
			if (options.failOn === table) return Promise.resolve({ data: null, error: { message: 'boom' } });
			return Promise.resolve({ data: rows, error: null });
		},
		maybeSingle: () => {
			if (options.failOn === table) return Promise.resolve({ data: null, error: { message: 'boom' } });
			return Promise.resolve({ data: rows[0] ?? null, error: null });
		}
	};
	return builder;
}

function mockSupabase({ user = USER, authError = null as unknown, ...options }: BuilderOptions & { user?: typeof USER | null; authError?: unknown } = {}) {
	mocks.createClient.mockReturnValue({
		auth: { getUser: async () => ({ data: { user }, error: authError }) },
		from: (table: string) => createBuilder(table, options)
	});
}

function request(header: string | null = 'Bearer token-123') {
	return new Request('https://example.com/api/account/export', {
		headers: header ? { Authorization: header } : {}
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = (req: Request) => GET({ request: req } as any);

beforeEach(async () => {
	mocks.createClient.mockReset();
	// Färsk modulinstans per test → färsk rate-limiter, så testerna inte
	// förorenar varandras kvot.
	vi.resetModules();
	({ GET } = await import('./+server'));
});

describe('åtkomst', () => {
	it('nekar utan Authorization-header', async () => {
		mockSupabase();
		const response = await call(request(null));

		expect(response.status).toBe(401);
		expect(mocks.createClient).not.toHaveBeenCalled();
	});

	it('nekar en token som inte går att verifiera', async () => {
		mockSupabase({ user: null, authError: { message: 'bad token' } });

		expect((await call(request())).status).toBe(401);
	});

	it('identifierar användaren via auth.getUser, inte via klientdata', async () => {
		mockSupabase();
		const response = await call(
			new Request('https://example.com/api/account/export?user_id=user-2', {
				headers: { Authorization: 'Bearer token-123' }
			})
		);
		const body = await response.json();

		expect(body.data.konto.e_post).toBe(USER.email);
		expect(JSON.stringify(body)).not.toContain('user-2');
	});
});

describe('rate limiting', () => {
	it('släpper igenom upp till gränsen och nekar sedan med 429', async () => {
		mockSupabase();

		for (let i = 0; i < 5; i += 1) {
			expect((await call(request())).status, `anrop ${i + 1}`).toBe(200);
		}

		const blocked = await call(request());
		const body = await blocked.json();
		expect(blocked.status).toBe(429);
		expect(body.success).toBe(false);
		// Meddelandet får inte avslöja tabellnamn, nyckelform eller limitvärde.
		expect(body.error).not.toMatch(/user:|diary|supabase|\d/i);
	});

	it('räknar per användare, inte globalt', async () => {
		// Användare A slår i taket.
		mockSupabase();
		for (let i = 0; i < 6; i += 1) await call(request());

		// Användare B ska fortfarande komma igenom.
		mockSupabase({ user: { ...USER, id: 'user-9', email: 'b@example.com' } });
		expect((await call(request())).status).toBe(200);
	});

	it('gatar de tunga frågorna först efter verifierad identitet', async () => {
		// En 401 (ingen token) ska aldrig förbruka en kvot.
		for (let i = 0; i < 10; i += 1) {
			mockSupabase();
			expect((await call(request(null))).status).toBe(401);
		}

		mockSupabase();
		expect((await call(request())).status).toBe(200);
	});
});

describe('innehållet', () => {
	it('levererar de förväntade kategorierna', async () => {
		mockSupabase();
		const body = await (await call(request())).json();

		expect(body.export_version).toBe('1');
		expect(typeof body.exported_at).toBe('string');
		expect(Object.keys(body.data).sort()).toEqual(
			[
				'chattar',
				'dagboksinlagg',
				'foljeslagarsvar',
				'installningar',
				'konto',
				'kvallsincheckningar',
				'rorelse',
				'sms_installningar',
				'sparade_teman',
				'veckoreflektioner'
			].sort()
		);
	});

	it('nästlar meddelanden under rätt samtal', async () => {
		mockSupabase();
		const body = await (await call(request())).json();

		expect(body.data.chattar).toHaveLength(1);
		expect(body.data.chattar[0].meddelanden).toHaveLength(1);
		expect(body.data.chattar[0].meddelanden[0].content).toBe('Hej');
	});
});

describe('ingen annan användares data', () => {
	it('utesluter rader som tillhör någon annan', async () => {
		mockSupabase();
		const raw = JSON.stringify(await (await call(request())).json());

		expect(raw).not.toContain('ANNAN ANVÄNDARE');
		expect(raw).not.toContain('ANNAN');
		expect(raw).not.toContain('user-2');
	});

	it('läser aldrig med service role', async () => {
		mockSupabase();
		await call(request());

		for (const [, key] of mocks.createClient.mock.calls) {
			expect(key).toBe('anon-key');
			expect(key).not.toBe('service-key');
		}
	});
});

describe('känsliga och interna fält', () => {
	it('tar bara med tillåtna metadatafält', async () => {
		mocks.createClient.mockReturnValue({
			auth: {
				getUser: async () => ({
					data: {
						user: {
							...USER,
							user_metadata: {
								display_name: 'Robban',
								personal_goals: [{ id: 'g1', text: 'Skriva oftare', status: 'open' }],
								provider_refresh_token: 'HEMLIG',
								is_admin: true
							}
						}
					},
					error: null
				})
			},
			from: (table: string) => createBuilder(table, {})
		});

		const body = await (await call(request())).json();

		expect(body.data.installningar.display_name).toBe('Robban');
		expect(body.data.installningar.personal_goals).toHaveLength(1);
		expect(body.data.installningar.provider_refresh_token).toBeUndefined();
		expect(body.data.installningar.is_admin).toBeUndefined();
		expect(JSON.stringify(body)).not.toContain('HEMLIG');
	});

	it('exporterar inte interna kopplings-id:n för meddelanden', async () => {
		mockSupabase();
		const body = await (await call(request())).json();

		expect(body.data.chattar[0].meddelanden[0].conversation_id).toBeUndefined();
	});
});

describe('tomma och trasiga lägen', () => {
	it('ger en giltig fil även utan sparad data', async () => {
		mockSupabase({ emptyAll: true });
		const response = await call(request());
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.data.dagboksinlagg).toEqual([]);
		expect(body.data.chattar).toEqual([]);
		expect(body.data.sms_installningar).toBeNull();
	});

	it('svarar 500 utan att läcka detaljer när en fråga fallerar', async () => {
		mockSupabase({ failOn: 'diary' });
		const response = await call(request());
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.success).toBe(false);
		expect(body.error).not.toMatch(/diary|boom|supabase/i);
	});
});

describe('SvelteKits regler för +server', () => {
	it('exporterar bara HTTP-verb och _-prefixade namn', async () => {
		// SvelteKit vägrar ladda routen vid runtime om ett named export saknar
		// understreck. Varken svelte-check, vitest eller build fångar det, så
		// kontrollen ligger här.
		const module = await import('./+server');
		const allowed = /^(GET|POST|PATCH|PUT|DELETE|OPTIONS|HEAD|fallback|prerender|trailingSlash|config|entries|_.*)$/;

		for (const name of Object.keys(module)) {
			expect(name, `Ogiltigt export-namn: ${name}`).toMatch(allowed);
		}
	});
});

describe('nedladdningen', () => {
	it('sätter JSON-typ, filnamn och no-store', async () => {
		mockSupabase();
		const response = await call(request());

		expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
		expect(response.headers.get('content-disposition')).toMatch(
			/^attachment; filename="mittpsyke-data-\d{4}-\d{2}-\d{2}\.json"$/
		);
		expect(response.headers.get('cache-control')).toBe('no-store');
	});
});
