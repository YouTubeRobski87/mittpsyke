import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
const serviceKey = vi.hoisted(() => ({ value: 'service-key' }));

vi.mock('@supabase/supabase-js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
	return { ...actual, createClient: mocks.createClient };
});

vi.mock('$env/dynamic/private', () => ({
	env: {
		SUPABASE_URL: 'https://example.supabase.co',
		SUPABASE_ANON_KEY: 'anon-key',
		get SUPABASE_SERVICE_ROLE_KEY() {
			return serviceKey.value;
		}
	}
}));

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SUPABASE_URL: 'https://example.supabase.co', PUBLIC_SUPABASE_ANON_KEY: 'anon-key' }
}));

// GET importeras färskt per test via vi.resetModules() i beforeEach. Det ger en
// ny rate-limiter-instans varje test utan att produktionsrouten behöver
// exportera någon test-hook.
let GET: typeof import('./+server').GET;

const USER = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'anvandare@example.com', created_at: '2026-01-01T00:00:00.000Z' };

/** Rader per tabell. Fixturen innehåller även en annan användares rad. */
const TABLE_ROWS: Record<string, Record<string, unknown>[]> = {
	user_helpful_reminders: [
		{ user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', item_id: 'music', active: true, revision: 1 },
		{ user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', item_id: 'rest', active: false, revision: 2 },
		{ user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', item_id: 'nature', active: true, revision: 1 }
	],
	diary: [
		{ id: 'd1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', created_at: '2026-02-01T10:00:00.000Z', text: 'Min text', mood: '7', tags: null },
		{ id: 'd2', user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', created_at: '2026-02-02T10:00:00.000Z', text: 'ANNAN ANVÄNDARE', mood: '3', tags: null }
	],
	evening_checkins: [{ id: 'e1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', thought: 'Kvällstanke', theme_id: 'tomorrow' }],
	creative_moments: [{ id: 'cm1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', activity_type: 'world_coloring', occurred_at: '2026-02-01T10:00:00.000Z' }],
	companion_daily_answers: [{ user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', answer_date: '2026-02-01', question_id: 'q1' }],
	daily_movement: [{ id: 'm1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', entry_date: '2026-02-01', step_count: 4200 }],
	weekly_reflections: [{ id: 'w1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', week_start: '2026-02-01', words: [] }],
	user_memories: [{ id: 'u1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', content: 'Tema', created_at: '2026-02-01T00:00:00.000Z' }],
	user_sms_preferences: [{ user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', sms_opt_in: false, phone_number: null }],
	community_posts: [
		{ id: 'p1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', content: 'Delat inlägg', mood: 'lugn', created_at: '2026-02-01T00:00:00.000Z' },
		{ id: 'p2', user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', content: 'ANNAN', mood: 'lugn', created_at: '2026-02-01T00:00:00.000Z' }
	],
	community_comments: [
		{ id: 'k1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', post_id: 'p2', body: 'Min kommentar', created_at: '2026-02-01T00:00:00.000Z' },
		{ id: 'k2', user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', post_id: 'p1', body: 'ANNAN', created_at: '2026-02-01T00:00:00.000Z' }
	],
	forum_threads: [
		{ id: 't1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Min tråd', body: 'Text', is_anonymous: true, created_at: '2026-03-22T00:00:00.000Z' },
		{ id: 't2', user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'ANNAN', body: 'ANNAN', is_anonymous: false, created_at: '2026-03-22T00:00:00.000Z' }
	],
	forum_replies: [
		{ id: 'r1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', thread_id: 't2', body: 'Mitt svar', is_anonymous: false, created_at: '2026-03-23T00:00:00.000Z' },
		{ id: 'r2', user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', thread_id: 't1', body: 'ANNAN', is_anonymous: true, created_at: '2026-03-23T00:00:00.000Z' }
	],
	conversations: [
		{ id: 'c1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category: 'A', title: 'Samtal', created_at: '2026-02-01T00:00:00.000Z' },
		{ id: 'c2', user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', category: 'B', title: 'ANNAN', created_at: '2026-02-01T00:00:00.000Z' }
	],
	companion_presence_weeks: [{ user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', week_start: '2026-02-02' }, { user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', week_start: '2026-02-02' }],
	daily_questions: [{ id: 'q1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', date: '2026-02-01', question_text: 'Min fråga' }],
	storify_entries: [{ id: 's1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', content: 'Min berättelse' }, { id: 's2', user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', content: 'ANNAN' }],
	chat_history: [{ user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', topic: 'angest', messages: [{ role: 'user', content: 'Hej igen' }] }, { user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', topic: 'angest', messages: [{ content: 'ANNAN' }] }],
	user_category_follows: [{ user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category_id: 'cat-1' }],
	user_thread_follows: [{ user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', thread_id: 't2' }],
	notifications: [{ id: 'n1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'forum_reply', title: 'Svar', actor_user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }],
	feedback_submissions: [{ id: 'f1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', experience: 'bra' }],
	profiles: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', display_name: 'Robban' }, { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', display_name: 'ANNAN' }],
	journal_entries: [{ id: 'j1', user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', content: 'Gammal anteckning' }],
	user_ai_consents: [{ user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', scope: 'diary', status: 'granted' }, { user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', scope: 'chat', status: 'granted' }],
	forum_reports: [{ id: 'fr1', reporter_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', reason: 'spam' }, { id: 'fr2', reporter_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', reason: 'ANNAN' }],
	messages: [
		{ id: 'm-1', conversation_id: 'c1', role: 'user', content: 'Hej', created_at: '2026-02-01T00:01:00.000Z' },
		{ id: 'm-2', conversation_id: 'c2', role: 'user', content: 'ANNAN', created_at: '2026-02-01T00:01:00.000Z' }
	]
};

type BuilderOptions = {
	/** Tabeller vars fråga ska misslyckas. */
	failOn?: string | string[];
	/** Felet som returneras för failOn. Standard är ett generiskt databasfel. */
	failError?: { code?: string; message: string };
	emptyAll?: boolean;
	/** Låt createServiceClient sakna nyckel. */
	noServiceKey?: boolean;
};

/** Frågor per klient, så att testerna kan se vilken nyckel som läste vad. */
let queries: { key: string; table: string; filters: [string, unknown][] }[] = [];

/** Minimal query-builder som speglar .eq/.in/.order/.maybeSingle. */
function createBuilder(table: string, options: BuilderOptions, key: string) {
	const failing = ([] as string[]).concat(options.failOn ?? []).includes(table);
	const failure = { data: null, error: options.failError ?? { message: 'boom' } };
	const query = { key, table, filters: [] as [string, unknown][] };
	queries.push(query);
	let rows = options.emptyAll ? [] : [...(TABLE_ROWS[table] ?? [])];
	let columns: string[] | null = null;
	// Projektion som i PostgREST: bara valda kolumner, men filtrering sker på hela raden
	const project = () =>
		columns ? rows.map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => columns!.includes(k)))) : rows;
	const builder: Record<string, unknown> = {
		select: (list?: string) => {
			columns = list && list !== '*' ? list.split(',').map((c) => c.trim()) : null;
			return builder;
		},
		eq: (column: string, value: unknown) => {
			query.filters.push([column, value]);
			rows = rows.filter((row) => row[column] === value);
			return builder;
		},
		then: (resolve: (result: unknown) => void) => resolve(failing ? failure : { data: project(), error: null }),
		in: (column: string, values: unknown[]) => {
			rows = rows.filter((row) => values.includes(row[column]));
			return builder;
		},
		order: () => Promise.resolve(failing ? failure : { data: project(), error: null }),
		maybeSingle: () => Promise.resolve(failing ? failure : { data: project()[0] ?? null, error: null })
	};
	return builder;
}

function mockSupabase({ user = USER, authError = null as unknown, ...options }: BuilderOptions & { user?: typeof USER | null; authError?: unknown } = {}) {
	mocks.createClient.mockImplementation((_url: string, key: string) => ({
		auth: { getUser: async () => ({ data: { user }, error: authError }) },
		from: (table: string) => createBuilder(table, options, key)
	}));
	serviceKey.value = options.noServiceKey ? '' : 'service-key';
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
	queries = [];
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
			new Request('https://example.com/api/account/export?user_id=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', {
				headers: { Authorization: 'Bearer token-123' }
			})
		);
		const body = await response.json();

		expect(body.data.konto.e_post).toBe(USER.email);
		expect(JSON.stringify(body)).not.toContain('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
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
		mockSupabase({ user: { ...USER, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', email: 'b@example.com' } });
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

		expect(body.export_version).toBe('4');
		expect(body.fullstandig).toBe(true);
		expect(body.saknade_delar).toEqual([]);
		expect(typeof body.exported_at).toBe('string');
		expect(Object.keys(body.data).sort()).toEqual(
			[
				'ai_samtycken',
				'aldre_anteckningar',
				'berattelser',
				'chattar',
				'chatthistorik',
				'dagboksinlagg',
				'dagens_fragor',
				'feedback',
				'foljda_kategorier',
				'foljda_tradar',
				'foljeslagarveckor',
				'forumrapporter',
				'notiser',
				'profil',
				'foljeslagarsvar',
				'forumsvar',
				'forumtradar',
				'gemenskapsinlagg',
				'gemenskapskommentarer',
				'installningar',
				'konto',
				'kreativa_stunder',
				'kvallsincheckningar',
				'rorelse',
				'sms_installningar',
				'sparade_teman',
				'veckoreflektioner'
			].sort()
		);
	});

	it('tar med egna forum- och gemenskapsinlägg, men aldrig andras', async () => {
		mockSupabase();
		const body = await (await call(request())).json();

		expect(body.data.forumtradar.map((row: { id: string }) => row.id)).toEqual(['t1']);
		expect(body.data.forumsvar.map((row: { id: string }) => row.id)).toEqual(['r1']);
		expect(body.data.gemenskapsinlagg.map((row: { id: string }) => row.id)).toEqual(['p1']);
		expect(body.data.gemenskapskommentarer.map((row: { id: string }) => row.id)).toEqual(['k1']);
		expect(JSON.stringify(body.data)).not.toContain('ANNAN');
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
		expect(raw).not.toContain('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
	});

	it('läser med användarens token, och service role bara för tabeller utan SELECT-policy', async () => {
		mockSupabase();
		await call(request());

		const serviceTables = queries.filter((q) => q.key === 'service-key').map((q) => q.table).sort();
		expect(serviceTables).toEqual(['forum_reports', 'user_ai_consents']);
		for (const q of queries.filter((q) => q.key === 'service-key')) {
			// Varje service-fråga ska vara filtrerad på det verifierade user-id:t
			expect(q.filters.some(([, value]) => value === USER.id), q.table).toBe(true);
		}
		for (const q of queries.filter((q) => q.key !== 'service-key')) {
			expect(q.key).toBe('anon-key');
		}
	});

	it('filtrerar varje tabellfråga på användarens id (utom meddelanden, som filtreras via egna samtal)', async () => {
		mockSupabase();
		await call(request());

		for (const q of queries.filter((q) => q.table !== 'messages')) {
			expect(q.filters, q.table).toContainEqual([expect.any(String), USER.id]);
		}
	});

	it('nya delar innehåller bara egna rader och inga andras id:n', async () => {
		mockSupabase();
		const body = await (await call(request())).json();

		expect(body.data.profil).toEqual([{ display_name: 'Robban' }]);
		expect(body.data.notiser[0].actor_user_id).toBeUndefined();
		expect(body.data.chatthistorik).toHaveLength(1);
		expect(body.data.ai_samtycken).toHaveLength(1);
		expect(body.data.forumrapporter.map((row: { id: string }) => row.id)).toEqual(['fr1']);
		expect(body.data.foljeslagarveckor).toHaveLength(1);
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
								progress_helpful_reminders: ['Vila', 'ogiltigt'],
								provider_refresh_token: 'HEMLIG',
								is_admin: true
							}
						}
					},
					error: null
				})
			},
			from: (table: string) => createBuilder(table, {}, 'anon-key')
		});

		const body = await (await call(request())).json();

		expect(body.data.installningar.display_name).toBe('Robban');
		expect(body.data.installningar.personal_goals).toHaveLength(1);
		expect(body.data.installningar.progress_helpful_reminders).toEqual(['Musik']);
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

	it('markerar exporten som ofullständig när en del fallerar, och levererar resten', async () => {
		mockSupabase({ failOn: 'diary' });
		const response = await call(request());
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.fullstandig).toBe(false);
		expect(body.saknade_delar).toEqual([{ del: 'dagboksinlagg', orsak: 'kunde_inte_hamtas' }]);
		expect(body.data.dagboksinlagg).toBeUndefined();
		expect(body.data.chattar).toHaveLength(1);
		expect(response.headers.get('x-export-complete')).toBe('false');
		expect(response.headers.get('content-disposition')).toMatch(/-ofullstandig\.json"$/);
		// Felet läcker inte ut i filen
		expect(JSON.stringify(body)).not.toMatch(/boom/i);
	});

	it('creative_moments utan tabell redovisas som ej aktiverad funktion, inte som saknad data', async () => {
		mockSupabase({
			failOn: 'creative_moments',
			failError: { code: 'PGRST205', message: "Could not find the table 'public.creative_moments' in the schema cache" }
		});
		const response = await call(request());
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.fullstandig).toBe(true);
		expect(body.saknade_delar).toEqual([]);
		expect(body.ej_aktiverade_funktioner).toEqual([{ del: 'kreativa_stunder', orsak: 'funktionen_ar_inte_aktiverad' }]);
		expect(body.data.kreativa_stunder).toBeUndefined();
		expect(response.headers.get('x-export-complete')).toBe('true');
	});

	it('creative_moments med annat fel än saknad tabell gör exporten ofullständig', async () => {
		mockSupabase({ failOn: 'creative_moments', failError: { code: '57014', message: 'timeout' } });
		const body = await (await call(request())).json();

		expect(body.fullstandig).toBe(false);
		expect(body.saknade_delar).toEqual([{ del: 'kreativa_stunder', orsak: 'kunde_inte_hamtas' }]);
	});

	it('en annan saknad tabell gör alltid exporten ofullständig', async () => {
		mockSupabase({ failOn: 'storify_entries', failError: { code: 'PGRST205', message: 'missing' } });
		const body = await (await call(request())).json();

		expect(body.fullstandig).toBe(false);
		expect(body.saknade_delar).toEqual([{ del: 'berattelser', orsak: 'tabellen_saknas' }]);
		expect(body.ej_aktiverade_funktioner).toEqual([]);
	});

	it('markerar delar som saknas när service role inte är konfigurerad', async () => {
		mockSupabase({ noServiceKey: true });
		const body = await (await call(request())).json();

		expect(body.fullstandig).toBe(false);
		expect(body.saknade_delar.map((row: { del: string }) => row.del).sort()).toEqual(['ai_samtycken', 'forumrapporter']);
	});

	it('markerar fel i chattar och SMS-inställningar', async () => {
		mockSupabase({ failOn: ['messages', 'user_sms_preferences'] });
		const body = await (await call(request())).json();

		expect(body.saknade_delar.map((row: { del: string }) => row.del).sort()).toEqual(['chattar', 'sms_installningar']);
		expect(body.data.sms_installningar).toBeUndefined();
	});

	it('svarar 500 utan att läcka detaljer när ingenting går att hämta', async () => {
		mockSupabase({ failOn: Object.keys(TABLE_ROWS).concat('creative_moments'), noServiceKey: true });
		const response = await call(request());
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.success).toBe(false);
		expect(body.error).not.toMatch(/diary|boom|supabase/i);
	});

	it('en fullständig export markeras som fullständig', async () => {
		mockSupabase();
		const response = await call(request());

		expect(response.headers.get('x-export-complete')).toBe('true');
		expect(response.headers.get('content-disposition')).not.toContain('ofullstandig');
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

describe('den administrativa kodvägen (AI-samtycken och forumrapporter)', () => {
	it('frågar bara de två tabellerna, med fasta kolumner och verifierat id som enda filter', async () => {
		mockSupabase();
		await call(new Request('https://example.com/api/account/export?user_id=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb&reporter_id=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', {
			headers: { Authorization: 'Bearer token-123', 'x-user-id': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }
		}));

		const service = queries.filter((q) => q.key === 'service-key');
		expect(service.map((q) => q.table).sort()).toEqual(['forum_reports', 'user_ai_consents']);
		for (const q of service) {
			expect(q.filters).toHaveLength(1);
			expect(q.filters[0][1]).toBe(USER.id);
		}
	});

	it('forumrapporter innehåller inga modereringsfält eller id:n för rapporterat innehåll', async () => {
		TABLE_ROWS.forum_reports[0] = {
			id: 'fr1', reporter_id: USER.id, reason: 'spam', details: 'Min text', created_at: '2026-01-01T00:00:00Z',
			resolved_at: '2026-01-02T00:00:00Z', thread_id: 'TREDJE-PERSONS-TRAD', reply_id: null
		};
		mockSupabase();
		const body = await (await call(request())).json();

		expect(body.data.forumrapporter).toEqual([{ id: 'fr1', reason: 'spam', details: 'Min text', created_at: '2026-01-01T00:00:00Z' }]);
		expect(JSON.stringify(body)).not.toContain('TREDJE-PERSONS-TRAD');
	});

	it('en rad med fel ägare från serverläsningen returneras aldrig', async () => {
		mocks.createClient.mockImplementation((_url: string, key: string) => ({
			auth: { getUser: async () => ({ data: { user: USER }, error: null }) },
			from: (table: string) => {
				const builder = createBuilder(table, {}, key);
				if (key === 'service-key' && table === 'user_ai_consents') {
					// Simulerar ett fel där filtret inte gäller: alla rader kommer tillbaka
					(builder as Record<string, unknown>).eq = () => builder;
				}
				return builder;
			}
		}));
		serviceKey.value = 'service-key';
		const body = await (await call(request())).json();

		expect(body.data.ai_samtycken).toBeUndefined();
		expect(body.saknade_delar).toContainEqual({ del: 'ai_samtycken', orsak: 'kunde_inte_hamtas' });
		expect(body.fullstandig).toBe(false);
		expect(JSON.stringify(body)).not.toContain('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
	});

	it('loggar aldrig användar-id, innehåll eller nycklar när serverläsningen fallerar', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		mockSupabase({ failOn: ['user_ai_consents', 'forum_reports'], failError: { code: '42501', message: 'permission denied for aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } });
		await call(request());

		const logged = JSON.stringify(spy.mock.calls);
		expect(logged).not.toContain(USER.id);
		expect(logged).not.toContain('service-key');
		expect(logged).not.toContain('permission denied');
		spy.mockRestore();
	});

	it('serverläsningen kan inte importeras från klientkod', async () => {
		const { readFileSync, readdirSync, statSync } = await import('node:fs');
		const { join } = await import('node:path');
		const offenders: string[] = [];
		const walk = (dir: string) => {
			for (const name of readdirSync(dir)) {
				const path = join(dir, name);
				if (statSync(path).isDirectory()) walk(path);
				else if (/\.(svelte|ts)$/.test(name) && !/\+(page|layout)\.server\.ts$|\+server\.ts$|\.test\.ts$/.test(name) && !path.includes('/lib/server/')) {
					if (readFileSync(path, 'utf8').includes('account-export-service-reads')) offenders.push(path);
				}
			}
		};
		walk(join(process.cwd(), 'src'));
		expect(offenders).toEqual([]);
	});
});
