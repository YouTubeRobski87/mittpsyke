import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: () => null,
	isMissingTableError: () => false
}));

const { createUserRef } = await import('./funnel-events');
const { buildCoreFunnelReport } = await import('./funnel-report');

const START = '2026-10-01T00:00:00Z';
const END = '2026-11-01T00:00:00Z';
const externalId = '11111111-1111-4111-8111-111111111111';
const inactiveId = '22222222-2222-4222-8222-222222222222';
const internalId = '33333333-3333-4333-8333-333333333333';

beforeEach(() => {
	for (const key of Object.keys(mockEnv)) delete mockEnv[key];
	mockEnv.FUNNEL_USER_REF_SALT = 'report-test-salt';
	mockEnv.FUNNEL_INTERNAL_USER_IDS = internalId;
});

describe('kärnfunnelrapport', () => {
	it('räknar konto, activation, W1/W4 och första aktivitet utan att blanda in interna konton', () => {
		const externalRef = createUserRef(externalId)!;
		const internalRef = createUserRef(internalId)!;
		const report = buildCoreFunnelReport({
			cohortStart: START,
			cohortEnd: END,
			accounts: [
				{ id: externalId, created_at: '2026-10-02T10:00:00Z' },
				{ id: inactiveId, created_at: '2026-10-03T10:00:00Z' },
				{ id: internalId, created_at: '2026-10-04T10:00:00Z' },
				{ id: 'outside', created_at: '2026-09-30T23:59:59Z' }
			],
			events: [
				{
					user_ref: externalRef,
					event_name: 'first_meaningful_reflection',
					occurred_at: '2026-10-02T10:05:00Z',
					is_internal: false,
					properties: { activity_type: 'authenticated_chat' }
				},
				{
					user_ref: externalRef,
					event_name: 'w1_return',
					occurred_at: '2026-10-09T10:00:00Z',
					is_internal: false
				},
				{
					user_ref: externalRef,
					event_name: 'w4_return',
					occurred_at: '2026-10-30T10:00:00Z',
					is_internal: false
				},
				{
					user_ref: internalRef,
					event_name: 'first_meaningful_reflection',
					occurred_at: '2026-10-04T10:05:00Z',
					is_internal: false,
					properties: { activity_type: 'diary' }
				}
			]
		});

		expect(report).toMatchObject({
			status: 'ready',
			accountsCreated: 2,
			activated: 1,
			notActivated: 1,
			w1Returned: 1,
			w4Returned: 1,
			excludedInternalAccounts: 1,
			firstActivity: { diary: 0, authenticated_chat: 1, evening_checkin: 0, unknown: 0 }
		});
	});

	it('deduplicerar event per användare och redovisar äldre activation utan aktivitetstyp som okänd', () => {
		const userRef = createUserRef(externalId)!;
		const report = buildCoreFunnelReport({
			cohortStart: START,
			cohortEnd: END,
			accounts: [{ id: externalId, created_at: '2026-10-02T10:00:00Z' }],
			events: [
				{ user_ref: userRef, event_name: 'first_meaningful_reflection', occurred_at: '2026-10-02T10:00:00Z', is_internal: false },
				{ user_ref: userRef, event_name: 'first_meaningful_reflection', occurred_at: '2026-10-02T10:01:00Z', is_internal: false },
				{ user_ref: userRef, event_name: 'w1_return', occurred_at: '2026-10-09T10:00:00Z', is_internal: false },
				{ user_ref: userRef, event_name: 'w1_return', occurred_at: '2026-10-09T10:01:00Z', is_internal: false }
			]
		});

		expect(report.activated).toBe(1);
		expect(report.w1Returned).toBe(1);
		expect(report.firstActivity.unknown).toBe(1);
	});

	it('exkluderar ett konto när en befintlig eventrad redan är markerad intern', () => {
		delete mockEnv.FUNNEL_INTERNAL_USER_IDS;
		const userRef = createUserRef(externalId)!;
		const report = buildCoreFunnelReport({
			cohortStart: START,
			cohortEnd: END,
			accounts: [{ id: externalId, created_at: '2026-10-02T10:00:00Z' }],
			events: [
				{
					user_ref: userRef,
					event_name: 'first_meaningful_reflection',
					occurred_at: '2026-10-02T10:01:00Z',
					is_internal: true,
					properties: { activity_type: 'diary' }
				}
			]
		});

		expect(report.accountsCreated).toBe(0);
		expect(report.activated).toBe(0);
		expect(report.excludedInternalAccounts).toBe(1);
	});

	it('failar stängt utan pseudonymiseringssalt', () => {
		delete mockEnv.FUNNEL_USER_REF_SALT;
		const report = buildCoreFunnelReport({
			cohortStart: START,
			cohortEnd: END,
			accounts: [{ id: externalId, created_at: '2026-10-02T10:00:00Z' }],
			events: []
		});

		expect(report.status).toBe('unavailable_no_salt');
		expect(report.accountsCreated).toBe(0);
	});
});
