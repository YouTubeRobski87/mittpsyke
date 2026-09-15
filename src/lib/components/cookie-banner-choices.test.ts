import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Cookiebannern ska ge två likvärdiga val. Ingen fylld primärknapp mot en svag
// outline-knapp: designen får inte styra beslutet. Och innan besökaren valt
// "Acceptera analys" får varken Google Analytics eller Ahrefs laddas.

const banner = readFileSync(join(process.cwd(), 'src/lib/components/CookieBanner.svelte'), 'utf8');
const markup = banner.slice(banner.indexOf('{#if $cookieBannerOpen}'), banner.indexOf('<style>'));
const styles = banner.slice(banner.indexOf('<style>'));

describe('cookiebannerns två val', () => {
	const buttons = [...markup.matchAll(/<button([^>]*)>([^<]+)<\/button>/g)].map(([, attributes, label]) => ({
		attributes,
		label: label.trim()
	}));

	it('har exakt två separata val', () => {
		expect(buttons.map((button) => button.label)).toEqual(['Bara nödvändiga', 'Acceptera analys']);
		expect(buttons.find((button) => button.label === 'Bara nödvändiga')?.attributes).toContain('onclick={decline}');
		expect(buttons.find((button) => button.label === 'Acceptera analys')?.attributes).toContain('onclick={accept}');
	});

	it('ger båda valen samma knappstil och ingen egen styling per val', () => {
		for (const button of buttons) {
			expect(button.attributes.replace(/\s+/g, ' ').trim()).toMatch(/^type="button" class="cookie-choice" onclick=\{(accept|decline)\}$/);
		}
		// Ingen fylld blå primärknapp eller ljusa varianter kvar i markupen.
		expect(markup).not.toMatch(/bg-blue|bg-white|text-blue|border-blue|dark:/);
		expect(styles).not.toMatch(/\.cookie-choice--|\.cookie-accept|\.cookie-decline/);
	});

	it('följer det mörka temat och har en tydlig fokusmarkering', () => {
		const appCss = readFileSync(join(process.cwd(), 'src/app.css'), 'utf8');
		expect(styles).toContain('background: hsl(var(--surface));');
		expect(styles).toMatch(/\.cookie-choice \{[\s\S]*?min-height: 44px;/);
		// Fokusringen är sajtens globala, ljusa ring på mörk yta. Bannern får inte
		// skriva över den med en egen, svagare variant för något av valen.
		expect(appCss).toMatch(/\.dark \*:focus-visible \{\s*outline-color: var\(--primary-dark\) !important;/);
		expect(styles).not.toMatch(/\.cookie-choice[^{]*:focus-visible|outline:\s*none/);
	});
});

// ── Ingen analys före samtycke ────────────────────────────────────────────
// Modulen importeras som i produktion (värdnamnet mittpsyke.se och ett
// mätnings-ID satt), med en minimal falsk DOM som registrerar varje skript
// som läggs till i <head>.

vi.mock('$app/environment', () => ({ browser: true, dev: false }));
vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_GA_MEASUREMENT_ID: 'G-TEST123' } }));

type FakeScript = { id: string; src: string; async: boolean; dataset: Record<string, string>; addEventListener: () => void };

function installFakeBrowser() {
	const store = new Map<string, string>();
	const appended: FakeScript[] = [];
	const events: string[] = [];
	const fakeWindow = {
		location: { hostname: 'mittpsyke.se', pathname: '/', href: 'https://mittpsyke.se/' },
		localStorage: {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => void store.set(key, value),
			removeItem: (key: string) => void store.delete(key)
		},
		dispatchEvent: (event: { type: string }) => {
			events.push(event.type);
			return true;
		}
	} as unknown as Window & { dataLayer?: unknown[] };
	const fakeDocument = {
		cookie: '',
		title: 'MittPsyke',
		referrer: '',
		getElementById: (id: string) => appended.find((script) => script.id === id) ?? null,
		createElement: () =>
			({ id: '', src: '', async: false, dataset: {}, addEventListener: () => {} }) satisfies FakeScript,
		head: { appendChild: (script: FakeScript) => void appended.push(script) }
	};
	vi.stubGlobal('window', fakeWindow);
	vi.stubGlobal('document', fakeDocument);
	vi.stubGlobal('CustomEvent', class {
		constructor(public type: string) {}
	});
	return { appended, fakeWindow, store };
}

describe('ingen analys laddas före samtycke', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('laddar varken Google Analytics eller Ahrefs och skickar inga event utan samtycke', async () => {
		const { appended, fakeWindow } = installFakeBrowser();
		const analytics = await import('$lib/analytics');

		expect(analytics.ANALYTICS_ENABLED).toBe(true);
		expect(await analytics.initializeAnalytics()).toBe(false);
		analytics.trackPageView(new URL('https://mittpsyke.se/'));
		analytics.trackEvent('chat_started');

		expect(appended).toEqual([]);
		expect(fakeWindow.dataLayer ?? []).toEqual([]);
	});

	it('laddar ingenting efter "Bara nödvändiga"', async () => {
		const { appended, store } = installFakeBrowser();
		const consent = await import('$lib/consent');
		const analytics = await import('$lib/analytics');

		consent.declineAnalyticsConsent();
		expect(store.get(consent.ANALYTICS_CONSENT_STORAGE_KEY)).toBe(consent.ANALYTICS_CONSENT_DECLINED);
		expect(await analytics.initializeAnalytics()).toBe(false);
		analytics.trackPageView(new URL('https://mittpsyke.se/'));

		expect(appended).toEqual([]);
	});

	it('laddar skripten först efter "Acceptera analys", med nekat standardsamtycke före', async () => {
		const { appended, fakeWindow } = installFakeBrowser();
		const consent = await import('$lib/consent');
		const analytics = await import('$lib/analytics');

		consent.grantAnalyticsConsent();
		void analytics.initializeAnalytics();

		expect(appended.map((script) => script.src)).toEqual([
			'https://www.googletagmanager.com/gtag/js?id=G-TEST123',
			'https://analytics.ahrefs.com/analytics.js'
		]);
		// Första gtag-anropet är standardsamtycket, där all lagring nekas.
		const [first] = (fakeWindow.dataLayer ?? []) as IArguments[];
		expect(Array.from(first)).toEqual([
			'consent',
			'default',
			{ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }
		]);
	});
});
