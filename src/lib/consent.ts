import { writable } from 'svelte/store';

export const cookieBannerOpen = writable(false);

export const ANALYTICS_CONSENT_STORAGE_KEY = 'cookie-consent';
export const ANALYTICS_CONSENT_EVENT = 'mittpsyke:analytics-consent-change';
export const ANALYTICS_CONSENT_ACCEPTED = 'accepted';
export const ANALYTICS_CONSENT_DECLINED = 'declined';

export const SENSITIVE_CONSENT_STORAGE_KEY = 'mittpsyke:consent:sensitive-ai';
export const SENSITIVE_CONSENT_HEADER = 'x-mittpsyke-sensitive-consent';
export const SENSITIVE_CONSENT_VERSION = '2026-03-sensitive-ai-v1';

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

export function getAnalyticsConsent(): AnalyticsConsentState {
	if (typeof window === 'undefined') return null;

	const stored = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
	if (
		stored !== ANALYTICS_CONSENT_ACCEPTED &&
		stored !== ANALYTICS_CONSENT_DECLINED
	) {
		return null;
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

export function hasSensitiveConsent(): boolean {
	if (typeof window === 'undefined') return false;

	return window.localStorage.getItem(SENSITIVE_CONSENT_STORAGE_KEY) === SENSITIVE_CONSENT_VERSION;
}

export function grantSensitiveConsent() {
	if (typeof window === 'undefined') return;

	window.localStorage.setItem(SENSITIVE_CONSENT_STORAGE_KEY, SENSITIVE_CONSENT_VERSION);
}

export function hasSensitiveConsentHeader(request: Request): boolean {
	return request.headers.get(SENSITIVE_CONSENT_HEADER) === SENSITIVE_CONSENT_VERSION;
}
