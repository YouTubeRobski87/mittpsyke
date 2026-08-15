import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hemligheten läses via $env/dynamic/private. Mocken är muterbar så att
// enskilda test kan ta bort den och kontrollera fail-closed.
const mockEnv = vi.hoisted(() => ({
	env: { CHAT_ANON_CONSENT_SECRET: 'a'.repeat(48) } as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => mockEnv);

import {
	ANONYMOUS_CHAT_CONSENT_PURPOSE,
	ANONYMOUS_CHAT_CONSENT_TTL_SECONDS,
	hasAnonymousChatConsentSecret,
	hasValidAnonymousChatConsent,
	issueAnonymousChatConsentToken,
	verifyAnonymousChatConsentToken
} from './anonymous-chat-consent';
import { CHAT_AI_CONSENT_POLICY_VERSION } from './chat-ai-consent';

const NOW = new Date('2026-08-15T12:00:00Z');
const VALID_SECRET = 'a'.repeat(48);

function decodePayload(token: string): Record<string, unknown> {
	const [segment] = token.split('.');
	return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

function reSign(payload: Record<string, unknown>, secret: string): string {
	const segment = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
	// Signera med angiven hemlighet för att simulera en angripare eller en
	// server med annan nyckel.
	const { createHmac } = require('node:crypto') as typeof import('node:crypto');
	const signature = createHmac('sha256', secret).update(segment).digest('base64url');
	return `${segment}.${signature}`;
}

describe('anonym chat-consent-token', () => {
	beforeEach(() => {
		mockEnv.env.CHAT_ANON_CONSENT_SECRET = VALID_SECRET;
	});

	it('utfärdar en token som verifierar', () => {
		const { token } = issueAnonymousChatConsentToken({ now: NOW });
		const result = verifyAnonymousChatConsentToken(token, NOW);

		expect(result.ok).toBe(true);
		expect(hasValidAnonymousChatConsent(token, NOW)).toBe(true);
	});

	it('nyttolasten innehåller purpose, policyversion, exp och jti', () => {
		const { token, expiresAt } = issueAnonymousChatConsentToken({ now: NOW });
		const payload = decodePayload(token);

		expect(payload.purpose).toBe(ANONYMOUS_CHAT_CONSENT_PURPOSE);
		expect(payload.policyVersion).toBe(CHAT_AI_CONSENT_POLICY_VERSION);
		expect(payload.exp).toBe(Math.floor(NOW.getTime() / 1000) + ANONYMOUS_CHAT_CONSENT_TTL_SECONDS);
		expect(payload.jti).toMatch(/^[0-9a-f-]{36}$/i);
		expect(expiresAt).toBe(payload.exp);
	});

	it('innehåller ingen identifierare för personen', () => {
		const { token } = issueAnonymousChatConsentToken({ now: NOW });
		const payload = decodePayload(token);

		// Endast de fyra fälten - ingen ip, ingen user-agent, inget user_id.
		expect(Object.keys(payload).sort()).toEqual(['exp', 'jti', 'policyVersion', 'purpose']);
	});

	it('två tokens skiljer sig åt även samma sekund', () => {
		const first = issueAnonymousChatConsentToken({ now: NOW }).token;
		const second = issueAnonymousChatConsentToken({ now: NOW }).token;

		expect(first).not.toBe(second);
	});

	it('avvisar manipulerad nyttolast', () => {
		const { token } = issueAnonymousChatConsentToken({ now: NOW });
		const payload = decodePayload(token);
		payload.exp = Math.floor(NOW.getTime() / 1000) + 60 * 60 * 24 * 365;

		// Ny nyttolast, gammal signatur.
		const tamperedSegment = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
		const tampered = `${tamperedSegment}.${token.split('.')[1]}`;

		expect(verifyAnonymousChatConsentToken(tampered, NOW).ok).toBe(false);
	});

	it('avvisar fel signatur', () => {
		const { token } = issueAnonymousChatConsentToken({ now: NOW });
		const forged = reSign(decodePayload(token), 'b'.repeat(48));

		expect(verifyAnonymousChatConsentToken(forged, NOW).ok).toBe(false);
	});

	it('avvisar utgången token', () => {
		const { token } = issueAnonymousChatConsentToken({ now: NOW, ttlSeconds: 60 });
		const later = new Date(NOW.getTime() + 61_000);

		expect(verifyAnonymousChatConsentToken(token, NOW).ok).toBe(true);
		expect(verifyAnonymousChatConsentToken(token, later).ok).toBe(false);
	});

	it('avvisar exakt vid utgångstiden', () => {
		const { token } = issueAnonymousChatConsentToken({ now: NOW, ttlSeconds: 60 });
		const atExpiry = new Date(NOW.getTime() + 60_000);

		expect(verifyAnonymousChatConsentToken(token, atExpiry).ok).toBe(false);
	});

	it('avvisar fel purpose', () => {
		const payload = decodePayload(issueAnonymousChatConsentToken({ now: NOW }).token);
		payload.purpose = 'unsubscribe';

		expect(verifyAnonymousChatConsentToken(reSign(payload, VALID_SECRET), NOW).ok).toBe(false);
	});

	it('avvisar fel policyversion', () => {
		const payload = decodePayload(issueAnonymousChatConsentToken({ now: NOW }).token);
		payload.policyVersion = 'chat-ai-v0';

		expect(verifyAnonymousChatConsentToken(reSign(payload, VALID_SECRET), NOW).ok).toBe(false);
	});

	it('avvisar trasiga tokenformat utan att kasta', () => {
		const malformed = [
			null,
			undefined,
			'',
			'   ',
			'ingen-punkt',
			'a.b.c',
			'.',
			'aGVq.',
			'.c2ln',
			'%%%.%%%',
			Buffer.from('inte json', 'utf8').toString('base64url') + '.sig'
		];

		for (const token of malformed) {
			expect(() => verifyAnonymousChatConsentToken(token, NOW)).not.toThrow();
			expect(verifyAnonymousChatConsentToken(token, NOW).ok).toBe(false);
		}
	});

	it('avvisar giltigt signerad token med trasig jti', () => {
		const payload = decodePayload(issueAnonymousChatConsentToken({ now: NOW }).token);
		payload.jti = 'inte-en-uuid';

		expect(verifyAnonymousChatConsentToken(reSign(payload, VALID_SECRET), NOW).ok).toBe(false);
	});

	describe('saknad hemlighet', () => {
		it('verifiering stängs, inte öppnas', () => {
			const { token } = issueAnonymousChatConsentToken({ now: NOW });
			mockEnv.env.CHAT_ANON_CONSENT_SECRET = undefined;

			expect(verifyAnonymousChatConsentToken(token, NOW).ok).toBe(false);
			expect(hasValidAnonymousChatConsent(token, NOW)).toBe(false);
			expect(hasAnonymousChatConsentSecret()).toBe(false);
		});

		it('utfärdande kastar i stället för att signera med tomt', () => {
			mockEnv.env.CHAT_ANON_CONSENT_SECRET = undefined;

			expect(() => issueAnonymousChatConsentToken({ now: NOW })).toThrow();
		});

		it('för kort hemlighet räknas som saknad', () => {
			mockEnv.env.CHAT_ANON_CONSENT_SECRET = 'kort';

			expect(hasAnonymousChatConsentSecret()).toBe(false);
			expect(() => issueAnonymousChatConsentToken({ now: NOW })).toThrow();
		});
	});

	it('använder inte SUPABASE_JWT_SECRET som fallback', async () => {
		const { readFileSync } = await import('node:fs');
		const source = readFileSync(new URL('./anonymous-chat-consent.ts', import.meta.url), 'utf8');
		const code = source
			.split('\n')
			.filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
			.join('\n');

		expect(code).not.toContain('SUPABASE_JWT_SECRET');
		expect(code).not.toContain('UNSUBSCRIBE_TOKEN_SECRET');
		expect(code).toContain('CHAT_ANON_CONSENT_SECRET');
	});

	it('återanvänder canonical policyversion i stället för en egen sträng', async () => {
		const { readFileSync } = await import('node:fs');
		const source = readFileSync(new URL('./anonymous-chat-consent.ts', import.meta.url), 'utf8');

		expect(source).toContain('CHAT_AI_CONSENT_POLICY_VERSION');
		expect(source).not.toContain("'chat-ai-v1'");
	});
});
