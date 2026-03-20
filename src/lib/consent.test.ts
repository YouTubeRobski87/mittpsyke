import { describe, it, expect, beforeEach } from 'vitest';
import {
	getAnalyticsConsent,
	hasAnalyticsConsent,
	grantAnalyticsConsent,
	declineAnalyticsConsent,
	hasSensitiveConsent,
	grantSensitiveConsent,
	hasSensitiveConsentHeader,
	ANALYTICS_CONSENT_STORAGE_KEY,
	SENSITIVE_CONSENT_STORAGE_KEY,
	SENSITIVE_CONSENT_VERSION,
	SENSITIVE_CONSENT_HEADER
} from './consent';

// jsdom provides localStorage — clear it before each test
beforeEach(() => {
	localStorage.clear();
});

// ---------------------------------------------------------------------------
// Analytics consent
// ---------------------------------------------------------------------------

describe('getAnalyticsConsent', () => {
	it('returns null when nothing is stored', () => {
		expect(getAnalyticsConsent()).toBeNull();
	});

	it('returns null for an unrecognised stored value', () => {
		localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'garbage');
		expect(getAnalyticsConsent()).toBeNull();
	});

	it('returns "accepted" after grantAnalyticsConsent', () => {
		grantAnalyticsConsent();
		expect(getAnalyticsConsent()).toBe('accepted');
	});

	it('returns "declined" after declineAnalyticsConsent', () => {
		declineAnalyticsConsent();
		expect(getAnalyticsConsent()).toBe('declined');
	});
});

describe('hasAnalyticsConsent', () => {
	it('returns false when consent has not been given', () => {
		expect(hasAnalyticsConsent()).toBe(false);
	});

	it('returns false when consent has been declined', () => {
		declineAnalyticsConsent();
		expect(hasAnalyticsConsent()).toBe(false);
	});

	it('returns true when consent has been granted', () => {
		grantAnalyticsConsent();
		expect(hasAnalyticsConsent()).toBe(true);
	});

	it('returns false after revoking a previously granted consent', () => {
		grantAnalyticsConsent();
		declineAnalyticsConsent();
		expect(hasAnalyticsConsent()).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Sensitive AI consent
// ---------------------------------------------------------------------------

describe('hasSensitiveConsent', () => {
	it('returns false when nothing is stored', () => {
		expect(hasSensitiveConsent()).toBe(false);
	});

	it('returns false when the stored value is outdated / wrong', () => {
		localStorage.setItem(SENSITIVE_CONSENT_STORAGE_KEY, 'old-version');
		expect(hasSensitiveConsent()).toBe(false);
	});

	it('returns true after grantSensitiveConsent', () => {
		grantSensitiveConsent();
		expect(hasSensitiveConsent()).toBe(true);
	});

	it('stores exactly the current version string', () => {
		grantSensitiveConsent();
		expect(localStorage.getItem(SENSITIVE_CONSENT_STORAGE_KEY)).toBe(SENSITIVE_CONSENT_VERSION);
	});
});

// ---------------------------------------------------------------------------
// Server-side header helper
// ---------------------------------------------------------------------------

describe('hasSensitiveConsentHeader', () => {
	function makeRequest(headerValue: string | null): Request {
		const headers = new Headers();
		if (headerValue !== null) {
			headers.set(SENSITIVE_CONSENT_HEADER, headerValue);
		}
		return new Request('https://example.com', { headers });
	}

	it('returns false when the header is missing', () => {
		expect(hasSensitiveConsentHeader(makeRequest(null))).toBe(false);
	});

	it('returns false for a wrong header value', () => {
		expect(hasSensitiveConsentHeader(makeRequest('wrong-value'))).toBe(false);
	});

	it('returns true for the exact version string', () => {
		expect(hasSensitiveConsentHeader(makeRequest(SENSITIVE_CONSENT_VERSION))).toBe(true);
	});
});
