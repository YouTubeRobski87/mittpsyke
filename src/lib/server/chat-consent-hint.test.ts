import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));
const { resolveChatConsentHint } = await import('./chat-consent-hint');

describe('resolveChatConsentHint', () => {
	it('visar samtyckesrutan direkt bara för en gäst utan samtyckescookie', () => {
		expect(resolveChatConsentHint({ authenticated: false, guestConsentCookie: undefined })).toBe('missing');
		expect(resolveChatConsentHint({ authenticated: false, guestConsentCookie: '' })).toBe('missing');
	});

	it('låter klienten fråga servern för gäster med cookie och för inloggade', () => {
		expect(resolveChatConsentHint({ authenticated: false, guestConsentCookie: 'token' })).toBe('check');
		expect(resolveChatConsentHint({ authenticated: true, guestConsentCookie: undefined })).toBe('check');
		expect(resolveChatConsentHint({ authenticated: true, guestConsentCookie: 'token' })).toBe('check');
	});
});
