import { describe, expect, it } from 'vitest';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';
import { CRISIS_RESPONSE } from '$lib/ai/crisis-responses';
import { POST } from './+server';

describe('POST /api/chat', () => {
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
	});
});
