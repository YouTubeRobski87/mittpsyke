import { describe, expect, it, vi } from 'vitest';
import { getSessionUser, isSuperAdminUser } from './admin-auth';

const regularUser = {
	id: 'regular-user-id',
	app_metadata: {},
	user_metadata: {}
};

describe('getSessionUser', () => {
	it('returns null for a signed-out user', async () => {
		const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } };

		expect(await getSessionUser(supabase as never)).toBeNull();
	});

	it('returns the verified user identity', async () => {
		const supabase = {
			auth: { getUser: vi.fn().mockResolvedValue({ data: { user: regularUser }, error: null }) },
			rpc: vi.fn().mockResolvedValue({ data: false, error: null })
		};

		const user = await getSessionUser(supabase as never);

		expect(supabase.auth.getUser).toHaveBeenCalledOnce();
		expect(user?.id).toBe('regular-user-id');
		expect(user?.is_super_admin).toBe(false);
	});

	it('returns null when Auth rejects the session', async () => {
		const supabase = {
			auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('JWT invalid') }) }
		};

		expect(await getSessionUser(supabase as never)).toBeNull();
	});

	it('does not grant an admin route to a verified user without an admin claim', () => {
		expect(isSuperAdminUser(regularUser as never)).toBe(false);
	});
});
