import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createHealthConsentRecord,
	SENSITIVE_CONSENT_HEADER,
	SENSITIVE_CONSENT_VERSION
} from '$lib/consent';

const mocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	generateAIText: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({
	env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-key' }
}));

vi.mock('$env/dynamic/public', () => ({ env: {} }));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

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

function checkinRequest() {
	return new Request('http://localhost/api/diary/checkin-reflection', {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: 'Bearer access-token' },
		body: JSON.stringify({ selectedMoods: ['orolig'], moodFreeText: 'Det känns tungt i dag.' })
	});
}

function authenticatedUser(metadata: unknown) {
	return {
		id: 'user-1',
		user_metadata: metadata
	};
}

function reflectEvent(metadata: unknown, headers: HeadersInit = {}) {
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

function checkinClient(metadata: unknown) {
	return {
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user: authenticatedUser(metadata) },
				error: null
			})
		}
	};
}

describe('diary reflection consent', () => {
	beforeEach(() => {
		mocks.createClient.mockReset();
		mocks.generateAIText.mockReset();
		mocks.generateAIText.mockResolvedValue({ text: 'Ta ett lugnt andetag.' });
	});

	it('allows /api/diary/reflect only with valid server-side consent', async () => {
		const response = await reflectPost(
			reflectEvent({
				health_data_processing_consent: createHealthConsentRecord('2026-08-15T08:00:00.000Z')
			})
		);

		expect(response.status).toBe(200);
		expect(mocks.generateAIText).toHaveBeenCalledOnce();
	});

	it('blocks /api/diary/reflect without consent before it can call OpenAI', async () => {
		const response = await reflectPost(reflectEvent({}));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			error: 'Consent required for sensitive diary AI features.'
		});
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('blocks stale consent even when the reflection request carries a consent header', async () => {
		const response = await reflectPost(
			reflectEvent(
				{
					health_data_processing_consent: {
						...createHealthConsentRecord('2026-08-15T08:00:00.000Z'),
						policy_version: 'outdated-policy'
					}
				},
				{ [SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION }
			)
		);

		expect(response.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('allows /api/diary/checkin-reflection only with current server-side consent', async () => {
		mocks.createClient.mockReturnValue(
			checkinClient({
				health_data_processing_consent: createHealthConsentRecord('2026-08-15T08:00:00.000Z')
			})
		);

		const response = await checkinReflectionPost({
			request: checkinRequest()
		} as unknown as Parameters<typeof checkinReflectionPost>[0]);

		expect(response.status).toBe(200);
		expect(mocks.generateAIText).toHaveBeenCalledOnce();
	});

	it('blocks missing or invalid consent for check-in reflections before the AI call', async () => {
		mocks.createClient.mockReturnValue(
			checkinClient({
				health_data_processing_consent: {
					...createHealthConsentRecord('2026-08-15T08:00:00.000Z'),
					type: 'other-consent'
				}
			})
		);

		const response = await checkinReflectionPost({
			request: checkinRequest()
		} as unknown as Parameters<typeof checkinReflectionPost>[0]);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			success: false,
			error: 'Consent required for sensitive diary AI features.'
		});
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('leaves the local-only diary helper free of server and AI requests', () => {
		const source = readFileSync(new URL('../../../lib/diary-draft.ts', import.meta.url), 'utf8');

		expect(source).not.toMatch(/fetch\(|supabase|openai/i);
	});
});
