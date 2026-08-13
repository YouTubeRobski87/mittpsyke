import { beforeEach, describe, expect, it, vi } from 'vitest';

// $env/dynamic/private finns inte utanför SvelteKit-runtime. Mockas så
// ADMIN_USER_IDS kan varieras per test.
const mockEnv: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

const { isSuperAdminUser } = await import('./admin-auth');

// Riktigt id från auth.users - kontot som legacy-allowlisten pekar ut.
const LEGACY_ID = 'f4f107ef-461a-4090-bc2f-6ddccc0cc64d';
const OTHER_ID = '11111111-2222-4333-8444-555555555555';

function user(overrides: Record<string, unknown> = {}) {
	return {
		id: OTHER_ID,
		app_metadata: {},
		user_metadata: {},
		aud: 'authenticated',
		created_at: '2026-01-01T00:00:00Z',
		...overrides
	} as never;
}

describe('isSuperAdminUser', () => {
	beforeEach(() => {
		for (const key of Object.keys(mockEnv)) delete mockEnv[key];
	});

	it('nekar när ingen källa ger behörighet', () => {
		expect(isSuperAdminUser(user())).toBe(false);
	});

	it('nekar null/undefined', () => {
		expect(isSuperAdminUser(null)).toBe(false);
		expect(isSuperAdminUser(undefined)).toBe(false);
	});

	it('godkänner legacy-id:t', () => {
		expect(isSuperAdminUser(user({ id: LEGACY_ID }))).toBe(true);
	});

	it('godkänner id i ADMIN_USER_IDS', () => {
		mockEnv.ADMIN_USER_IDS = OTHER_ID;
		expect(isSuperAdminUser(user())).toBe(true);
	});

	it('tål mellanslag, versaler och flera id:n i ADMIN_USER_IDS', () => {
		mockEnv.ADMIN_USER_IDS = ` ${LEGACY_ID} , ${OTHER_ID.toUpperCase()} `;
		expect(isSuperAdminUser(user())).toBe(true);
	});

	it('godkänner app_metadata.is_super_admin', () => {
		expect(isSuperAdminUser(user({ app_metadata: { is_super_admin: true } }))).toBe(true);
	});

	// Regressionsskydd. user_metadata är skrivbart av användaren själv via
	// supabase.auth.updateUser(), så det får aldrig ge adminbehörighet.
	it('ger ALDRIG behörighet från user_metadata', () => {
		expect(isSuperAdminUser(user({ user_metadata: { is_super_admin: true } }))).toBe(false);
		mockEnv.ADMIN_USER_IDS = '';
		expect(
			isSuperAdminUser(user({ user_metadata: { is_super_admin: true, role: 'admin' } }))
		).toBe(false);
	});

	it('godkänner inte sträng-sanning, bara boolean true', () => {
		expect(isSuperAdminUser(user({ app_metadata: { is_super_admin: 'true' } }))).toBe(false);
		expect(isSuperAdminUser(user({ app_metadata: { is_super_admin: 1 } }))).toBe(false);
	});

	it('tom ADMIN_USER_IDS ger inte behörighet till alla', () => {
		mockEnv.ADMIN_USER_IDS = ',, ,';
		expect(isSuperAdminUser(user())).toBe(false);
		expect(isSuperAdminUser(user({ id: '' }))).toBe(false);
	});
});
