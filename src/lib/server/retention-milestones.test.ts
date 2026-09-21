import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const mockEnv: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

type StoredRow = {
	event_name: string;
	user_ref: string;
	is_internal: boolean;
	properties: Record<string, unknown>;
	occurred_at: string;
};

const rows: StoredRow[] = [];
const insertedPayloads: Array<Omit<StoredRow, 'occurred_at'>> = [];
let serviceClientAvailable = true;
let selectError: { code?: string; message?: string } | null = null;
let insertError: { code?: string; message?: string } | null = null;
let activationInsertAt = '2026-09-21T10:00:00.000Z';
let forceActivationRace = false;

function fakeServiceClient() {
	return {
		from: () => ({
			select: () => {
				let userRef = '';
				let eventName = '';
				const chain = {
					eq: (column: string, value: string) => {
						if (column === 'user_ref') userRef = value;
						if (column === 'event_name') eventName = value;
						return chain;
					},
					maybeSingle: async () => ({
						data: rows.find((row) => row.user_ref === userRef && row.event_name === eventName) ?? null,
						error: selectError
					})
				};
				return chain;
			},
			insert: (payload: Omit<StoredRow, 'occurred_at'>) => {
				insertedPayloads.push(payload);
				const directResult = async () => {
					if (insertError) return { data: null, error: insertError };
					const duplicate = rows.some(
						(row) => row.user_ref === payload.user_ref && row.event_name === payload.event_name
					);
					if (duplicate) return { data: null, error: { code: '23505', message: 'duplicate' } };
					rows.push({ ...payload, occurred_at: new Date().toISOString() });
					return { data: null, error: null };
				};

				return {
					then: (resolve: (value: unknown) => unknown) => directResult().then(resolve),
					select: () => ({
						single: async () => {
							if (forceActivationRace) {
								forceActivationRace = false;
								rows.push({ ...payload, occurred_at: activationInsertAt });
								return { data: null, error: { code: '23505', message: 'duplicate' } };
							}
							if (insertError) return { data: null, error: insertError };
							const duplicate = rows.some(
								(row) => row.user_ref === payload.user_ref && row.event_name === payload.event_name
							);
							if (duplicate) {
								return { data: null, error: { code: '23505', message: 'duplicate' } };
							}
							const stored = { ...payload, occurred_at: activationInsertAt };
							rows.push(stored);
							return { data: { occurred_at: stored.occurred_at }, error: null };
						}
					})
				};
			}
		})
	};
}

vi.mock('$lib/server/supabase-admin', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/server/supabase-admin')>()),
	createServiceClient: () => (serviceClientAvailable ? fakeServiceClient() : null)
}));

const {
	createUserRef,
	getRetentionCohortStart,
	isRetentionCohortEligible,
	recordMeaningfulReflectionMilestones,
	resolveRetentionMilestone,
	sanitizeFunnelProperties
} = await import('./funnel-events');

const USER_ID = '11111111-2222-4333-8444-555555555555';
const COHORT_START = '2026-09-20T00:00:00Z';

beforeEach(() => {
	for (const key of Object.keys(mockEnv)) delete mockEnv[key];
	mockEnv.FUNNEL_USER_REF_SALT = 'retention-test-salt';
	mockEnv.RETENTION_COHORT_START = COHORT_START;
	rows.length = 0;
	insertedPayloads.length = 0;
	serviceClientAvailable = true;
	selectError = null;
	insertError = null;
	activationInsertAt = '2026-09-21T10:00:00.000Z';
	forceActivationRace = false;
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('prospektiv cohort', () => {
	const now = new Date('2026-09-21T12:00:00Z');
	const actionAt = '2026-09-21T10:00:00Z';

	it('nekar konto före start men tillåter exakt vid och efter start', () => {
		expect(isRetentionCohortEligible('2026-09-19T23:59:59Z', actionAt, now)).toBe(false);
		expect(isRetentionCohortEligible(COHORT_START, actionAt, now)).toBe(true);
		expect(isRetentionCohortEligible('2026-09-20T00:00:01Z', actionAt, now)).toBe(true);
	});

	it('failar stängt för saknad, ogiltig och orimligt framtida konfiguration', () => {
		delete mockEnv.RETENTION_COHORT_START;
		expect(getRetentionCohortStart(now)).toBeNull();
		mockEnv.RETENTION_COHORT_START = 'inte-ett-datum';
		expect(getRetentionCohortStart(now)).toBeNull();
		mockEnv.RETENTION_COHORT_START = '2026-09-21T12:05:01Z';
		expect(getRetentionCohortStart(now)).toBeNull();
	});
});

describe('retentionfönster i Stockholm', () => {
	const activation = '2026-10-24T22:30:00Z'; // 25/10 00:30 i Stockholm

	it.each([
		[5, null],
		[6, 'w1_return'],
		[7, 'w1_return'],
		[8, 'w1_return'],
		[9, null],
		[26, null],
		[27, 'w4_return'],
		[34, 'w4_return'],
		[35, null]
	] as const)('dag %i ger %s', (day, expected) => {
		const actionDay = new Date(Date.UTC(2026, 9, 25 + day, 12)).toISOString();
		expect(resolveRetentionMilestone(activation, actionDay)).toBe(expected);
	});
});

describe('activation och cross-feature milestones', () => {
	it('konto före cohort-start får inga nya milestones eller databasanrop', async () => {
		const result = await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: '2026-09-19T23:59:59Z',
			actionOccurredAt: '2026-09-21T10:00:00Z'
		});

		expect(result.status).toBe('ineligible');
		expect(insertedPayloads).toHaveLength(0);
	});

	it.each(['diary', 'chat', 'evening'] as const)('första %s-reflection skapar activation', async () => {
		const result = await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: '2026-09-21T10:00:00Z'
		});

		expect(result).toMatchObject({
			status: 'activation_written',
			eventName: 'first_meaningful_reflection',
			activationOccurredAt: activationInsertAt
		});
	});

	it('diary activation kan följas av chat W1', async () => {
		await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: activationInsertAt
		});
		const result = await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: '2026-09-27T10:00:00Z'
		});
		expect(result).toMatchObject({ status: 'milestone_written', eventName: 'w1_return' });
	});

	it('chat activation kan följas av evening W1 och evening activation av diary W4', async () => {
		await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: activationInsertAt
		});
		expect(
			await recordMeaningfulReflectionMilestones({
				userId: USER_ID,
				userCreatedAt: COHORT_START,
				actionOccurredAt: '2026-09-28T10:00:00Z'
			})
		).toMatchObject({ eventName: 'w1_return' });
		expect(
			await recordMeaningfulReflectionMilestones({
				userId: USER_ID,
				userCreatedAt: COHORT_START,
				actionOccurredAt: '2026-10-18T10:00:00Z'
			})
		).toMatchObject({ eventName: 'w4_return' });
	});

	it('duplicate activation läser tillbaka vinnarens faktiska baseline', async () => {
		forceActivationRace = true;
		const result = await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: activationInsertAt
		});
		expect(result.activationOccurredAt).toBe(activationInsertAt);
		expect(rows.filter((row) => row.event_name === 'first_meaningful_reflection')).toHaveLength(1);
	});

	it('flera reflections samma dag ger ingen falsk W1', async () => {
		await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: activationInsertAt
		});
		const result = await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: '2026-09-21T20:00:00Z'
		});
		expect(result.status).toBe('no_milestone');
		expect(rows.some((row) => row.event_name === 'w1_return')).toBe(false);
	});

	it('unique constraint gör samma retentionmilestone idempotent', async () => {
		await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: activationInsertAt
		});
		const input = {
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: '2026-09-27T10:00:00Z'
		};
		expect(await recordMeaningfulReflectionMilestones(input)).toMatchObject({
			status: 'milestone_written',
			eventName: 'w1_return'
		});
		expect(await recordMeaningfulReflectionMilestones(input)).toMatchObject({
			status: 'milestone_duplicate',
			eventName: 'w1_return'
		});
	});
});

describe('privacy och failure behavior', () => {
	it('nya events har alltid tomma properties och ingen rå identitet eller text', async () => {
		const forbidden = { text: 'privat text', mood: 2, topic: 'diagnos', surface: 'chat' };
		for (const event of ['first_meaningful_reflection', 'w1_return', 'w4_return'] as const) {
			expect(sanitizeFunnelProperties(event, forbidden)).toEqual({});
		}

		await recordMeaningfulReflectionMilestones({
			userId: USER_ID,
			userCreatedAt: COHORT_START,
			actionOccurredAt: activationInsertAt
		});
		const serialized = JSON.stringify(insertedPayloads);
		expect(serialized).not.toContain(USER_ID);
		expect(serialized).not.toContain('privat text');
		expect(insertedPayloads[0]).toMatchObject({ properties: {} });
		expect(insertedPayloads[0]).not.toHaveProperty('user_id');
	});

	it('saknad salt eller service-klient failar stängt utan kast', async () => {
		delete mockEnv.FUNNEL_USER_REF_SALT;
		await expect(
			recordMeaningfulReflectionMilestones({
				userId: USER_ID,
				userCreatedAt: COHORT_START,
				actionOccurredAt: activationInsertAt
			})
		).resolves.toMatchObject({ status: 'skipped_no_salt' });

		mockEnv.FUNNEL_USER_REF_SALT = 'retention-test-salt';
		serviceClientAvailable = false;
		await expect(
			recordMeaningfulReflectionMilestones({
				userId: USER_ID,
				userCreatedAt: COHORT_START,
				actionOccurredAt: activationInsertAt
			})
		).resolves.toMatchObject({ status: 'skipped_no_service_client' });
	});

	it('SELECT- och INSERT-fel kastas aldrig vidare', async () => {
		selectError = { code: '08006', message: 'connection failure' };
		await expect(
			recordMeaningfulReflectionMilestones({
				userId: USER_ID,
				userCreatedAt: COHORT_START,
				actionOccurredAt: activationInsertAt
			})
		).resolves.toMatchObject({ status: 'failed' });

		selectError = null;
		insertError = { code: '08006', message: 'connection failure' };
		await expect(
			recordMeaningfulReflectionMilestones({
				userId: USER_ID,
				userCreatedAt: COHORT_START,
				actionOccurredAt: activationInsertAt
			})
		).resolves.toMatchObject({ status: 'failed' });
	});

	it('saknad analytics-tabell hoppas över utan kast', async () => {
		selectError = { code: 'PGRST205', message: 'Could not find the table' };
		await expect(
			recordMeaningfulReflectionMilestones({
				userId: USER_ID,
				userCreatedAt: COHORT_START,
				actionOccurredAt: activationInsertAt
			})
		).resolves.toMatchObject({ status: 'skipped_missing_table' });
	});
});

describe('integration och migration', () => {
	it('alla tre endpoints använder samma helper efter respektive lyckad insert', () => {
		const diary = readFileSync(join(process.cwd(), 'src/routes/api/diary/create/+server.ts'), 'utf8');
		const chat = readFileSync(join(process.cwd(), 'src/routes/api/chat/+server.ts'), 'utf8');
		const evening = readFileSync(join(process.cwd(), 'src/routes/api/evening-checkins/+server.ts'), 'utf8');

		expect(diary.indexOf('await recordMeaningfulReflectionMilestones')).toBeGreaterThan(diary.indexOf(".from('diary')"));
		expect(chat.indexOf('await recordMeaningfulReflectionMilestones')).toBeGreaterThan(chat.indexOf("from('messages').insert"));
		expect(evening.indexOf('await recordMeaningfulReflectionMilestones')).toBeGreaterThan(evening.indexOf('saveEveningCheckin'));
		expect(chat).not.toMatch(/guest[\s\S]{0,500}recordMeaningfulReflectionMilestones/);

		for (const source of [diary, chat, evening]) {
			const call = source.match(/recordMeaningfulReflectionMilestones\(\{([\s\S]*?)\}\)/)?.[1] ?? '';
			expect(call).toContain('userId: user.id');
			expect(call).toContain('userCreatedAt: user.created_at');
			expect(call).not.toMatch(/text|message|mood|tags|theme|parking|topic|content|reply/i);
		}

		expect(diary).toMatch(/try \{\s*await recordMeaningfulReflectionMilestones[\s\S]*?catch \(retentionError\)/);
		expect(chat).toMatch(/try \{\s*await recordMeaningfulReflectionMilestones[\s\S]*?catch \(retentionError\)/);
		expect(evening).toMatch(/try \{\s*await recordMeaningfulReflectionMilestones[\s\S]*?catch \(retentionError\)/);
	});

	it('migrationen ändrar bara event-checken och bevarar gamla och nya namn', () => {
		const sql = readFileSync(
			join(process.cwd(), 'supabase/migrations/20260921160000_add_retention_milestone_events.sql'),
			'utf8'
		);
		for (const event of [
			'first_entry_saved',
			'second_active_day',
			'first_meaningful_reflection',
			'w1_return',
			'w4_return'
		]) {
			expect(sql).toContain(`'${event}'`);
		}
		expect(sql).toContain('drop constraint if exists product_funnel_events_event_name_check');
		expect(sql).not.toMatch(/drop table|delete from|truncate|create policy|disable row level security/i);
		expect(sql).not.toMatch(/drop constraint if exists product_funnel_events_once_per_user/i);
	});
});
