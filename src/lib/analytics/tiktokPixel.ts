import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { hasAnalyticsConsent } from '$lib/consent';

type TikTokEventName = 'ViewContent' | 'ClickButton' | 'CompleteRegistration';
type TikTokEventParams = Record<string, string | number | boolean>;
type TikTokMethod = (...args: unknown[]) => void;

interface TikTokQueue extends Array<unknown> {
	_i?: Record<string, TikTokQueue>;
	_t?: Record<string, number>;
	_o?: Record<string, Record<string, unknown>>;
	_u?: string;
	methods?: readonly string[];
	setAndDefer?: (target: TikTokQueue, method: string) => void;
	instance?: (pixelId: string) => TikTokQueue;
	load?: (pixelId: string, options?: Record<string, unknown>) => void;
	page?: TikTokMethod;
	track?: (eventName: TikTokEventName, params?: TikTokEventParams) => void;
	grantConsent?: TikTokMethod;
	revokeConsent?: TikTokMethod;
}

type TikTokWindow = Window & {
	TiktokAnalyticsObject?: string;
	ttq?: TikTokQueue;
};

const PIXEL_SCRIPT_ID = 'mittpsyke-tiktok-pixel';
const PIXEL_SCRIPT_URL = 'https://analytics.tiktok.com/i18n/pixel/events.js';
const PIXEL_METHODS = [
	'page',
	'track',
	'identify',
	'instances',
	'debug',
	'on',
	'off',
	'once',
	'ready',
	'alias',
	'group',
	'enableCookie',
	'disableCookie',
	'holdConsent',
	'revokeConsent',
	'grantConsent'
] as const;

const BLOCKED_TIKTOK_PATHS = [
	/^\/chat(?:\/|$)/,
	/^\/dagbok(?:\/|$)/,
	/^\/dashboard(?:\/|$)/,
	/^\/framsteg(?:\/|$)/,
	/^\/analys(?:\/|$)/,
	/^\/insikter(?:\/|$)/,
	/^\/dagars-avtryck(?:\/|$)/,
	/^\/spegelvattnet(?:\/|$)/,
	/^\/skriv(?:\/|$)/,
	/^\/login(?:\/|$)/,
	/^\/register(?:\/|$)/
] as const;

export const TIKTOK_PIXEL_ID = env.PUBLIC_TIKTOK_PIXEL_ID?.trim() ?? '';
export const TIKTOK_PIXEL_ENABLED = Boolean(TIKTOK_PIXEL_ID);

let pixelInitialized = false;
let pixelConsentGranted = false;

export function isTikTokPixelAllowedPath(pathname?: string): boolean {
	const currentPath =
		typeof pathname === 'string' && pathname.trim().length > 0
			? pathname
			: browser
				? window.location.pathname
				: '/';

	return !BLOCKED_TIKTOK_PATHS.some((pattern) => pattern.test(currentPath));
}

function deferMethod(target: TikTokQueue, method: string) {
	const methods = target as unknown as Record<string, TikTokMethod>;
	if (typeof methods[method] === 'function') return;

	methods[method] = (...args: unknown[]) => {
		target.push([method, ...args]);
	};
}

function ensureTikTokQueue(): TikTokQueue | null {
	if (!browser) return null;

	const tiktokWindow = window as TikTokWindow;
	tiktokWindow.TiktokAnalyticsObject = 'ttq';
	const ttq = (tiktokWindow.ttq ??= []);
	ttq.methods ??= PIXEL_METHODS;
	ttq.setAndDefer ??= deferMethod;
	ttq.instance ??= (pixelId: string) => {
		const instance = ttq._i?.[pixelId] ?? [];
		for (const method of PIXEL_METHODS) deferMethod(instance, method);
		return instance;
	};

	for (const method of PIXEL_METHODS) {
		deferMethod(ttq, method);
	}

	if (typeof ttq.load !== 'function') {
		ttq.load = (pixelId: string, options: Record<string, unknown> = {}) => {
			ttq._i ??= {};
			ttq._t ??= {};
			ttq._o ??= {};

			if (ttq._i[pixelId]) return;

			const instance = (ttq._i[pixelId] = [] as TikTokQueue);
			instance._u = PIXEL_SCRIPT_URL;
			ttq._t[pixelId] = Date.now();
			ttq._o[pixelId] = options;

			for (const method of PIXEL_METHODS) {
				deferMethod(instance, method);
			}

			if (document.getElementById(PIXEL_SCRIPT_ID)) return;

			const script = document.createElement('script');
			script.id = PIXEL_SCRIPT_ID;
			script.async = true;
			script.src = `${PIXEL_SCRIPT_URL}?sdkid=${encodeURIComponent(pixelId)}&lib=ttq`;
			document.head.appendChild(script);
		};
	}

	return ttq;
}

export function initializeTikTokPixel(): boolean {
	if (!browser || !TIKTOK_PIXEL_ENABLED || !hasAnalyticsConsent() || !isTikTokPixelAllowedPath()) {
		return false;
	}

	const ttq = ensureTikTokQueue();
	if (!ttq) return false;

	if (!pixelInitialized) {
		ttq.load?.(TIKTOK_PIXEL_ID, { historyObserver: false });
		pixelInitialized = true;
	}

	if (!pixelConsentGranted) {
		ttq.grantConsent?.();
		pixelConsentGranted = true;
	}

	return true;
}

export function disableTikTokPixel() {
	if (!browser) return;

	const ttq = (window as TikTokWindow).ttq;
	ttq?.revokeConsent?.();
	document.getElementById(PIXEL_SCRIPT_ID)?.remove();
	pixelConsentGranted = false;
	pixelInitialized = false;
}

export function trackTikTokPageView(url: URL) {
	if (!isTikTokPixelAllowedPath(url.pathname) || !initializeTikTokPixel() || !hasAnalyticsConsent()) {
		return;
	}

	const ttq = (window as TikTokWindow).ttq;
	ttq?.page?.();
}

export function trackTikTokButtonClick(
	buttonName: 'start_writing_anonymously' | 'start_chat' | 'continue_writing' | 'save_create_account'
) {
	if (!initializeTikTokPixel() || !hasAnalyticsConsent()) return;

	(window as TikTokWindow).ttq?.track?.('ClickButton', { button_name: buttonName });
}

export function trackTikTokRegistrationCompleted() {
	if (!initializeTikTokPixel() || !hasAnalyticsConsent()) return;

	(window as TikTokWindow).ttq?.track?.('CompleteRegistration');
}
