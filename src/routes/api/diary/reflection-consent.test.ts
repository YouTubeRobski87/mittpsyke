import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	createServiceClient: vi.fn(),
	createTokenClient: vi.fn(),
	generateAIText: vi.fn(),
	hasDiaryAiConsent: vi.fn()
}));

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: mocks.createServiceClient,
	createTokenClient: mocks.createTokenClient
}));

vi.mock('$lib/server/diary-ai-consent', () => ({
	hasDiaryAiConsent: mocks.hasDiaryAiConsent
}));

vi.mock('$lib/server/ai/text-generation', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/ai/text-generation')>();
	return { ...actual, generateAIText: mocks.generateAIText };
});

import { POST as reflectPost } from './reflect/+server';
import { POST as checkinReflectionPost } from './checkin-reflection/+server';

function reflectRequest(headers: HeadersInit = {}) {
	return new Request('http://localhost/api/diary/reflect', {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...headers },
		body: JSON.stringify({
			text: 'Jag har haft en lång dag och känner mig både trött och orolig för veckan som kommer.'
		})
	});
}

function checkinRequest(headers: HeadersInit = {}) {
	return new Request('http://localhost/api/diary/checkin-reflection', {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: 'Bearer access-token', ...headers },
		body: JSON.stringify({ selectedMoods: ['orolig'], moodFreeText: 'Det känns tungt i dag.' })
	});
}

function authenticatedUser(metadata: unknown = {}) {
	return { id: 'user-1', user_metadata: metadata };
}

function reflectEvent(metadata: unknown = {}, headers: HeadersInit = {}) {
	return {
		request: reflectRequest(headers),
		locals: {
			supabase: {
				auth: {
					getUser: vi.fn().mockResolvedValue({
						data: { user: authenticatedUser(metadata) },
						error: null
					})
				}
			}
		}
	} as unknown as Parameters<typeof reflectPost>[0];
}

function checkinClient(metadata: unknown = {}) {
	return {
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user: authenticatedUser(metadata) },
				error: null
			})
		}
	};
}

describe('server-owned diary AI consent', () => {
	beforeEach(() => {
		mocks.createServiceClient.mockReset();
		mocks.createTokenClient.mockReset();
		mocks.generateAIText.mockReset();
		mocks.hasDiaryAiConsent.mockReset();
		mocks.createServiceClient.mockReturnValue({});
		mocks.createTokenClient.mockReturnValue(checkinClient());
		mocks.generateAIText.mockResolvedValue({ text: 'Ta ett lugnt andetag.' });
		mocks.hasDiaryAiConsent.mockResolvedValue(true);
	});

	it('allows both diary AI endpoints only after the shared server consent check succeeds', async () => {
		const reflectResponse = await reflectPost(reflectEvent());
		const checkinResponse = await checkinReflectionPost({
			request: checkinRequest()
		} as unknown as Parameters<typeof checkinReflectionPost>[0]);

		expect(reflectResponse.status).toBe(200);
		expect(checkinResponse.status).toBe(200);
		expect(mocks.hasDiaryAiConsent).toHaveBeenCalledTimes(2);
		expect(mocks.hasDiaryAiConsent).toHaveBeenNthCalledWith(1, {}, 'user-1');
		expect(mocks.hasDiaryAiConsent).toHaveBeenNthCalledWith(2, {}, 'user-1');
		expect(mocks.generateAIText).toHaveBeenCalledTimes(2);
	});

	it('blocks a request with no server row before any provider call', async () => {
		mocks.hasDiaryAiConsent.mockResolvedValue(false);

		const response = await reflectPost(reflectEvent());

		expect(response.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('blocks a consent header alone before any provider call', async () => {
		mocks.hasDiaryAiConsent.mockResolvedValue(false);

		const response = await checkinReflectionPost({
			request: checkinRequest({ 'x-mittpsyke-sensitive-consent': '2026-04-29' })
		} as unknown as Parameters<typeof checkinReflectionPost>[0]);

		expect(response.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('closes the V2 gap: valid-looking user metadata alone is blocked', async () => {
		mocks.hasDiaryAiConsent.mockResolvedValue(false);

		const response = await reflectPost(
			reflectEvent({
				health_data_processing_consent: {
					accepted: true,
					type: 'health_data_processing',
					policy_version: '2026-04-29',
					timestamp: '2026-08-15T08:00:00.000Z'
				}
			})
		);

		expect(response.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('blocks revoked consent before either endpoint can call the provider', async () => {
		mocks.hasDiaryAiConsent.mockResolvedValue(false);

		const response = await checkinReflectionPost({
			request: checkinRequest()
		} as unknown as Parameters<typeof checkinReflectionPost>[0]);

		expect(response.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('keeps local-only diary storage free of server and AI requests', () => {
		const source = readFileSync(new URL('../../../lib/diary-draft.ts', import.meta.url), 'utf8');

		expect(source).not.toMatch(/fetch\(|supabase|openai/i);
	});

	it('does not add diary AI consent to ordinary diary saving', () => {
		const source = readFileSync(new URL('./create/+server.ts', import.meta.url), 'utf8');

		expect(source).not.toContain('hasDiaryAiConsent');
		expect(source).not.toContain('user_ai_consents');
	});
});
