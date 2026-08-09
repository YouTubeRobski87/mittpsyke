import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';
import { CRISIS_RESPONSE } from '$lib/ai/crisis-responses';

const mocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	generateAIText: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({
	env: { OPENAI_API_KEY: 'test-openai-key' }
}));

vi.mock('$env/dynamic/public', () => ({ env: {} }));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

vi.mock('$lib/server/ai/text-generation', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/ai/text-generation')>();
	return { ...actual, generateAIText: mocks.generateAIText };
});

import { POST } from './+server';

describe('POST /api/chat', () => {
	beforeEach(() => {
		mocks.createClient.mockReset();
		mocks.generateAIText.mockReset();
		mocks.generateAIText.mockResolvedValue({
			text: 'Tack för att du berättar.',
			provider: 'openai',
			model: 'test-model'
		});
	});

	it('returns the crisis response before any reassurance-pattern handling', async () => {
		const request = new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
			},
			body: JSON.stringify({
				message: 'Jag vill inte leva. Kan du lova att jag är säker?',
				category: 'a',
				guestId: 'guest-session-1234',
				contextMessages: [
					{ role: 'user', content: 'Kan du lova att jag är säker?' },
					{ role: 'assistant', content: 'Jag hör att du är orolig.' },
					{ role: 'user', content: 'Är jag verkligen säker?' }
				]
			})
		});
		const response = await POST({ request, getClientAddress: () => '127.0.0.1' } as Parameters<typeof POST>[0]);
		const body = (await response.json()) as { reply: string; crisis: boolean };

		expect(response.status).toBe(200);
		expect(body).toEqual({
			reply: CRISIS_RESPONSE,
			crisis: true,
			conversationId: null,
			mode: 'guest'
		});
		expect(mocks.generateAIText).not.toHaveBeenCalled();
		expect(mocks.createClient).not.toHaveBeenCalled();
	});

	it('keeps guest chat in the request session without a Supabase client or guest identifier', async () => {
		const request = new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
			},
			body: JSON.stringify({
				message: 'Jag känner mig ensam i kväll.',
				category: 'G',
				contextMessages: [
					{ role: 'user', content: 'Jag har haft en tung dag.' },
					{ role: 'assistant', content: 'Jag hör att det varit mycket.' }
				]
			})
		});

		const response = await POST({ request, getClientAddress: () => '127.0.0.2' } as Parameters<typeof POST>[0]);
		const body = (await response.json()) as { reply: string; conversationId: string | null; mode: string };

		expect(response.status).toBe(200);
		expect(body).toEqual({
			reply: 'Tack för att du berättar.',
			conversationId: null,
			mode: 'guest'
		});
		expect(mocks.createClient).not.toHaveBeenCalled();
		expect(mocks.generateAIText).toHaveBeenCalledWith(
			expect.objectContaining({
				purpose: 'support-chat',
				messages: [
					{ role: 'user', content: 'Jag har haft en tung dag.' },
					{ role: 'assistant', content: 'Jag hör att det varit mycket.' },
					{ role: 'user', content: 'Jag känner mig ensam i kväll.' }
				]
			})
		);
	});
});
