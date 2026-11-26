// Tester för veckospeglingens schema, idempotens och utfall.
// Bara syntetiska data. AI-anropet och samtyckeskontrollen är mockade.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	callClaude: vi.fn(),
	hasConsent: vi.fn(),
	createServiceClient: vi.fn(),
	env: { CRON_SECRET: 'test-hemlighet' } as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$lib/server/ai/anthropic', () => ({ callClaude: mocks.callClaude }));
vi.mock('$lib/server/weekly-summary-ai-consent', () => ({ hasWeeklySummaryAiConsent: mocks.hasConsent }));
vi.mock('$lib/server/supabase-admin', () => ({ createServiceClient: mocks.createServiceClient }));

import {
	currentStockholmWeekStart,
	generateWeeklyReflection,
	shouldRunSpegelvattnetCron,
	summarizeSpegelvattnetRun
} from '$lib/server/spegelvattnet';
import { POST, _resetSpegelvattnetRunLock } from './+server';

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';

type Row = Record<string, unknown>;

/**
 * Fejkad Supabase med tabellerna diary och weekly_reflections. Insert i
 * weekly_reflections upprätthåller unik-villkoret (user_id, week_start) som
 * i den riktiga databasen.
 */
function fakeDb(options: { diary?: Row[]; insertError?: { code: string }; delayInsertMs?: number } = {}) {
	const tables: Record<string, Row[]> = { diary: options.diary ?? [], weekly_reflections: [] };
	const inserts: Row[] = [];
	const builder = (table: string) => {
		let rows = [...tables[table]];
		const chain: Record<string, unknown> = {
			select: () => chain,
			eq: (column: string, value: unknown) => {
				rows = rows.filter((row) => row[column] === value);
				return chain;
			},
			gte: () => chain,
			lt: () => chain,
			order: () => chain,
			maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
			then: (resolve: (value: unknown) => void) => resolve({ data: rows, error: null }),
			insert: async (row: Row) => {
				if (options.delayInsertMs) await new Promise((r) => setTimeout(r, options.delayInsertMs));
				if (options.insertError) return { error: options.insertError };
				const duplicate = tables.weekly_reflections.some(
					(existing) => existing.user_id === row.user_id && existing.week_start === row.week_start
				);
				if (duplicate) {
					return { error: { code: '23505', details: `Key (user_id, week_start)=(${row.user_id}, ${row.week_start}) already exists.` } };
				}
				tables.weekly_reflections.push(row);
				inserts.push(row);
				return { error: null };
			}
		};
		return chain;
	};
	return { client: { from: builder }, tables, inserts };
}

const WEEK = '2026-11-16'; // måndag
function diaryFor(userId: string) {
	return [
		{ id: `${userId}-1`, user_id: userId, text: 'Promenad i skogen och lugn kväll med te.', mood: '6', created_at: '2026-11-17T10:00:00.000Z' },
		{ id: `${userId}-2`, user_id: userId, text: 'Skogen igen, lugn och te efter jobbet.', mood: '7', created_at: '2026-11-19T10:00:00.000Z' }
	];
}

function cronRequest(secret: string | null = 'test-hemlighet', query = '') {
	return new Request(`https://example.test/api/cron/spegelvattnet${query}`, {
		method: 'POST',
		headers: secret ? { 'x-cron-secret': secret } : {}
	});
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const post = (request: Request) => POST({ request, url: new URL(request.url) } as any);

beforeEach(() => {
	vi.useRealTimers();
	mocks.callClaude.mockReset().mockResolvedValue('{"question":"Vad gav dig lugn den här veckan?","sentence":null}');
	mocks.hasConsent.mockReset().mockResolvedValue(true);
	mocks.createServiceClient.mockReset();
	mocks.env.CRON_SECRET = 'test-hemlighet';
	_resetSpegelvattnetRunLock();
});

describe('schemafönster i Europe/Stockholm', () => {
	it.each([
		['vintertid söndag 05:59', '2026-11-22T04:59:00Z', false],
		['vintertid söndag 06:00', '2026-11-22T05:00:00Z', true],
		['vintertid söndag 06:17 (planerad körning)', '2026-11-22T05:17:00Z', true],
		['vintertid söndag 23:59', '2026-11-22T22:59:00Z', true],
		['vintertid måndag 00:30', '2026-11-22T23:30:00Z', false],
		['sommartid söndag 05:59', '2026-07-05T03:59:00Z', false],
		['sommartid söndag 06:00', '2026-07-05T04:00:00Z', true],
		['sommartid söndag 07:17 (planerad körning)', '2026-07-05T05:17:00Z', true],
		['sommartid söndag 23:59', '2026-07-05T21:59:00Z', true],
		['sommartid måndag 00:00', '2026-07-05T22:00:00Z', false],
		['dagen sommartid börjar, 05:17 UTC', '2026-03-29T05:17:00Z', true],
		['dagen vintertid börjar, 05:17 UTC', '2026-10-25T05:17:00Z', true],
		['dagen vintertid börjar, 04:59 UTC (05:59)', '2026-10-25T04:59:00Z', false],
		['lördag kväll', '2026-11-21T20:00:00Z', false]
	])('%s', (_label, iso, expected) => {
		expect(shouldRunSpegelvattnetCron(new Date(iso))).toBe(expected);
	});

	it('alla planerade tider i workflowen hamnar inom fönstret året runt', async () => {
		const { readFileSync } = await import('node:fs');
		const workflow = readFileSync('.github/workflows/spegelvattnet.yml', 'utf8');
		const cron = workflow.match(/cron: '(\d+) ([\d,]+) \* \* 0'/);
		expect(cron).not.toBeNull();
		const minute = Number(cron![1]);
		const hours = cron![2].split(',').map(Number);
		expect(hours.length).toBeGreaterThanOrEqual(3);
		expect(minute).not.toBe(0);
		// En söndag med vintertid och en med sommartid
		for (const sunday of ['2026-01-04', '2026-07-05', '2026-03-29', '2026-10-25']) {
			for (const hour of hours) {
				const date = new Date(`${sunday}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`);
				expect(shouldRunSpegelvattnetCron(date), `${sunday} ${hour}:${minute} UTC`).toBe(true);
			}
		}
		expect(workflow).toMatch(/concurrency:\s*\n\s*group: spegelvattnet/);
	});

	it('veckostarten är samma måndag hela söndagen, även när klockan ställs om', () => {
		expect(currentStockholmWeekStart(new Date('2026-10-25T05:17:00Z'))).toBe('2026-10-19');
		expect(currentStockholmWeekStart(new Date('2026-10-25T21:59:00Z'))).toBe('2026-10-19');
		expect(currentStockholmWeekStart(new Date('2026-03-29T05:17:00Z'))).toBe('2026-03-23');
		expect(currentStockholmWeekStart(new Date('2026-11-22T22:59:00Z'))).toBe('2026-11-16');
	});
});

describe('idempotens och dubbletter', () => {
	it('en redan genererad vecka hoppas över utan AI-anrop', async () => {
		const db = fakeDb({ diary: diaryFor(USER_A) });
		db.tables.weekly_reflections.push({ id: 'w1', user_id: USER_A, week_start: WEEK });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await generateWeeklyReflection(db.client as any, USER_A, WEEK);
		expect(result).toEqual({ skipped: true, reason: 'already_exists' });
		expect(mocks.callClaude).not.toHaveBeenCalled();
	});

	it('en samtidig körning som hinner spara först ger redan genererad, inte fel', async () => {
		const db = fakeDb({ diary: diaryFor(USER_A), delayInsertMs: 20 });
		const [first, second] = await Promise.all([
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			generateWeeklyReflection(db.client as any, USER_A, WEEK),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			generateWeeklyReflection(db.client as any, USER_A, WEEK)
		]);
		expect([first, second]).toContainEqual({ skipped: false, status: 'ready' });
		expect([first, second]).toContainEqual({ skipped: true, reason: 'already_exists' });
		expect(db.inserts).toHaveLength(1);
	});

	it('loggar bara felkoden, aldrig användar-id från unik-felet', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const db = fakeDb({ diary: diaryFor(USER_A), insertError: { code: '57014' } });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await generateWeeklyReflection(db.client as any, USER_A, WEEK);
		expect(result).toEqual({ skipped: true, reason: 'insert_failed' });
		expect(JSON.stringify(spy.mock.calls)).not.toContain(USER_A);
		spy.mockRestore();
	});

	it('utan samtycke görs inget AI-anrop', async () => {
		mocks.hasConsent.mockResolvedValue(false);
		const db = fakeDb({ diary: diaryFor(USER_A) });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await generateWeeklyReflection(db.client as any, USER_A, WEEK);
		expect(result).toEqual({ skipped: true, reason: 'consent_required' });
		expect(mocks.callClaude).not.toHaveBeenCalled();
	});
});

describe('utfall', () => {
	it('fel vinner alltid över lyckade delar', () => {
		expect(summarizeSpegelvattnetRun({ generated: 3, paused: 0, alreadyGenerated: 1, skipped: 0, errors: 1 })).toBe('failed');
		expect(summarizeSpegelvattnetRun({ generated: 0, paused: 1, alreadyGenerated: 0, skipped: 0, errors: 0 })).toBe('generated');
		expect(summarizeSpegelvattnetRun({ generated: 0, paused: 0, alreadyGenerated: 2, skipped: 1, errors: 0 })).toBe('already_generated');
		expect(summarizeSpegelvattnetRun({ generated: 0, paused: 0, alreadyGenerated: 0, skipped: 4, errors: 0 })).toBe('nothing_to_do');
	});
});

describe('cron-endpointen', () => {
	it('nekar fel eller saknad hemlighet med 401', async () => {
		expect((await post(cronRequest('fel'))).status).toBe(401);
		expect((await post(cronRequest(null))).status).toBe(401);
		mocks.env.CRON_SECRET = undefined;
		expect((await post(cronRequest('test-hemlighet'))).status).toBe(401);
	});

	it('utanför fönstret: överhoppad, ingen databas eller AI', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-24T10:00:00Z')); // tisdag
		const response = await post(cronRequest());
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ outcome: 'skipped', reason: 'outside_stockholm_schedule' });
		expect(mocks.createServiceClient).not.toHaveBeenCalled();
	});

	it('genererar, och en andra körning samma söndag ger redan genererad utan nya AI-anrop', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-22T05:17:00Z'));
		const db = fakeDb({ diary: [...diaryFor(USER_A), ...diaryFor(USER_B)] });
		mocks.createServiceClient.mockReturnValue(db.client);

		const first = await post(cronRequest());
		expect(first.status).toBe(200);
		const firstBody = await first.json();
		expect(firstBody).toMatchObject({ outcome: 'generated', generated: 2, errors: 0, weekStart: WEEK });
		const aiCalls = mocks.callClaude.mock.calls.length;

		const second = await post(cronRequest());
		expect(await second.json()).toMatchObject({ outcome: 'already_generated', alreadyGenerated: 2, generated: 0 });
		expect(mocks.callClaude.mock.calls.length).toBe(aiCalls);
		expect(db.inserts).toHaveLength(2);
		// Svaret innehåller bara antal
		expect(JSON.stringify(firstBody)).not.toMatch(new RegExp(`${USER_A}|${USER_B}|skogen`, 'i'));
	});

	it('två samtidiga anrop: det andra får 202 och gör inget', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-22T09:17:00Z'));
		const db = fakeDb({ diary: diaryFor(USER_A), delayInsertMs: 30 });
		mocks.createServiceClient.mockReturnValue(db.client);

		const [a, b] = await Promise.all([post(cronRequest()), post(cronRequest())]);
		const statuses = [a.status, b.status].sort();
		expect(statuses).toEqual([200, 202]);
		expect(db.inserts).toHaveLength(1);
	});

	it('ett fel ger 500 och utfallet failed', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-22T13:17:00Z'));
		const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const db = fakeDb({ diary: diaryFor(USER_A), insertError: { code: '57014' } });
		mocks.createServiceClient.mockReturnValue(db.client);

		const response = await post(cronRequest());
		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ outcome: 'failed', errors: 1 });
		spy.mockRestore();
	});

	it('saknad serverkonfiguration ger 500', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-22T13:17:00Z'));
		mocks.createServiceClient.mockReturnValue(null);
		expect((await post(cronRequest())).status).toBe(500);
	});
});
