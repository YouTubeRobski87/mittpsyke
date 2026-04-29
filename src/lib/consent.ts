import { writable } from 'svelte/store';

export const cookieBannerOpen = writable(false);

export const ANALYTICS_CONSENT_STORAGE_KEY = 'cookie-consent';
export const ANALYTICS_CONSENT_COOKIE_KEY = 'cookie_consent';
export const ANALYTICS_CONSENT_EVENT = 'mittpsyke:analytics-consent-change';
export const ANALYTICS_CONSENT_ACCEPTED = 'accepted';
export const ANALYTICS_CONSENT_DECLINED = 'declined';

export const HEALTH_CONSENT_VERSION = '2026-04-29';
export const HEALTH_CONSENT_TYPE = 'health_data_processing';
export const HEALTH_CONSENT_STORAGE_KEY = 'mittpsyke.healthConsent';
export const SENSITIVE_CONSENT_STORAGE_KEY = HEALTH_CONSENT_STORAGE_KEY;
export const SENSITIVE_CONSENT_HEADER = 'x-mittpsyke-sensitive-consent';
export const SENSITIVE_CONSENT_VERSION = HEALTH_CONSENT_VERSION;

export type HealthConsentRecord = {
	accepted: true;
	type: typeof HEALTH_CONSENT_TYPE;
	timestamp: string;
	policy_version: typeof HEALTH_CONSENT_VERSION;
};

type AnalyticsConsentState =
	| typeof ANALYTICS_CONSENT_ACCEPTED
	| typeof ANALYTICS_CONSENT_DECLINED
	| null;

function dispatchAnalyticsConsentChange(state: AnalyticsConsentState) {
	if (typeof window === 'undefined') return;

	window.dispatchEvent(
		new CustomEvent(ANALYTICS_CONSENT_EVENT, {
			detail: { state }
		})
	);
}

function getAnalyticsConsentFromCookie(): AnalyticsConsentState {
	if (typeof document === 'undefined') return null;

	const cookieValue = document.cookie
		.split(';')
		.map((cookie) => cookie.trim())
		.find((cookie) => cookie.startsWith(`${ANALYTICS_CONSENT_COOKIE_KEY}=`))
		?.split('=')
		.slice(1)
		.join('=');

	if (
		cookieValue !== ANALYTICS_CONSENT_ACCEPTED &&
		cookieValue !== ANALYTICS_CONSENT_DECLINED
	) {
		return null;
	}

	return cookieValue;
}

export function getAnalyticsConsent(): AnalyticsConsentState {
	if (typeof window === 'undefined') return null;

	const stored = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
	if (
		stored !== ANALYTICS_CONSENT_ACCEPTED &&
		stored !== ANALYTICS_CONSENT_DECLINED
	) {
		const cookieConsent = getAnalyticsConsentFromCookie();
		if (cookieConsent) {
			window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, cookieConsent);
		}

		return cookieConsent;
	}

	return stored;
}

export function hasAnalyticsConsent(): boolean {
	return getAnalyticsConsent() === ANALYTICS_CONSENT_ACCEPTED;
}

export function grantAnalyticsConsent() {
	if (typeof window === 'undefined') return;

	window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, ANALYTICS_CONSENT_ACCEPTED);
	dispatchAnalyticsConsentChange(ANALYTICS_CONSENT_ACCEPTED);
}

export function declineAnalyticsConsent() {
	if (typeof window === 'undefined') return;

	window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, ANALYTICS_CONSENT_DECLINED);
	dispatchAnalyticsConsentChange(ANALYTICS_CONSENT_DECLINED);
}

// TODO(consent-versioning): Tie this version to a published policy/version identifier instead of a local constant.
// TODO(consent-audit): If legal/compliance review requires proof, record grant events server-side with timestamp and policy version.
// TODO(consent-withdrawal): Add a settings flow to withdraw consent and re-block affected AI/röstfunktioner until renewed consent.

export function createHealthConsentRecord(timestamp = new Date().toISOString()): HealthConsentRecord {
	return {
		accepted: true,
		type: HEALTH_CONSENT_TYPE,
		timestamp,
		policy_version: HEALTH_CONSENT_VERSION
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function hasHealthConsentRecord(value: unknown): boolean {
	return (
		isRecord(value) &&
		value.accepted === true &&
		value.type === HEALTH_CONSENT_TYPE &&
		value.policy_version === HEALTH_CONSENT_VERSION &&
		typeof value.timestamp === 'string'
	);
}

export function hasHealthConsentInMetadata(metadata: unknown): boolean {
	if (!isRecord(metadata)) return false;

	return hasHealthConsentRecord(metadata.health_data_processing_consent);
}

function getStoredHealthConsent(): unknown {
	if (typeof window === 'undefined') return null;

	try {
		const stored = window.localStorage.getItem(HEALTH_CONSENT_STORAGE_KEY);
		return stored ? JSON.parse(stored) : null;
	} catch {
		return null;
	}
}

export function hasSensitiveConsent(metadata?: unknown): boolean {
	return hasHealthConsentRecord(getStoredHealthConsent()) || hasHealthConsentInMetadata(metadata);
}

export function grantSensitiveConsent(): HealthConsentRecord {
	const consent = createHealthConsentRecord();

	if (typeof window !== 'undefined') {
		try {
			window.localStorage.setItem(HEALTH_CONSENT_STORAGE_KEY, JSON.stringify(consent));
		} catch {
			// Om localStorage inte är tillgängligt visar UI:t samtycket igen nästa gång.
		}
	}

	return consent;
}

export function hasSensitiveConsentHeader(request: Request): boolean {
	return request.headers.get(SENSITIVE_CONSENT_HEADER) === SENSITIVE_CONSENT_VERSION;
}
