import { browser, dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { hasAnalyticsConsent } from '$lib/consent';

type EventName =
	| 'page_view'
	| 'landing_page_view'
	| 'article_view'
	| 'guide_view'
	| 'sign_up_started'
	| 'sign_up_completed'
	| 'login_completed'
	| 'anonymous_write_started'
	| 'anonymous_write_completed'
	| 'diary_entry_created'
	| 'diary_entry_updated'
	| 'diary_entry_deleted'
	| 'forum_thread_created'
	| 'forum_reply_created'
	| 'chat_started'
	| 'chat_message_sent'
	| 'return_visit'
	| 'streak_day_reached'
	| 'milestone_reached'
	| 'hero_cta_clicked'
	| 'internal_link_clicked'
	| 'search_used'
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
	| 'view_chat_nudge'
	| 'click_chat_nudge'
	| 'home_cta_click'
	| 'click_start_anonymous'
	| 'scroll_to_how_it_works'
	| 'qr_landing_view'
	| 'qr_cta_primary_click'
	| 'qr_cta_secondary_click'
	| 'search_performed'
	| 'search_result_click'
	| 'diary_cta_click'
	| 'diary_guest_entry_started'
	| 'diary_guest_entry_saved'
	| 'chat_open'
	| 'first_message_sent'
	| 'starter_chip_clicked';

type EventParams = Record<string, string | number | boolean>;
type ArticleViewParams = { article_slug: string; category: string };
type GuideViewParams = { guide_slug: string; category: string };
type LandingPageViewParams = { page_path: string; page_title: string };
type WordCountParams = { word_count: number };
type StreakDayReachedParams = { streak_length: number };
type MilestoneReachedParams = { milestone_name: string };
type InternalLinkClickedParams = { destination: string };
type SearchUsedParams = { query_length: number };
type LandingPageEventParams = Record<string, string | number | boolean | null>;
type LandingPageEventPayload = {
	landingPageId: string;
	abTestId?: string | null;
	eventType: 'view' | 'conversion' | 'click';
	variant?: 'A' | 'B' | null;
	sessionId?: string | null;
	metadata?: LandingPageEventParams;
};

const PUBLIC_GA_MEASUREMENT_ID = env.PUBLIC_GA_MEASUREMENT_ID;
export const GA_MEASUREMENT_ID = PUBLIC_GA_MEASUREMENT_ID;
export const PUBLIC_VERCEL_ENV = env.PUBLIC_VERCEL_ENV || '';
const PRODUCTION_HOSTS = new Set(['mittpsyke.se', 'www.mittpsyke.se']);
export const ANALYTICS_ENABLED =
	Boolean(GA_MEASUREMENT_ID) &&
	(browser ? PRODUCTION_HOSTS.has(window.location.hostname) : PUBLIC_VERCEL_ENV === 'production');
const LANDING_SESSION_STORAGE_KEY = 'mittpsyke:landing-session-id';
const FUNNEL_LANDING_VIEW_SESSION_KEY = 'mittpsyke:funnel-landing-page-viewed';
const AUTH_FUNNEL_SESSION_KEY = 'mittpsyke:auth-funnel-started';
const RETURN_VISIT_STORAGE_KEY = 'mittpsyke:last-analytics-visit-at';
const TRACKED_STREAKS_STORAGE_KEY = 'mittpsyke:tracked-streak-days';
const TRACKED_MILESTONES_STORAGE_KEY = 'mittpsyke:tracked-milestones';
const DAY_MS = 24 * 60 * 60 * 1000;
const AUTH_FUNNEL_MAX_AGE_MS = 60 * 60 * 1000;
const GTAG_SCRIPT_ID = 'mittpsyke-gtag';

let analyticsInitialized = false;
let analyticsInitPromise: Promise<boolean> | null = null;
let gtagScriptPromise: Promise<void> | null = null;
let consentDefaultSet = false;

function ensureGtag() {
	if (!browser || !ANALYTICS_ENABLED) return null;

	const windowWithGtag = window as any;
	windowWithGtag.dataLayer = windowWithGtag.dataLayer || [];

	if (typeof windowWithGtag.gtag !== 'function') {
		windowWithGtag.gtag = function gtag() {
			windowWithGtag.dataLayer.push(arguments);
		};
	}

	return windowWithGtag.gtag as (...args: any[]) => void;
}

function setDefaultConsent(gtag: (...args: any[]) => void) {
	if (consentDefaultSet) return;

	gtag('consent', 'default', {
		analytics_storage: 'denied',
		ad_storage: 'denied',
		ad_user_data: 'denied',
		ad_personalization: 'denied'
	});
	consentDefaultSet = true;
}

function loadGtagScript(): Promise<void> {
	if (!browser || !ANALYTICS_ENABLED || !GA_MEASUREMENT_ID) return Promise.resolve();
	if (gtagScriptPromise) return gtagScriptPromise;

	const existingScript = document.getElementById(GTAG_SCRIPT_ID);
	if (existingScript) return Promise.resolve();

	const script = document.createElement('script');
	script.id = GTAG_SCRIPT_ID;
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;

	gtagScriptPromise = new Promise((resolve, reject) => {
		script.addEventListener('load', () => resolve(), { once: true });
		script.addEventListener('error', () => reject(new Error('Google Analytics gtag script failed to load')), {
			once: true
		});
	});

	document.head.appendChild(script);
	return gtagScriptPromise;
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
	analyticsInitPromise = null;
}

export async function initializeAnalytics() {
	if (!browser || !ANALYTICS_ENABLED || !hasAnalyticsConsent() || !GA_MEASUREMENT_ID) return false;
	if (analyticsInitialized) return true;
	if (analyticsInitPromise) return analyticsInitPromise;

	const gtag = ensureGtag();
	if (!gtag) return false;

	setDefaultConsent(gtag);

	analyticsInitPromise = loadGtagScript()
		.then(() => {
			gtag('consent', 'update', {
				analytics_storage: 'granted'
			});
			gtag('js', new Date());
			gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
			analyticsInitialized = true;
			return true;
		})
		.catch((error) => {
			analyticsInitPromise = null;
			if (dev) console.warn('Google Analytics init failed:', error);
			return false;
		});

	return analyticsInitPromise;
}

export function trackPageView(url: URL) {
	if (!browser || !ANALYTICS_ENABLED || !hasAnalyticsConsent()) return;

	void sendPageView(url);
}

async function sendPageView(url: URL) {
	if (!(await initializeAnalytics()) || !hasAnalyticsConsent()) return;

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

	void sendEvent(eventName, params);
}

export function countWords(value: string) {
	const normalized = value.trim();
	if (!normalized) return 0;
	return normalized.split(/\s+/).filter(Boolean).length;
}

function readSessionValue(key: string) {
	if (!browser) return null;

	try {
		return window.sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeSessionValue(key: string, value: string) {
	if (!browser) return;

	try {
		window.sessionStorage.setItem(key, value);
	} catch {
		// Storage can fail in private mode. Analytics must stay best effort.
	}
}

function removeSessionValue(key: string) {
	if (!browser) return;

	try {
		window.sessionStorage.removeItem(key);
	} catch {
		// Storage can fail in private mode. Analytics must stay best effort.
	}
}

function readStorageSet(key: string) {
	if (!browser) return new Set<string>();

	try {
		const raw = window.localStorage.getItem(key);
		const parsed = raw ? JSON.parse(raw) : [];
		return new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : []);
	} catch {
		return new Set<string>();
	}
}

function writeStorageSet(key: string, values: Set<string>) {
	if (!browser) return;

	try {
		window.localStorage.setItem(key, JSON.stringify([...values]));
	} catch {
		// Storage can fail in private mode. Analytics must stay best effort.
	}
}

function markAuthFunnelStarted(type: 'signup' | 'login') {
	writeSessionValue(AUTH_FUNNEL_SESSION_KEY, JSON.stringify({ type, at: Date.now() }));
}

export function clearPendingAuthFunnel() {
	removeSessionValue(AUTH_FUNNEL_SESSION_KEY);
}

export function trackLandingPageViewOnce(url: URL, pageTitle = browser ? document.title : '') {
	if (!browser || readSessionValue(FUNNEL_LANDING_VIEW_SESSION_KEY)) return;

	writeSessionValue(FUNNEL_LANDING_VIEW_SESSION_KEY, '1');
	trackLandingPageView({
		page_path: `${url.pathname}${url.search}`,
		page_title: pageTitle
	});
}

export function trackReturnVisitIfNeeded(now = Date.now()) {
	if (!browser) return;

	let lastVisitAt = 0;
	try {
		lastVisitAt = Number(window.localStorage.getItem(RETURN_VISIT_STORAGE_KEY) ?? '0');
		window.localStorage.setItem(RETURN_VISIT_STORAGE_KEY, String(now));
	} catch {
		return;
	}

	if (Number.isFinite(lastVisitAt) && lastVisitAt > 0 && now - lastVisitAt >= DAY_MS) {
		trackReturnVisit();
	}
}

export function trackAuthCompletedFromPendingState() {
	if (!browser) return;

	const raw = readSessionValue(AUTH_FUNNEL_SESSION_KEY);
	if (!raw) return;

	removeSessionValue(AUTH_FUNNEL_SESSION_KEY);

	try {
		const parsed = JSON.parse(raw) as { type?: unknown; at?: unknown };
		const age = Date.now() - Number(parsed.at);
		if (!Number.isFinite(age) || age < 0 || age > AUTH_FUNNEL_MAX_AGE_MS) return;

		if (parsed.type === 'signup') {
			trackSignUpCompleted();
		} else if (parsed.type === 'login') {
			trackLoginCompleted();
		}
	} catch {
		// Ignore malformed funnel markers.
	}
}

export function trackLandingPageView(params: LandingPageViewParams) {
	trackEvent('landing_page_view', params);
}

export function trackArticleView(params: ArticleViewParams) {
	trackEvent('article_view', params);
}

export function trackGuideView(params: GuideViewParams) {
	trackEvent('guide_view', params);
}

export function trackSignUpStarted() {
	markAuthFunnelStarted('signup');
	trackEvent('sign_up_started');
}

export function markLoginStarted() {
	markAuthFunnelStarted('login');
}

export function trackSignUpCompleted() {
	trackEvent('sign_up_completed');
}

export function trackLoginCompleted() {
	trackEvent('login_completed');
}

export function trackAnonymousWriteStarted() {
	trackEvent('anonymous_write_started');
}

export function trackAnonymousWriteCompleted(params: WordCountParams) {
	trackEvent('anonymous_write_completed', params);
}

export function trackAnonymousWriteCompletedFromText(text: string) {
	trackAnonymousWriteCompleted({ word_count: countWords(text) });
}

export function trackDiaryEntryCreated(params: WordCountParams) {
	trackEvent('diary_entry_created', params);
}

export function trackDiaryEntryUpdated() {
	trackEvent('diary_entry_updated');
}

export function trackDiaryEntryDeleted() {
	trackEvent('diary_entry_deleted');
}

export function trackForumThreadCreated() {
	trackEvent('forum_thread_created');
}

export function trackForumReplyCreated() {
	trackEvent('forum_reply_created');
}

export function trackChatStarted() {
	trackEvent('chat_started');
}

export function trackChatMessageSent() {
	trackEvent('chat_message_sent');
}

export function trackReturnVisit() {
	trackEvent('return_visit');
}

export function trackStreakDayReached(params: StreakDayReachedParams) {
	trackEvent('streak_day_reached', params);
}

export function trackStreakDayReachedOnce(streakLength: number) {
	if (!Number.isFinite(streakLength) || streakLength < 1) return;

	const normalized = Math.floor(streakLength);
	const key = String(normalized);
	const tracked = readStorageSet(TRACKED_STREAKS_STORAGE_KEY);
	if (tracked.has(key)) return;

	tracked.add(key);
	writeStorageSet(TRACKED_STREAKS_STORAGE_KEY, tracked);
	trackStreakDayReached({ streak_length: normalized });
}

export function trackMilestoneReached(params: MilestoneReachedParams) {
	trackEvent('milestone_reached', params);
}

export function trackMilestoneReachedOnce(milestoneName: string) {
	const normalized = milestoneName.trim();
	if (!normalized) return;

	const tracked = readStorageSet(TRACKED_MILESTONES_STORAGE_KEY);
	if (tracked.has(normalized)) return;

	tracked.add(normalized);
	writeStorageSet(TRACKED_MILESTONES_STORAGE_KEY, tracked);
	trackMilestoneReached({ milestone_name: normalized });
}

export function trackHeroCtaClicked() {
	trackEvent('hero_cta_clicked');
}

export function trackInternalLinkClicked(params: InternalLinkClickedParams) {
	trackEvent('internal_link_clicked', params);
}

export function trackSearchUsed(params: SearchUsedParams) {
	trackEvent('search_used', params);
}

async function sendEvent(eventName: EventName, params: EventParams) {
	if (!(await initializeAnalytics()) || !hasAnalyticsConsent()) return;

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
	trackAnonymousWriteStarted();
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
	trackSignUpCompleted();
}

export function trackRegistrationComplete() {
	trackSignUpCompleted();
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
	trackHeroCtaClicked();
}

export function trackHeroCTASecondaryClick() {
	trackHeroCtaClicked();
}

export function trackHeroCtaPrimaryClick() {
	trackHeroCTAPrimaryClick();
}

export function trackHeroCtaSecondaryClick() {
	trackHeroCTASecondaryClick();
}

export function trackHomeCtaClick(params: { section: string; cta: string; href: string }) {
	trackEvent('home_cta_click', {
		section: params.section,
		cta: params.cta,
		href: params.href
	});
}

export function trackClickStartAnonymous() {
	trackAnonymousWriteStarted();
}

export function trackScrollToHowItWorks() {
	trackEvent('scroll_to_how_it_works');
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

export function trackDiaryCtaClick(variant: string) {
	trackEvent('diary_cta_click', { variant });
}

export function trackDiaryGuestEntryStarted() {
	trackAnonymousWriteStarted();
}

export function trackDiaryGuestEntrySaved(wordCount: number) {
	trackAnonymousWriteCompleted({ word_count: wordCount });
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
