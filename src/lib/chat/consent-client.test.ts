// Samtyckesbegäran till AI-chatten.
//
// Regressionen: ett felsvar från samtyckes-endpointen satte bara en flagga och
// returnerade. ConsentGate visar sitt fel först när onAccept kastar, så
// användaren såg ingenting och knappen verkade inte göra något. Begäran måste
// kasta vid allt annat än ett lyckat svar, och ChatWindow får inte svälja felet.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	CHAT_AI_ANONYMOUS_CONSENT_ENDPOINT,
	CHAT_AI_CONSENT_ENDPOINT,
	ChatAiConsentError,
	requestChatAiConsent,
	type FetchLike
} from './consent-client';

type Call = { url: string; init: RequestInit | undefined };

function fetchReturning(status: number, calls: Call[] = []): FetchLike {
	return async (url, init) => {
		calls.push({ url, init });
		return new Response(status === 204 ? null : '{}', { status });
	};
}

describe('requestChatAiConsent', () => {
	it('löser ut utan fel när servern beviljar samtycket', async () => {
		await expect(requestChatAiConsent(fetchReturning(200), 'token')).resolves.toBeUndefined();
		await expect(requestChatAiConsent(fetchReturning(200), null)).resolves.toBeUndefined();
	});

	it.each([401, 409, 500, 503])('kastar när servern svarar %i', async (status) => {
		await expect(requestChatAiConsent(fetchReturning(status), 'token')).rejects.toBeInstanceOf(
			ChatAiConsentError
		);
		await expect(requestChatAiConsent(fetchReturning(status), null)).rejects.toMatchObject({
			status
		});
	});

	it('kastar vid nätverksfel', async () => {
		const failing: FetchLike = async () => {
			throw new TypeError('Failed to fetch');
		};

		await expect(requestChatAiConsent(failing, 'token')).rejects.toThrow();
		await expect(requestChatAiConsent(failing, null)).rejects.toThrow();
	});

	it('inloggad användare går till chat-ai med Authorization', async () => {
		const calls: Call[] = [];
		await requestChatAiConsent(fetchReturning(200, calls), 'abc');

		expect(calls).toHaveLength(1);
		expect(calls[0].url).toBe(CHAT_AI_CONSENT_ENDPOINT);
		expect(calls[0].init?.method).toBe('POST');
		expect(calls[0].init?.headers).toEqual({ Authorization: 'Bearer abc' });
	});

	it('gäst går till den anonyma endpointen utan Authorization', async () => {
		const calls: Call[] = [];
		await requestChatAiConsent(fetchReturning(200, calls), null);

		expect(calls).toHaveLength(1);
		expect(calls[0].url).toBe(CHAT_AI_ANONYMOUS_CONSENT_ENDPOINT);
		expect(calls[0].init?.method).toBe('POST');
		expect(calls[0].init?.headers).toBeUndefined();
	});
});

describe('ChatWindow och ConsentGate', () => {
	const chatWindow = readFileSync(join(process.cwd(), 'src/lib/components/ChatWindow.svelte'), 'utf8');
	const consentGate = readFileSync(
		join(process.cwd(), 'src/lib/components/ConsentGate.svelte'),
		'utf8'
	);
	const accept = chatWindow.slice(
		chatWindow.indexOf('async function acceptSensitiveConsent()'),
		chatWindow.indexOf('function requireConsentAgain()')
	);

	it('ChatWindow skickar en funktion som kastar vidare till ConsentGate', () => {
		expect(chatWindow).toContain('onAccept={acceptSensitiveConsent}');
		expect(accept).toContain('await requestChatAiConsent(');
		// Ingen try/catch får svälja felet innan ConsentGate ser det.
		expect(accept).not.toMatch(/\btry\b|\bcatch\b/);
	});

	it('chatten låses upp först efter serverns ja', () => {
		const request = accept.indexOf('await requestChatAiConsent(');

		expect(accept.indexOf('hasSensitiveDataConsent = true')).toBeGreaterThan(request);
		expect(accept).not.toMatch(/hasSensitiveDataConsent = response\.ok/);
	});

	it('ConsentGate visar det svenska felet när onAccept kastar', () => {
		const handler = consentGate.slice(
			consentGate.indexOf('async function handleAccept()'),
			consentGate.indexOf('</script>')
		);

		expect(handler).toMatch(/try \{\s*await onAccept\(\);\s*\} catch \{/);
		expect(handler).toContain("errorMessage = 'Kunde inte spara ditt samtycke just nu. Försök igen.';");
		expect(consentGate).toMatch(/\{#if errorMessage\}\s*<p[^>]*role="alert"[^>]*>\{errorMessage\}<\/p>/);
	});
});
