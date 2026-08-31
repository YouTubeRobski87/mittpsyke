// Integrationstest för Product Funnel Analytics V1, Pass A.
//
// Det viktigaste kravet här är negativt: analytics får aldrig kunna göra en
// lyckad dagbokssparning misslyckad. Enhetstesterna i
// src/lib/server/funnel-events.test.ts visar att helpern inte kastar; det här
// testet visar att endpointen står emot även om den skulle göra det ändå.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';

const mocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	recordCurrentCompanionPresence: vi.fn(),
	recordDiaryFunnelEvents: vi.fn()
}));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

vi.mock('$lib/server/companion-presence', () => ({
	recordCurrentCompanionPresence: mocks.recordCurrentCompanionPresence
}));

vi.mock('$lib/server/funnel-events', () => ({
	recordDiaryFunnelEvents: mocks.recordDiaryFunnelEvents
}));

vi.mock('$env/dynamic/private', () => ({
	env: { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_ANON_KEY: 'anon-key' }
}));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

const { POST } = await import('./+server');

const USER_ID = 'user-1';
const SAVED_ROW = {
	id: 'entry-1',
	user_id: USER_ID,
	text: 'Jag känner mig lite lugnare i dag än i går.',
	mood: 'lugn',
	tags: null,
	image_url: null,
	video_path: null,
	prompt_question: null,
	daily_question_id: null,
	created_at: '2026-05-04T09:00:00Z'
};

type InsertOutcome = {
	data: typeof SAVED_ROW | null;
	error: { code?: string; message?: string } | null;
};

function mockSupabase(outcome: InsertOutcome) {
	mocks.createClient.mockReturnValue({
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } }, error: null })
		},
		from: () => ({
			insert: () => ({
				select: () => ({
					single: () => Promise.resolve(outcome)
				})
			})
		})
	});
}

function createRequest() {
	return new Request('http://localhost/api/diary/create', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: 'Bearer access-token',
			[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
		},
		body: JSON.stringify({ text: 'Jag känner mig lite lugnare i dag än i går.', mood: 'lugn' })
	});
}

async function post() {
	return POST({ request: createRequest() } as never);
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.recordCurrentCompanionPresence.mockResolvedValue(true);
	mocks.recordDiaryFunnelEvents.mockResolvedValue([]);
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/diary/create — funnel events', () => {
	it('anropar funnel-helpern först efter en lyckad insert', async () => {
		mockSupabase({ data: SAVED_ROW, error: null });

		const response = await post();

		expect(response.status).toBe(200);
		expect(mocks.recordDiaryFunnelEvents).toHaveBeenCalledTimes(1);

		const [, userId, inserted] = mocks.recordDiaryFunnelEvents.mock.calls[0];
		expect(userId).toBe(USER_ID);
		expect(inserted).toEqual({ id: 'entry-1', created_at: '2026-05-04T09:00:00Z' });
	});

	it('skickar aldrig dagbokstext, humör eller taggar till analytics', async () => {
		mockSupabase({ data: SAVED_ROW, error: null });

		await post();

		const [, , inserted] = mocks.recordDiaryFunnelEvents.mock.calls[0];
		expect(Object.keys(inserted as Record<string, unknown>).sort()).toEqual(['created_at', 'id']);
		expect(JSON.stringify(inserted)).not.toContain('lugnare');
		expect(JSON.stringify(inserted)).not.toContain('lugn');
	});

	it('anropar inte funnel-helpern när sparningen misslyckas', async () => {
		mockSupabase({ data: null, error: { code: '42501', message: 'denied' } });

		const response = await post();

		expect(response.status).toBe(403);
		expect(mocks.recordDiaryFunnelEvents).not.toHaveBeenCalled();
	});

	it('I. dagbokssparningen lyckas även om funnel-skrivningen kastar', async () => {
		mockSupabase({ data: SAVED_ROW, error: null });
		mocks.recordDiaryFunnelEvents.mockRejectedValue(new Error('analytics nere'));

		const response = await post();
		const body = (await response.json()) as { success: boolean; diary?: { id: string } };

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.diary?.id).toBe('entry-1');
	});

	it('I. dagbokssparningen lyckas även om companion-presence kastar', async () => {
		mockSupabase({ data: SAVED_ROW, error: null });
		mocks.recordCurrentCompanionPresence.mockRejectedValue(new Error('rpc nere'));

		const response = await post();

		expect(response.status).toBe(200);
		expect(mocks.recordDiaryFunnelEvents).toHaveBeenCalledTimes(1);
	});
});
