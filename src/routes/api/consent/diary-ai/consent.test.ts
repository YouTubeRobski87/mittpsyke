import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	createServiceClient: vi.fn(),
	createTokenClient: vi.fn(),
	grantDiaryAiConsent: vi.fn(),
	hasDiaryAiConsent: vi.fn(),
	revokeDiaryAiConsent: vi.fn()
}));

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: mocks.createServiceClient,
	createTokenClient: mocks.createTokenClient
}));

vi.mock('$lib/server/diary-ai-consent', () => ({
	DIARY_AI_CONSENT_POLICY_VERSION: 'diary-ai-v1',
	grantDiaryAiConsent: mocks.grantDiaryAiConsent,
	hasDiaryAiConsent: mocks.hasDiaryAiConsent,
	revokeDiaryAiConsent: mocks.revokeDiaryAiConsent
}));

import { DELETE, GET, POST } from './+server';

function event(method: string) {
	return {
		request: new Request('http://localhost/api/consent/diary-ai', {
			method,
			headers: { authorization: 'Bearer access-token' }
		}),
		locals: { supabase: { auth: { getUser: vi.fn() } } }
	} as unknown as Parameters<typeof POST>[0];
}

describe('diary AI consent route', () => {
	beforeEach(() => {
		mocks.createServiceClient.mockReset();
		mocks.createTokenClient.mockReset();
		mocks.grantDiaryAiConsent.mockReset();
		mocks.hasDiaryAiConsent.mockReset();
		mocks.revokeDiaryAiConsent.mockReset();
		mocks.createServiceClient.mockReturnValue({});
		mocks.createTokenClient.mockReturnValue({
			auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) }
		});
		mocks.grantDiaryAiConsent.mockResolvedValue(true);
		mocks.hasDiaryAiConsent.mockResolvedValue(true);
		mocks.revokeDiaryAiConsent.mockResolvedValue(true);
	});

	it('records an explicit authenticated grant server-side', async () => {
		const response = await POST(event('POST'));

		expect(response.status).toBe(200);
		expect(mocks.grantDiaryAiConsent).toHaveBeenCalledWith({}, 'user-1');
		expect(await response.json()).toEqual({ status: 'granted', policyVersion: 'diary-ai-v1' });
	});

	it('reports only the server-owned consent state', async () => {
		const response = await GET(event('GET') as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		expect(mocks.hasDiaryAiConsent).toHaveBeenCalledWith({}, 'user-1');
	});

	it('records a server-side revocation', async () => {
		const response = await DELETE(event('DELETE') as Parameters<typeof DELETE>[0]);

		expect(response.status).toBe(200);
		expect(mocks.revokeDiaryAiConsent).toHaveBeenCalledWith({}, 'user-1');
		expect(await response.json()).toEqual({ status: 'revoked', policyVersion: 'diary-ai-v1' });
	});

	it('does not claim a grant succeeded when the server write fails', async () => {
		mocks.grantDiaryAiConsent.mockResolvedValue(false);

		const response = await POST(event('POST'));

		expect(response.status).toBe(500);
	});
});
