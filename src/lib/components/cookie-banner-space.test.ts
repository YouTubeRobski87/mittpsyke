import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Cookiebannern är fixerad längst ned och täckte tidigare ConsentGate:s knapp.
// ConsentGate är ingen modal utan vanligt sidinnehåll, så lösningen är att
// bannern reserverar sin egen yta i stället för att enskilda element lyfts
// ovanför den.
//
// Principen som låses här: bannerns höjd mäts vid runtime och konsumeras som
// bottenutrymme av layouten. Inga hårdkodade viewport-värden.

const root = process.cwd();
const banner = readFileSync(join(root, 'src/lib/components/CookieBanner.svelte'), 'utf8');
const appCss = readFileSync(join(root, 'src/app.css'), 'utf8');
const layout = readFileSync(join(root, 'src/routes/+layout.svelte'), 'utf8');
const consentGate = readFileSync(join(root, 'src/lib/components/ConsentGate.svelte'), 'utf8');

const SPACE_VARIABLE = '--cookie-banner-space';

describe('cookiebannern reserverar sin egen yta', () => {
	it('mäter sin renderade höjd med ResizeObserver', () => {
		expect(banner).toContain('ResizeObserver');
		expect(banner).toContain('bind:this={bannerElement}');
		expect(banner).toContain('getBoundingClientRect');
	});

	it('exponerar ytan som en CSS-variabel', () => {
		expect(banner).toContain(SPACE_VARIABLE);
		expect(banner).toContain('setProperty');
	});

	it('tar bort ytan när bannern stängs', () => {
		expect(banner).toContain('removeProperty');
		// Städningen måste ligga i effektens teardown, annars blir utrymmet kvar.
		const effectBody = banner.slice(banner.indexOf('const observer = new ResizeObserver'));
		expect(effectBody).toContain('observer.disconnect()');
		expect(effectBody).toContain('clearBannerSpace()');
	});

	it('hårdkodar ingen bannerhöjd', () => {
		// 253/266 px och liknande var de uppmätta värdena vid felsökningen och
		// får aldrig bakas in - höjden beror på textbrytning och språk.
		const code = banner
			.split('\n')
			.filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
			.join('\n');

		expect(code).not.toMatch(/\b(2[0-9]{2}|1[0-9]{2})px\b/);
	});

	it('variabeln har ett neutralt standardvärde', () => {
		expect(appCss).toMatch(new RegExp(`${SPACE_VARIABLE}:\\s*0px`));
	});
});

describe('layouten konsumerar ytan', () => {
	it('sidskalet får bottenutrymme, utom i chatten som är höjdlåst', () => {
		expect(layout).toContain('class="app-shell"');
		expect(appCss).toMatch(
			new RegExp(`\\.app-shell:not\\(\\.is-chat-page\\)\\s*\\{[^}]*padding-bottom:\\s*var\\(${SPACE_VARIABLE}\\)`)
		);
	});

	it('chattens inre scrollcontainer får samma yta', () => {
		// ConsentGate ligger i .chat-input-extras. Ytan måste hamna där, inte på
		// .chat-input-area, som bär Tailwind-utilities som vinner över klassregeln.
		expect(appCss).toMatch(
			new RegExp(`\\.chat-input-extras\\s*\\{[^}]*padding-bottom:\\s*var\\(${SPACE_VARIABLE}\\)`)
		);
	});

	it('safe-area behålls i chattens inmatningsyta', () => {
		expect(appCss).toContain('env(safe-area-inset-bottom)');
	});
});

describe('avgränsningar', () => {
	it('ConsentGate är fortfarande ingen modal och lyfts inte över bannern', () => {
		expect(consentGate).toContain('z-[1]');
		expect(consentGate).not.toContain('position: fixed');
		// Ingen z-index-kapplöpning mot bannerns z-50.
		expect(consentGate).not.toMatch(/z-\[?(5[0-9]|[6-9][0-9]|[0-9]{3,})\]?/);
	});

	it('bannerns samtyckesfunktion är orörd', () => {
		expect(banner).toContain('grantAnalyticsConsent');
		expect(banner).toContain('declineAnalyticsConsent');
		expect(banner).toContain('Acceptera analys');
		expect(banner).toContain('Bara nödvändiga');
	});

	it('inget automatiskt cookieval', () => {
		// Bannern får bara stängas av användarens egna knappar.
		const autoAccept = /\$effect[\s\S]{0,400}?(grantAnalyticsConsent|declineAnalyticsConsent)\(/;
		expect(banner).not.toMatch(autoAccept);
	});

	it('de två samtyckena hålls isär', () => {
		// Bannern vet ingenting om hälso-/AI-samtycke.
		expect(banner).not.toMatch(/healthConsent|chat-ai|diary_ai|user_ai_consents/i);
	});
});
