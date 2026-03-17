import { browser, dev } from '$app/environment';
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

function trackEvent(eventName: EventName, params: EventParams = {}) {
	if (!browser || !hasAnalyticsConsent()) return;

	const gtag = (window as any).gtag;
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
