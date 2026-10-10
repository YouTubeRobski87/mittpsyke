import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	record: vi.fn()
}));

vi.mock('$lib/server/framsteg-comprehension', () => ({
	isComprehensionAnswer: (value: unknown) => ['yes', 'partial', 'no'].includes(String(value)),
	recordFramstegComprehension: mocks.record
}));

const { POST } = await import('./+server');

function request(body: unknown) {
	return new Request('http://localhost/api/framsteg/comprehension', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}

function eventFor(user: { id: string; is_anonymous?: boolean } | null) {
	return {
		locals: {
			supabase: {
				auth: { getUser: async () => ({ data: { user }, error: null }) }
			}
		}
	};
}

beforeEach(() => {
	mocks.record.mockReset().mockResolvedValue('written');
});

describe('POST /api/framsteg/comprehension', () => {
	it.each(['yes', 'partial', 'no'])('accepterar det fasta svarsvärdet %s', async (answer) => {
		const response = await POST({
			request: request({ clarity: answer, worldChange: answer }),
			...eventFor({ id: 'user-1', is_anonymous: false })
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(mocks.record).toHaveBeenCalledWith({
			userId: 'user-1',
			clarity: answer,
			worldChange: answer
		});
	});

	it('släpper inte igenom extra eller känsliga fält till lagringen', async () => {
		await POST({
			request: request({
				clarity: 'yes',
				worldChange: 'partial',
				mood: 2,
				diaryText: 'privat',
				comment: 'ska inte sparas',
				device: 'fingerprint'
			}),
			...eventFor({ id: 'user-1', is_anonymous: false })
		} as Parameters<typeof POST>[0]);

		expect(mocks.record).toHaveBeenCalledWith({
			userId: 'user-1',
			clarity: 'yes',
			worldChange: 'partial'
		});
	});

	it('avvisar okända svar innan lagring', async () => {
		const response = await POST({
			request: request({ clarity: 'kanske', worldChange: 'yes' }),
			...eventFor({ id: 'user-1', is_anonymous: false })
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(400);
		expect(mocks.record).not.toHaveBeenCalled();
	});

	it.each([
		['utan användare', null],
		['med anonym användare', { id: 'anonymous-1', is_anonymous: true }]
	] as const)('avvisar %s', async (_label, user) => {
		const response = await POST({
			request: request({ clarity: 'yes', worldChange: 'yes' }),
			...eventFor(user)
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(401);
		expect(mocks.record).not.toHaveBeenCalled();
	});

	it('behandlar serverdublett som ett redan mottaget svar', async () => {
		mocks.record.mockResolvedValue('duplicate');
		const response = await POST({
			request: request({ clarity: 'no', worldChange: 'partial' }),
			...eventFor({ id: 'user-1', is_anonymous: false })
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
	});
});
