import { browser, dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { hasAnalyticsConsent } from '$lib/consent';

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
	| 'hero_cta_secondary_click';

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

export const GA_MEASUREMENT_ID = env.PUBLIC_GA_MEASUREMENT_ID || '';
const LANDING_SESSION_STORAGE_KEY = 'mittpsyke:landing-session-id';

let analyticsInitialized = false;

function ensureGtag() {
	if (!browser) return null;

	const windowWithGtag = window as any;
	windowWithGtag.dataLayer = windowWithGtag.dataLayer || [];

	if (typeof windowWithGtag.gtag !== 'function') {
		windowWithGtag.gtag = (...args: any[]) => {
			windowWithGtag.dataLayer.push(args);
		};
	}

	return windowWithGtag.gtag as (...args: any[]) => void;
}

export function initializeAnalytics() {
	if (!browser || !hasAnalyticsConsent() || analyticsInitialized || !GA_MEASUREMENT_ID) return;

	const gtag = ensureGtag();
	if (!gtag) return;

	gtag('consent', 'update', {
		analytics_storage: 'granted'
	});
	gtag('js', new Date());
	gtag('config', GA_MEASUREMENT_ID);
	analyticsInitialized = true;
}

export function trackPageView(url: URL) {
	if (!browser || !hasAnalyticsConsent()) return;

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

function trackEvent(eventName: EventName, params: EventParams = {}) {
	if (!browser || !hasAnalyticsConsent()) return;

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

// Write page events
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

// Temp entry events
export function trackTempEntrySaved() {
	trackEvent('temp_entry_saved');
}

export function trackRegisterCtaClicked() {
	trackEvent('register_cta_clicked');
}

export function trackContinueAnonymousClicked() {
	trackEvent('continue_anonymous_clicked');
}

// Register page events
export function trackRegisterPageView(hasTempEntry: boolean) {
	trackEvent('register_page_view', { has_temp_entry: hasTempEntry });
}

export function trackTempEntryPreviewShown() {
	trackEvent('temp_entry_preview_shown');
}

export function trackViewRegisterPage() {
	trackEvent('view_register_page');
}

// Registration completion
export function trackSignupCompleted() {
	trackEvent('signup_completed');
}

export function trackRegistrationComplete() {
	trackEvent('registration_complete');
}

// Diary events
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

// Horoscope events
export function trackHoroscopeCTAClick() {
	trackEvent('horoscope_cta_clicked');
}

// Hero section events
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
	if (!browser || !hasAnalyticsConsent()) {
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
