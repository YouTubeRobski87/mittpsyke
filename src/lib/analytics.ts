import { browser, dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { hasAnalyticsConsent } from '$lib/consent';

// Obs: Vercel sätter automatiskt VERCEL_ENV men inte PUBLIC_VERCEL_ENV.
// Vi använder !dev: blockerar lokal devserver, aktiverar alla Vercel-miljöer.
// Samtyckes-gaten (hasAnalyticsConsent) säkerställer att GA aldrig laddas utan medgivande.

type EventName =
	| 'page_view'
	| 'write_page_view'
	| 'write_started'
	| 'continue_from_write'
	| 'save_account_from_write'
	| 'temp_entry_saved'
	| 'register_cta_clicked'
	| 'continue_anonymous_clicked'
	| 'register_page_view'
	| 'temp_entry_preview_shown'
	| 'view_register_page'
	| 'registration_complete'
	| 'signup_completed'
	| 'first_diary_entry'
	| 'click_dagbok_cta'
	| 'horoscope_cta_clicked'
	| 'diary_page_opened_from_horoscope'
	| 'hero_cta_primary_click'
	| 'hero_cta_secondary_click'
	| 'qr_landing_view'
	| 'qr_cta_primary_click'
	| 'qr_cta_secondary_click'
	| 'view_chat_nudge'
	| 'click_chat_nudge';

type EventParams = Record<string, string | number | boolean>;
type LandingPageEventParams = Record<string, string | number | boolean | null>;
type LandingPageEventPayload = {
	landingPageId: string;
	abTestId?: string | null;
	eventType: 'view' | 'conversion' | 'click';
	variant?: 'A' | 'B' | null;
	sessionId?: string | null;
	metadata?: LandingPageEventParams;
};

export const GA_MEASUREMENT_ID = env.PUBLIC_GA_MEASUREMENT_ID || 'G-8XG01VCB5N';
export const ANALYTICS_ENABLED = !dev;
const LANDING_SESSION_STORAGE_KEY = 'mittpsyke:landing-session-id';

let analyticsInitialized = false;

function ensureGtag() {
	if (!browser || !ANALYTICS_ENABLED) return null;

	const windowWithGtag = window as any;
	windowWithGtag.dataLayer = windowWithGtag.dataLayer || [];

	if (typeof windowWithGtag.gtag !== 'function') {
		windowWithGtag.gtag = function () {
			windowWithGtag.dataLayer.push(arguments);
		};
	}

	return windowWithGtag.gtag as (...args: any[]) => void;
}

export function disableAnalytics() {
	if (!browser) return;

	// Meddela GA att analytics-lagring nekas
	const gtag = ensureGtag();
	if (gtag) {
		gtag('consent', 'update', { analytics_storage: 'denied' });
	}

	// Rensa GA-cookies (_ga, _gid, _ga_XXXXX, _gat_*)
	const hostname = window.location.hostname;
	const domainParts = hostname.split('.');
	const rootDomain = domainParts.length > 1 ? '.' + domainParts.slice(-2).join('.') : hostname;

	document.cookie.split(';').forEach((cookie) => {
		const name = cookie.split('=')[0].trim();
		if (name === '_ga' || name === '_gid' || name.startsWith('_ga_') || name.startsWith('_gat_')) {
			document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${rootDomain}`;
			document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
		}
	});

	analyticsInitialized = false;
}

export function initializeAnalytics() {
	if (!browser || !ANALYTICS_ENABLED || !hasAnalyticsConsent() || analyticsInitialized || !GA_MEASUREMENT_ID) return;

	const gtag = ensureGtag();
	if (!gtag) return;

	gtag('js', new Date());
	gtag('config', GA_MEASUREMENT_ID);

	const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
	if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
		const script = document.createElement('script');
		script.async = true;
		script.src = scriptSrc;
		document.head.appendChild(script);
	}

	analyticsInitialized = true;
}

export function trackPageView(url: URL) {
	if (!browser || !ANALYTICS_ENABLED || !hasAnalyticsConsent()) return;

	if (!analyticsInitialized) initializeAnalytics();

	const gtag = ensureGtag();
	if (!gtag) {
		if (dev) console.warn('gtag not found');
		return;
	}

	gtag('event', 'page_view', {
		page_path: `${url.pathname}${url.search}`,
		page_location: url.href,
		page_title: document.title
	});
}

export function trackEvent(eventName: EventName, params: EventParams = {}) {
	if (!browser || !ANALYTICS_ENABLED || !hasAnalyticsConsent()) return;

	if (!analyticsInitialized) initializeAnalytics();

	const gtag = ensureGtag();
	if (!gtag) {
		if (dev) console.warn('gtag not found');
		return;
	}

	try {
		gtag('event', eventName, params);
	} catch (error) {
		if (dev) console.error('trackEvent error:', error);
	}
}

export function trackWritePageView() {
	trackEvent('write_page_view');
}

export function trackWriteStarted() {
	trackEvent('write_started');
}

export function trackContinueFromWrite() {
	trackEvent('continue_from_write');
}

export function trackSaveAccountFromWrite() {
	trackEvent('save_account_from_write');
}

export function trackTempEntrySaved() {
	trackEvent('temp_entry_saved');
}

export function trackRegisterCtaClicked() {
	trackEvent('register_cta_clicked');
}

export function trackContinueAnonymousClicked() {
	trackEvent('continue_anonymous_clicked');
}

export function trackRegisterPageView(hasTempEntry: boolean) {
	trackEvent('register_page_view', { has_temp_entry: hasTempEntry });
}

export function trackTempEntryPreviewShown() {
	trackEvent('temp_entry_preview_shown');
}

export function trackViewRegisterPage() {
	trackEvent('view_register_page');
}

export function trackSignupCompleted() {
	trackEvent('signup_completed');
}

export function trackRegistrationComplete() {
	trackEvent('registration_complete');
}

export function trackFirstDiaryEntry(params?: { hasMood?: boolean; tagCount?: number }) {
	const eventParams: EventParams = {};
	if (params?.hasMood !== undefined) eventParams.has_mood = params.hasMood;
	if (params?.tagCount !== undefined) eventParams.tag_count = params.tagCount;
	trackEvent('first_diary_entry', eventParams);
}

export function trackDagbokCtaClick() {
	trackEvent('click_dagbok_cta');
}

export function trackDiaryPageOpenedFromHoroscope() {
	trackEvent('diary_page_opened_from_horoscope');
}

export function trackHoroscopeCTAClick() {
	trackEvent('horoscope_cta_clicked');
}

export function trackHeroCTAPrimaryClick() {
	trackEvent('hero_cta_primary_click');
}

export function trackHeroCTASecondaryClick() {
	trackEvent('hero_cta_secondary_click');
}

export function trackHeroCtaPrimaryClick() {
	trackHeroCTAPrimaryClick();
}

export function trackHeroCtaSecondaryClick() {
	trackHeroCTASecondaryClick();
}

export function trackQrLandingView(src?: string | null) {
	trackEvent('qr_landing_view', src ? { src } : {});
}

export function trackQrCtaPrimaryClick(src?: string | null) {
	trackEvent('qr_cta_primary_click', src ? { src } : {});
}

export function trackQrCtaSecondaryClick(src?: string | null) {
	trackEvent('qr_cta_secondary_click', src ? { src } : {});
}

function getLandingSessionId() {
	if (!browser) return null;

	const existing = window.localStorage.getItem(LANDING_SESSION_STORAGE_KEY);
	if (existing) return existing;

	const generated =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

	window.localStorage.setItem(LANDING_SESSION_STORAGE_KEY, generated);
	return generated;
}

export async function saveLandingPageEvent(payload: LandingPageEventPayload) {
	if (!browser || !ANALYTICS_ENABLED || !hasAnalyticsConsent()) {
		return { ok: false, skipped: true as const };
	}

	const body = JSON.stringify({
		landingPageId: payload.landingPageId,
		abTestId: payload.abTestId ?? null,
		eventType: payload.eventType,
		variant: payload.variant ?? null,
		sessionId: payload.sessionId ?? getLandingSessionId(),
		metadata: payload.metadata ?? {}
	});

	try {
		const response = await fetch('/api/analytics', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
			keepalive: true
		});

		if (!response.ok && dev) {
			console.warn('Landing page analytics request failed', response.status);
		}

		return { ok: response.ok };
	} catch (error) {
		if (dev) {
			console.error('Landing page analytics error:', error);
		}

		return { ok: false };
	}
}
