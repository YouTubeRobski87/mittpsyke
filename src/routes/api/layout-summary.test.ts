import { describe, expect, it, vi } from 'vitest';
import { GET } from './layout-summary/+server';

function createSupabase(user: { id: string } | null, authError: Error | null = null) {
	const diaryEq = vi.fn().mockResolvedValue({ count: 3, error: null });
	const conversationsEq = vi.fn().mockResolvedValue({ count: 2, error: null });
	const notificationsUserEq = vi.fn();
	const notificationsSecondEq = vi.fn().mockResolvedValue({ count: 1, error: null });
	notificationsUserEq.mockReturnValue({ eq: notificationsSecondEq });

	return {
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user }, error: authError })
		},
		from: vi.fn((table: string) => {
			if (table === 'diary') return { select: vi.fn(() => ({ eq: diaryEq })) };
			if (table === 'conversations') return { select: vi.fn(() => ({ eq: conversationsEq })) };
			return {
				select: vi.fn(() => ({
					eq: notificationsUserEq
				}))
			};
		}),
		queries: { diaryEq, conversationsEq, notificationsUserEq, notificationsSecondEq }
	};
}

describe('/api/layout-summary', () => {
	it('returns 401 for a signed-out user', async () => {
		const supabase = createSupabase(null);
		const response = await GET({ locals: { supabase } } as never);

		expect(response.status).toBe(401);
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('uses the verified user.id for protected reads', async () => {
		const supabase = createSupabase({ id: 'verified-user-id' });
		const response = await GET({ locals: { supabase } } as never);

		expect(response.status).toBe(200);
		expect(supabase.auth.getUser).toHaveBeenCalledOnce();
		expect(supabase.queries.diaryEq).toHaveBeenCalledWith('user_id', 'verified-user-id');
		expect(supabase.queries.conversationsEq).toHaveBeenCalledWith('user_id', 'verified-user-id');
		expect(supabase.queries.notificationsUserEq).toHaveBeenCalledWith('user_id', 'verified-user-id');
		expect(supabase.queries.notificationsSecondEq).toHaveBeenCalledWith('is_read', false);
	});

	it('rejects an invalid or manipulated cookie session', async () => {
		const supabase = createSupabase(null, new Error('JWT invalid'));
		const response = await GET({ locals: { supabase } } as never);

		expect(response.status).toBe(401);
		expect(supabase.from).not.toHaveBeenCalled();
	});
});
