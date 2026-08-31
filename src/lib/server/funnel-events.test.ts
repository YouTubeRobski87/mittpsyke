import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// $env/dynamic/private finns inte utanför SvelteKit-runtime. Mockas så att
// hemligheten kan varieras per test.
const mockEnv: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

type InsertPayload = {
	event_name: string;
	user_ref: string;
	is_internal: boolean;
	properties: Record<string, unknown>;
};

const insertCalls: InsertPayload[] = [];
let insertResult: { error: { code?: string; message?: string } | null } = { error: null };
let serviceClientAvailable = true;

vi.mock('$lib/server/supabase-admin', async (importOriginal) => ({
	// isMissingTableError m.fl. behålls äkta - bara service-klienten byts ut.
	...(await importOriginal<typeof import('$lib/server/supabase-admin')>()),
	createServiceClient: () => {
		if (!serviceClientAvailable) return null;

		return {
			from: () => ({
				insert: (payload: InsertPayload) => {
					insertCalls.push(payload);
					return Promise.resolve(insertResult);
				}
			})
		};
	}
}));

const {
	createUserRef,
	recordDiaryFunnelEvents,
	recordFunnelEvent,
	resolveDiaryFunnelEvents,
	sanitizeFunnelProperties
} = await import('./funnel-events');

const USER_ID = '11111111-2222-4333-8444-555555555555';
const OTHER_USER_ID = '99999999-8888-4777-8666-555555555555';

type Row = { id: string; created_at: string };

type QueryError = { code?: string; message?: string };

/**
 * Fake av den RLS-begränsade klienten som utgår från en verklig raduppsättning
 * i stället för handplockade svar. Den svarar på de två frågor
 * recordDiaryFunnelEvents ställer: tidigaste raden, och senaste raden strikt
 * före en given tidpunkt. Att låta faken räkna ut svaren ur raderna gör att
 * testerna inte kan råka beskriva ett omöjligt databastillstånd.
 */
function fakeSupabase(
	rows: Row[],
	errors: { earliest?: QueryError; previous?: QueryError } = {}
) {
	function makeChain() {
		let ltBound: string | null = null;

		const chain = {
			select: () => chain,
			eq: () => chain,
			lt: (_column: string, value: string) => {
				ltBound = value;
				return chain;
			},
			order: () => chain,
			limit: () => chain,
			maybeSingle: () => {
				if (ltBound !== null) {
					if (errors.previous) return Promise.resolve({ data: null, error: errors.previous });

					const bound = ltBound;
					const before = rows
						.filter((row) => row.created_at < bound)
						.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

					return Promise.resolve({ data: before[0] ?? null, error: null });
				}

				if (errors.earliest) return Promise.resolve({ data: null, error: errors.earliest });

				const ascending = [...rows].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
				return Promise.resolve({ data: ascending[0] ?? null, error: null });
			}
		};

		return chain;
	}

	return { from: () => makeChain() } as never;
}

/** Kör en sparning mot en historik och returnerar vilka event som skrevs. */
async function saveAndCollect(history: Row[], inserted: Row) {
	insertCalls.length = 0;
	await recordDiaryFunnelEvents(fakeSupabase([...history, inserted]), USER_ID, inserted);
	return insertCalls.map((call) => call.event_name);
}

beforeEach(() => {
	for (const key of Object.keys(mockEnv)) delete mockEnv[key];
	mockEnv.FUNNEL_USER_REF_SALT = 'test-salt';
	insertCalls.length = 0;
	insertResult = { error: null };
	serviceClientAvailable = true;
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

// ── Beslutslogiken, utan databas ────────────────────────────────────────────

describe('resolveDiaryFunnelEvents', () => {
	it('första lyckade sparningen ger first_entry_saved', () => {
		expect(
			resolveDiaryFunnelEvents({
				insertedId: 'entry-1',
				insertedCreatedAt: '2026-05-04T09:00:00Z',
				earliestId: 'entry-1',
				earliestCreatedAt: '2026-05-04T09:00:00Z',
				previousCreatedAt: null
			})
		).toEqual(['first_entry_saved']);
	});

	it('andra sparningen samma dygn ger inga event', () => {
		expect(
			resolveDiaryFunnelEvents({
				insertedId: 'entry-2',
				insertedCreatedAt: '2026-05-04T11:00:00Z',
				earliestId: 'entry-1',
				earliestCreatedAt: '2026-05-04T09:00:00Z',
				previousCreatedAt: '2026-05-04T09:00:00Z'
			})
		).toEqual([]);
	});

	it('sparning nästa dygn ger second_active_day', () => {
		expect(
			resolveDiaryFunnelEvents({
				insertedId: 'entry-2',
				insertedCreatedAt: '2026-05-05T09:00:00Z',
				earliestId: 'entry-1',
				earliestCreatedAt: '2026-05-04T09:00:00Z',
				previousCreatedAt: '2026-05-04T09:00:00Z'
			})
		).toEqual(['second_active_day']);
	});

	it('ger inget event när föregående rad redan ligger efter dag 1', () => {
		// Användaren hade redan dag 1 och dag 2. Den här sparningen på dag 20 är
		// inte den som etablerade det andra dygnet.
		expect(
			resolveDiaryFunnelEvents({
				insertedId: 'entry-9',
				insertedCreatedAt: '2026-05-24T09:00:00Z',
				earliestId: 'entry-1',
				earliestCreatedAt: '2026-05-04T09:00:00Z',
				previousCreatedAt: '2026-05-05T09:00:00Z'
			})
		).toEqual([]);
	});

	it('Stockholm-midnatt: samma UTC-datum men två svenska dygn ger second_active_day', () => {
		// 21:30Z = 23:30 svensk tid (15/7), 22:30Z = 00:30 svensk tid (16/7).
		// Båda ligger på UTC-datumet 2026-07-15 - en UTC-baserad jämförelse hade
		// missat att användaren faktiskt var aktiv två svenska dygn.
		expect(
			resolveDiaryFunnelEvents({
				insertedId: 'entry-2',
				insertedCreatedAt: '2026-07-15T22:30:00Z',
				earliestId: 'entry-1',
				earliestCreatedAt: '2026-07-15T21:30:00Z',
				previousCreatedAt: '2026-07-15T21:30:00Z'
			})
		).toEqual(['second_active_day']);
	});

	it('Stockholm-midnatt: två UTC-datum men samma svenska dygn ger inget event', () => {
		// 15/7 23:00Z och 16/7 10:00Z är olika UTC-datum men båda 16/7 svensk
		// tid. En UTC-baserad jämförelse hade felaktigt utlöst second_active_day.
		expect(
			resolveDiaryFunnelEvents({
				insertedId: 'entry-2',
				insertedCreatedAt: '2026-07-16T10:00:00Z',
				earliestId: 'entry-1',
				earliestCreatedAt: '2026-07-15T23:00:00Z',
				previousCreatedAt: '2026-07-15T23:00:00Z'
			})
		).toEqual([]);
	});

	it('sommartidens start (29/3, CET→CEST) håller ihop dygnet', () => {
		// 00:30Z = 01:30 CET, 01:30Z = 03:30 CEST. Klockan hoppar över en timme
		// men dygnet är detsamma.
		expect(
			resolveDiaryFunnelEvents({
				insertedId: 'entry-2',
				insertedCreatedAt: '2026-03-29T01:30:00Z',
				earliestId: 'entry-1',
				earliestCreatedAt: '2026-03-29T00:30:00Z',
				previousCreatedAt: '2026-03-29T00:30:00Z'
			})
		).toEqual([]);
	});

	it('sommartidens slut (25/10, CEST→CET) dubblerar inte dygnet', () => {
		// 00:30Z = 02:30 CEST och 01:30Z = 02:30 CET - samma lokala klockslag
		// två gånger samma dygn. Ska inte räknas som två aktiva dagar.
		expect(
			resolveDiaryFunnelEvents({
				insertedId: 'entry-2',
				insertedCreatedAt: '2026-10-25T01:30:00Z',
				earliestId: 'entry-1',
				earliestCreatedAt: '2026-10-25T00:30:00Z',
				previousCreatedAt: '2026-10-25T00:30:00Z'
			})
		).toEqual([]);
	});

	it('sparning över sommartidsgränsen ger second_active_day', () => {
		// 24/10 22:30Z = 25/10 00:30 CEST, 25/10 23:30Z = 26/10 00:30 CET.
		expect(
			resolveDiaryFunnelEvents({
				insertedId: 'entry-2',
				insertedCreatedAt: '2026-10-25T23:30:00Z',
				earliestId: 'entry-1',
				earliestCreatedAt: '2026-10-24T22:30:00Z',
				previousCreatedAt: '2026-10-24T22:30:00Z'
			})
		).toEqual(['second_active_day']);
	});
});

// ── §9 A-E: semantiken mot verklig historik ─────────────────────────────────

describe('second_active_day mot verklig dagbokshistorik', () => {
	const DAY_1 = { id: 'h-1', created_at: '2026-05-04T09:00:00Z' };
	const DAY_2 = { id: 'h-2', created_at: '2026-05-05T09:00:00Z' };

	it('A. historisk användare med två dygn får inget event vid en tredje dag', async () => {
		const inserted = { id: 'new-1', created_at: '2026-05-24T09:00:00Z' };

		expect(await saveAndCollect([DAY_1, DAY_2], inserted)).toEqual([]);
	});

	it('A. historisk användare med tre dygn får inget event vid en fjärde dag', async () => {
		const DAY_3 = { id: 'h-3', created_at: '2026-05-06T09:00:00Z' };
		const inserted = { id: 'new-1', created_at: '2026-05-24T09:00:00Z' };

		expect(await saveAndCollect([DAY_1, DAY_2, DAY_3], inserted)).toEqual([]);
	});

	it('B. historisk användare med bara ett dygn får second_active_day på nästa dygn', async () => {
		const sameDay = { id: 'h-1b', created_at: '2026-05-04T20:00:00Z' };
		const inserted = { id: 'new-1', created_at: '2026-05-24T09:00:00Z' };

		expect(await saveAndCollect([DAY_1, sameDay], inserted)).toEqual(['second_active_day']);
	});

	it('C. ny användare: dag 1 ger first_entry_saved, dag 2 ger second_active_day', async () => {
		const first = { id: 'n-1', created_at: '2026-05-04T09:00:00Z' };
		const second = { id: 'n-2', created_at: '2026-05-05T09:00:00Z' };

		expect(await saveAndCollect([], first)).toEqual(['first_entry_saved']);
		expect(await saveAndCollect([first], second)).toEqual(['second_active_day']);
	});

	it('D. tre sparningar på tre dygn ger second_active_day endast på dag 2', async () => {
		const d1 = { id: 'n-1', created_at: '2026-05-04T09:00:00Z' };
		const d2 = { id: 'n-2', created_at: '2026-05-05T09:00:00Z' };
		const d3 = { id: 'n-3', created_at: '2026-05-06T09:00:00Z' };

		expect(await saveAndCollect([], d1)).toEqual(['first_entry_saved']);
		expect(await saveAndCollect([d1], d2)).toEqual(['second_active_day']);
		expect(await saveAndCollect([d1, d2], d3)).toEqual([]);
	});

	it('E. flera sparningar samma dygn ger inget second_active_day', async () => {
		const d1 = { id: 'n-1', created_at: '2026-05-04T09:00:00Z' };
		const d1b = { id: 'n-2', created_at: '2026-05-04T13:00:00Z' };
		const d1c = { id: 'n-3', created_at: '2026-05-04T21:00:00Z' };

		expect(await saveAndCollect([], d1)).toEqual(['first_entry_saved']);
		expect(await saveAndCollect([d1], d1b)).toEqual([]);
		expect(await saveAndCollect([d1, d1b], d1c)).toEqual([]);
	});

	it('andra sparningen på dag 2 ger inget nytt event', async () => {
		const d1 = { id: 'n-1', created_at: '2026-05-04T09:00:00Z' };
		const d2 = { id: 'n-2', created_at: '2026-05-05T09:00:00Z' };
		const d2b = { id: 'n-3', created_at: '2026-05-05T18:00:00Z' };

		expect(await saveAndCollect([d1], d2)).toEqual(['second_active_day']);
		expect(await saveAndCollect([d1, d2], d2b)).toEqual([]);
	});

	it('F. Stockholm-midnatt mot verklig historik', async () => {
		const late = { id: 'n-1', created_at: '2026-07-15T21:30:00Z' };
		const justAfterMidnight = { id: 'n-2', created_at: '2026-07-15T22:30:00Z' };

		expect(await saveAndCollect([late], justAfterMidnight)).toEqual(['second_active_day']);
	});

	it('G. DST mot verklig historik: repeterad timme ger inget event', async () => {
		const beforeShift = { id: 'n-1', created_at: '2026-10-25T00:30:00Z' };
		const afterShift = { id: 'n-2', created_at: '2026-10-25T01:30:00Z' };

		expect(await saveAndCollect([beforeShift], afterShift)).toEqual([]);
	});

	it('samtidiga första sparningar på dag 2 tystar aldrig båda', async () => {
		// Ingen av dem ser den andra ännu. Båda försöker skriva, och
		// unique-constraintet gör den andra till en duplicate. Eventet kan
		// dubbleras bort - aldrig försvinna.
		const d1 = { id: 'n-1', created_at: '2026-05-04T09:00:00Z' };
		const raceA = { id: 'n-2', created_at: '2026-05-05T09:00:00.001Z' };
		const raceB = { id: 'n-3', created_at: '2026-05-05T09:00:00.002Z' };

		expect(await saveAndCollect([d1], raceA)).toEqual(['second_active_day']);
		expect(await saveAndCollect([d1], raceB)).toEqual(['second_active_day']);
	});
});

// ── first_entry_saved ───────────────────────────────────────────────────────

describe('first_entry_saved', () => {
	it('skrivs för den faktiskt tidigaste kvarvarande raden', async () => {
		const first = { id: 'n-1', created_at: '2026-05-04T09:00:00Z' };

		expect(await saveAndCollect([], first)).toEqual(['first_entry_saved']);
	});

	it('skrivs inte retroaktivt för en befintlig användare vid nästa sparning', async () => {
		const history = [
			{ id: 'h-1', created_at: '2026-05-04T09:00:00Z' },
			{ id: 'h-2', created_at: '2026-05-05T09:00:00Z' }
		];
		const inserted = { id: 'new-1', created_at: '2026-05-24T09:00:00Z' };

		expect(await saveAndCollect(history, inserted)).not.toContain('first_entry_saved');
	});

	it('skrivs inte för en andra sparning samma dygn', async () => {
		const first = { id: 'n-1', created_at: '2026-05-04T09:00:00Z' };
		const second = { id: 'n-2', created_at: '2026-05-04T20:00:00Z' };

		expect(await saveAndCollect([first], second)).toEqual([]);
	});
});

// ── user_ref ────────────────────────────────────────────────────────────────

describe('createUserRef', () => {
	it('är deterministisk för samma user-id', () => {
		expect(createUserRef(USER_ID)).toBe(createUserRef(USER_ID));
	});

	it('ger olika värde för olika user-id', () => {
		expect(createUserRef(USER_ID)).not.toBe(createUserRef(OTHER_USER_ID));
	});

	it('innehåller aldrig det råa user-id:t', () => {
		const ref = createUserRef(USER_ID);
		expect(ref).not.toBeNull();
		expect(ref).not.toContain(USER_ID);
		expect(ref).toMatch(/^[0-9a-f]{64}$/);
	});

	it('byter värde när hemligheten byts, så den inte går att räkna fram utan salt', () => {
		const first = createUserRef(USER_ID);
		mockEnv.FUNNEL_USER_REF_SALT = 'another-salt';
		expect(createUserRef(USER_ID)).not.toBe(first);
	});

	it('failar stängt utan dedikerad hemlighet', () => {
		delete mockEnv.FUNNEL_USER_REF_SALT;
		expect(createUserRef(USER_ID)).toBeNull();
	});

	it('lånar aldrig service-role-nyckeln som salt', () => {
		// Rotation av service-role-nyckeln skulle annars tyst byta varje
		// user_ref och därmed nollställa idempotensen.
		delete mockEnv.FUNNEL_USER_REF_SALT;
		mockEnv.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
		mockEnv.SERVICE_ROLE_KEY = 'service-key';
		mockEnv.STORY_RATE_LIMIT_SALT = 'story-salt';
		mockEnv.IP_HASH_SALT = 'ip-salt';

		expect(createUserRef(USER_ID)).toBeNull();
	});
});

// ── Properties-allowlist ────────────────────────────────────────────────────

describe('sanitizeFunnelProperties', () => {
	const FORBIDDEN = {
		text: 'jag känner mig helt slut idag',
		excerpt: 'jag känner mig',
		word_count: 6,
		char_count: 29,
		mood: 'nedstämd',
		tags: ['ångest'],
		prompt_question: 'Hur känns det just nu?',
		daily_question_id: 'c0ffee00-dead-4bee-8fee-000000000000',
		image_url: 'https://example.test/a.png',
		video_path: 'diary-videos/a.mp4',
		email: 'user@example.test',
		name: 'Anna',
		user_metadata: { role: 'admin' },
		diagnosis: 'GAD',
		emotion: 'oro',
		ai_content: 'Det låter tungt.'
	};

	it('förbjudna properties tas bort för first_entry_saved', () => {
		expect(sanitizeFunnelProperties('first_entry_saved', FORBIDDEN)).toEqual({});
	});

	it('förbjudna properties tas bort för second_active_day', () => {
		expect(sanitizeFunnelProperties('second_active_day', FORBIDDEN)).toEqual({});
	});

	it('förbjudna properties når aldrig databasen via recordFunnelEvent', async () => {
		await recordFunnelEvent({
			eventName: 'first_entry_saved',
			userId: USER_ID,
			properties: FORBIDDEN
		});

		expect(insertCalls).toHaveLength(1);
		expect(insertCalls[0].properties).toEqual({});

		const serialized = JSON.stringify(insertCalls[0]);
		for (const forbidden of ['slut idag', 'nedstämd', 'example.test', 'Anna', 'GAD', USER_ID]) {
			expect(serialized).not.toContain(forbidden);
		}
	});
});

// ── H: idempotens ───────────────────────────────────────────────────────────

describe('recordFunnelEvent', () => {
	it('skriver eventet med pseudonym och is_internal = false', async () => {
		const result = await recordFunnelEvent({ eventName: 'first_entry_saved', userId: USER_ID });

		expect(result.status).toBe('written');
		expect(insertCalls[0].event_name).toBe('first_entry_saved');
		expect(insertCalls[0].user_ref).toMatch(/^[0-9a-f]{64}$/);
		expect(insertCalls[0].is_internal).toBe(false);
	});

	it('H. unique_violation behandlas som duplicate, inte som fel', async () => {
		insertResult = { error: { code: '23505', message: 'duplicate key value' } };

		const result = await recordFunnelEvent({ eventName: 'second_active_day', userId: USER_ID });

		expect(result.status).toBe('duplicate');
	});

	it('H. samma event två gånger ger written och sedan duplicate', async () => {
		const first = await recordFunnelEvent({ eventName: 'second_active_day', userId: USER_ID });
		insertResult = { error: { code: '23505', message: 'duplicate key value' } };
		const second = await recordFunnelEvent({ eventName: 'second_active_day', userId: USER_ID });

		expect(first.status).toBe('written');
		expect(second.status).toBe('duplicate');
	});

	it('hoppar över skrivning utan salt', async () => {
		delete mockEnv.FUNNEL_USER_REF_SALT;

		const result = await recordFunnelEvent({ eventName: 'first_entry_saved', userId: USER_ID });

		expect(result.status).toBe('skipped_no_salt');
		expect(insertCalls).toHaveLength(0);
	});

	it('hoppar över skrivning utan service-klient', async () => {
		serviceClientAvailable = false;

		const result = await recordFunnelEvent({ eventName: 'first_entry_saved', userId: USER_ID });

		expect(result.status).toBe('skipped_no_service_client');
	});

	it('behandlar saknad tabell som skipped, inte som fel', async () => {
		insertResult = { error: { code: 'PGRST205', message: 'Could not find the table' } };

		const result = await recordFunnelEvent({ eventName: 'first_entry_saved', userId: USER_ID });

		expect(result.status).toBe('skipped_missing_table');
		expect(console.error).not.toHaveBeenCalled();
	});

	it('I. kastar aldrig vid databasfel', async () => {
		insertResult = { error: { code: '08006', message: 'connection failure' } };

		await expect(
			recordFunnelEvent({ eventName: 'first_entry_saved', userId: USER_ID })
		).resolves.toEqual({ status: 'failed', eventName: 'first_entry_saved' });
	});
});

// ── I: analytics får aldrig fälla dagbokssparningen ─────────────────────────

describe('recordDiaryFunnelEvents', () => {
	const inserted = { id: 'entry-1', created_at: '2026-05-04T09:00:00Z' };

	it('I. kastar aldrig när event-skrivningen misslyckas', async () => {
		insertResult = { error: { code: '08006', message: 'connection failure' } };

		await expect(
			recordDiaryFunnelEvents(fakeSupabase([inserted]), USER_ID, inserted)
		).resolves.toEqual([{ status: 'failed', eventName: 'first_entry_saved' }]);
	});

	it('I. kastar aldrig när uppslaget av tidigaste raden misslyckas', async () => {
		await expect(
			recordDiaryFunnelEvents(
				fakeSupabase([inserted], { earliest: { code: '42501' } }),
				USER_ID,
				inserted
			)
		).resolves.toEqual([]);
		expect(insertCalls).toHaveLength(0);
	});

	it('I. kastar aldrig när uppslaget av föregående rad misslyckas', async () => {
		const history = [{ id: 'h-1', created_at: '2026-05-03T09:00:00Z' }];

		await expect(
			recordDiaryFunnelEvents(
				fakeSupabase([...history, inserted], { previous: { code: '42501' } }),
				USER_ID,
				inserted
			)
		).resolves.toEqual([]);
		expect(insertCalls).toHaveLength(0);
	});

	it('I. kastar aldrig när klienten själv kastar', async () => {
		const throwing = {
			from: () => {
				throw new Error('nätverket är nere');
			}
		} as never;

		await expect(recordDiaryFunnelEvents(throwing, USER_ID, inserted)).resolves.toEqual([]);
	});
});

// ── Migrationens säkerhetsdefinition ────────────────────────────────────────

describe('product_funnel_events-migrationen', () => {
	const raw = readFileSync(
		join(process.cwd(), 'supabase/migrations/20260831120000_product_funnel_events.sql'),
		'utf-8'
	);

	// Kommentarerna förklarar bland annat varför analytics_events USING (true)
	// är olämpligt. Testerna gäller de faktiska satserna, inte prosan.
	const sql = raw
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');

	it('slår på RLS', () => {
		expect(sql).toMatch(/alter table public\.product_funnel_events enable row level security/);
	});

	it('återkallar rättigheter för anon, authenticated och public', () => {
		for (const role of ['public', 'anon', 'authenticated']) {
			expect(sql).toMatch(
				new RegExp(`revoke all on table public\\.product_funnel_events from ${role}`)
			);
		}
	});

	it('ger bara service_role rättigheter', () => {
		expect(sql).toMatch(
			/grant select, insert on table public\.product_funnel_events to service_role/
		);
		expect(sql).not.toMatch(/grant[^;]*to (anon|authenticated|public)/);
	});

	it('skapar ingen policy, så anon och authenticated nekas av RLS', () => {
		expect(sql).not.toMatch(/create policy/i);
		expect(sql).not.toMatch(/using \(true\)/i);
	});

	it('har uniqueness per user_ref och event_name', () => {
		expect(sql).toMatch(/unique \(user_ref, event_name\)/);
	});

	it('begränsar event_name till passets två event', () => {
		expect(sql).toMatch(/check \(event_name in \('first_entry_saved', 'second_active_day'\)\)/);
	});

	it('lagrar varken rått user_id, e-post eller innehållsfält', () => {
		for (const forbidden of [
			'user_id',
			'email',
			'mood',
			'word_count',
			'anonymous_visitor_id',
			'session_id',
			'landing_page_id',
			'ab_test_id'
		]) {
			// Kolumndefinitioner står först på raden efter en tab-indentering.
			expect(sql).not.toMatch(new RegExp(`^\\t${forbidden} `, 'm'));
		}
	});
});
