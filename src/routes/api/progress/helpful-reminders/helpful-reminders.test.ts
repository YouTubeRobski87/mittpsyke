import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from './+server';
import { load } from '../../../framsteg/+page.server';

const row = { item_id: 'rest', active: true, revision: 1 };
const choice = { accountId: 'own', item: 'rest', action: 'add', revision: 0 };

function setup(user: { id: string; is_anonymous?: boolean } | null) {
	const getUser = vi.fn().mockResolvedValue({ data: { user } });
	const rpc = vi.fn().mockResolvedValue({ data: [row] });
	const eq = vi.fn().mockResolvedValue({ data: [row] });
	const from = vi.fn(() => ({ select: () => ({ eq }) }));
	const locals = { supabase: { auth: { getUser }, rpc, from } };
	const post = (body: unknown, type = 'application/json') => POST({
		request: new Request('http://localhost/api/progress/helpful-reminders', {
			method: 'POST', headers: { 'Content-Type': type }, body: JSON.stringify(body)
		}),
		locals
	} as unknown as Parameters<typeof POST>[0]);
	const get = (account = 'own') => GET({
		request: new Request('http://localhost/api/progress/helpful-reminders', {
			headers: { 'X-MittPsyke-Account-Id': account }
		}),
		locals
	} as unknown as Parameters<typeof GET>[0]);
	return { locals, rpc, eq, from, post, get };
}

describe('personlig lista på Framsteg', () => {
	it.each([null, { id: 'own', is_anonymous: true }])('gäster får varken läsa eller spara (%s)', async (user) => {
		const { locals, rpc, from, post, get } = setup(user);
		const page = await load({ locals } as unknown as Parameters<typeof load>[0]);
		expect(page).toMatchObject({ isAnonymous: true });
		expect(page).not.toHaveProperty('helpfulReminderAccount');
		expect((await post(choice)).status).toBe(403);
		expect((await get()).status).toBe(403);
		expect(rpc).not.toHaveBeenCalled();
		expect(from).not.toHaveBeenCalled();
	});

	it('kontrollerar format, val och revision innan skrivning', async () => {
		const { post, rpc } = setup({ id: 'own' });
		expect((await post(choice, 'text/plain')).status).toBe(415);
		expect((await post({ ...choice, item: 'Fritext' })).status).toBe(400);
		expect((await post({ ...choice, revision: -1 })).status).toBe(400);
		expect(rpc).not.toHaveBeenCalled();
	});

	it('använder det verifierade kontot och skickar revision till den atomiska operationen', async () => {
		const { post, get, rpc, eq } = setup({ id: 'own' });
		expect((await post({ ...choice, accountId: 'other' })).status).toBe(403);
		expect((await get('other')).status).toBe(403);
		expect(rpc).not.toHaveBeenCalled();
		expect(eq).not.toHaveBeenCalled();
		const response = await post(choice);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(await response.json()).toEqual({ reminder: row });
		expect(rpc).toHaveBeenCalledWith('set_helpful_reminder', { p_item_id: 'rest', p_active: true, p_revision: 0 });
		expect(await (await get()).json()).toEqual({ reminders: [row] });
		expect(eq).toHaveBeenCalledWith('user_id', 'own');
	});

	it('skiljer en konflikt från en bekräftad skrivning och från ett lagringsfel', async () => {
		const { post, rpc } = setup({ id: 'own' });
		rpc.mockResolvedValueOnce({ data: [] });
		expect((await post(choice)).status).toBe(409);
		rpc.mockResolvedValueOnce({ error: { message: 'synthetic' } });
		expect((await post(choice)).status).toBe(502);
		rpc.mockResolvedValueOnce({ data: [{ ...row, revision: 2 }] });
		expect((await post(choice)).status).toBe(502);
	});
});