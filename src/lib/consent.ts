export const SENSITIVE_CONSENT_STORAGE_KEY = 'mittpsyke:consent:sensitive-ai';
export const SENSITIVE_CONSENT_HEADER = 'x-mittpsyke-sensitive-consent';
export const SENSITIVE_CONSENT_VERSION = '2026-03-sensitive-ai-v1';

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
