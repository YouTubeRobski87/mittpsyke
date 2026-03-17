import { browser, dev } from '$app/environment';
import { hasAnalyticsConsent } from '$lib/consent';

export const GA_MEASUREMENT_ID = 'G-0CLWCRW7SN';

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEventMap = {
	click_dagbok_cta: {
		destination: '/register';
		location: 'dagbok_guest';
	};
	first_diary_entry: {
		has_mood: boolean;
		tag_count: number;
	};
	registration_complete: {
		destination: '/dagbok';
		method: 'email_password';
	};
	view_register_page: {
		page_name: 'register';
	};
	write_started: {
		location: 'skriv';
	};
	continue_from_write: {
		char_count: number;
	};
	save_account_from_write: {
		char_count: number;
	};
};

declare global {
	interface Window {
		dataLayer: unknown[];
		gtag?: (...args: unknown[]) => void;
	}
}

let gaInitialized = false;
let vercelTelemetryLoaded = false;
let vercelTelemetryPromise: Promise<void> | null = null;

function canTrack() {
	return browser && typeof window !== 'undefined' && hasAnalyticsConsent();
}

function withDebugMode(params: AnalyticsParams = {}) {
	if (!dev) return params;
	return { ...params, debug_mode: true };
}

function ensureGtag() {
	if (!browser || typeof window === 'undefined') return;

	window.dataLayer = window.dataLayer || [];
	window.gtag =
		window.gtag ||
		((...args: unknown[]) => {
			window.dataLayer.push(args);
		});
}

function loadVercelTelemetry() {
	if (!browser || vercelTelemetryLoaded) return;

	if (!vercelTelemetryPromise) {
		vercelTelemetryPromise = Promise.all([
			import('@vercel/speed-insights/sveltekit'),
			import('@vercel/analytics/sveltekit')
		])
			.then(([speedInsights, analytics]) => {
				speedInsights.injectSpeedInsights();
				analytics.injectAnalytics({ mode: dev ? 'development' : 'production' });
				vercelTelemetryLoaded = true;
			})
			.catch(() => {
				vercelTelemetryPromise = null;
			});
	}
}

export function initializeAnalytics() {
	if (!canTrack()) return;

	ensureGtag();
	loadVercelTelemetry();

	if (gaInitialized) return;

	window.gtag?.('js', new Date());
	window.gtag?.('config', GA_MEASUREMENT_ID, withDebugMode({ send_page_view: false }));
	gaInitialized = true;
}

export function trackPageView(url?: URL | string) {
	if (!canTrack()) return;

	initializeAnalytics();

	const currentUrl = url
		? typeof url === 'string'
			? new URL(url, window.location.origin)
			: url
		: new URL(window.location.href);

	window.gtag?.(
		'event',
		'page_view',
		withDebugMode({
			page_title: document.title,
			page_location: currentUrl.href,
			page_path: `${currentUrl.pathname}${currentUrl.search}`
		})
	);
}

export function trackEvent<TEvent extends keyof AnalyticsEventMap>(
	eventName: TEvent,
	params: AnalyticsEventMap[TEvent]
) {
	if (!canTrack()) return;

	initializeAnalytics();
	window.gtag?.('event', eventName, withDebugMode(params));
}

export function trackRegisterView() {
	trackEvent('view_register_page', { page_name: 'register' });
}

export function trackRegistrationComplete() {
	trackEvent('registration_complete', {
		destination: '/dagbok',
		method: 'email_password'
	});
}

export function trackFirstDiaryEntry(details: { hasMood: boolean; tagCount: number }) {
	trackEvent('first_diary_entry', {
		has_mood: details.hasMood,
		tag_count: details.tagCount
	});
}

export function trackDagbokCtaClick() {
	trackEvent('click_dagbok_cta', {
		destination: '/register',
		location: 'dagbok_guest'
	});
}

export function trackWriteStarted() {
	trackEvent('write_started', { location: 'skriv' });
}

export function trackContinueFromWrite(charCount: number) {
	trackEvent('continue_from_write', { char_count: charCount });
}

export function trackSaveAccountFromWrite(charCount: number) {
	trackEvent('save_account_from_write', { char_count: charCount });
}
