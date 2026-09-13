import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	getAnalyticsCampaignFields,
	getAnalyticsLandingPageParams,
	getAnalyticsPageFields,
	getAnalyticsPageTitle,
	sanitizeAnalyticsHref,
	sanitizeAnalyticsPath,
	sanitizeAnalyticsReferrer,
	shouldLoadAhrefs
} from './analytics';
import { consumeDiaryCheckinPrefill, writeDiaryCheckinPrefill } from './diary-draft';

const projectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

function memoryStorage() {
	const values = new Map<string, string>();
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => values.set(key, value),
		removeItem: (key: string) => values.delete(key)
	};
}

describe('privacy-safe navigation and analytics', () => {
	it('hands diary prefill over once without a URL', () => {
		const storage = memoryStorage();
		writeDiaryCheckinPrefill('  Ofarlig testtext  ', storage);
		expect(consumeDiaryCheckinPrefill(storage)).toBe('Ofarlig testtext');
		expect(consumeDiaryCheckinPrefill(storage)).toBe('');
	});

	it('strips query strings and fragments from GA page fields', () => {
		const fields = getAnalyticsPageFields(
			new URL('https://mittpsyke.se/dagbok/checkin?prefill=privat#skriv-sjalv')
		);
		expect(fields).toEqual({
			page_path: '/dagbok/checkin',
			page_location: 'https://mittpsyke.se/dagbok/checkin'
		});
		expect(JSON.stringify(fields)).not.toContain('privat');
	});

	it('strips query strings and fragments from the GA referrer', () => {
		expect(
			sanitizeAnalyticsReferrer('https://mittpsyke.se/sok?q=privat-sokning#traff')
		).toBe('https://mittpsyke.se/sok');
		expect(sanitizeAnalyticsReferrer('')).toBe('');
		expect(sanitizeAnalyticsReferrer('inte-en-url')).toBe('');
	});

	it('sätter en sanerad sidkontext på gtag så dl/dr aldrig bär query eller hash', () => {
		// gtag bifogar annars window.location (med query/hash) som dl på varje
		// event. Söktext och samtals-id fick inte läcka den vägen. Kontexten
		// sätts både före page_view och före vanliga event.
		const analytics = projectFile('./analytics.ts');
		expect(analytics).toContain('function setSanitizedPageContext(');
		expect(analytics).toMatch(/setSanitizedPageContext\(gtag, url\);\s*gtag\('event', 'page_view'/);
		expect(analytics).toMatch(
			/setSanitizedPageContext\(gtag, new URL\(window\.location\.href\)\);\s*gtag\('event', eventName/
		);
		// Kontexten sätter både page_location och page_referrer, och referrern
		// saneras med samma funktion som testas ovan.
		expect(analytics).toMatch(/gtag\('set', \{\s*page_location,\s*page_referrer:/);
		expect(analytics).toContain('sanitizeAnalyticsReferrer(document.referrer)');
	});

	it('bevarar kampanjen som egna GA-fält när sidadressen saneras', () => {
		// Sedan page_location saneras (28d3d478) kom varje kampanjbesök fram som
		// (direct): utm_* försvann ur dl och gtag skickar inga cs/cm/cn själv.
		const url = new URL(
			'https://mittpsyke.se/tiktok?utm_source=tiktok&utm_medium=paid&utm_campaign=host&utm_term=angest&utm_content=video_a&utm_id=42&gclid=KLICKID&q=privat#frag'
		);

		expect(getAnalyticsPageFields(url).page_location).toBe('https://mittpsyke.se/tiktok');
		expect(getAnalyticsCampaignFields(url)).toEqual({
			campaign_source: 'tiktok',
			campaign_medium: 'paid',
			campaign_name: 'host',
			campaign_term: 'angest',
			campaign_content: 'video_a',
			campaign_id: '42'
		});
		// Klick-id, övriga parametrar och fragment följer aldrig med.
		const sent = JSON.stringify(getAnalyticsCampaignFields(url));
		expect(sent).not.toMatch(/KLICKID|privat|frag/);
	});

	it('nollställer kampanjfälten på sidor utan kampanj och släpper inget som liknar e-post', () => {
		// undefined (inte null eller '') är det som får gtag att ta bort ett
		// tidigare satt fält, så landningssidans kampanj inte följer med vidare.
		const empty = getAnalyticsCampaignFields(new URL('https://mittpsyke.se/guider'));
		expect(Object.keys(empty)).toHaveLength(6);
		expect(Object.values(empty).every((value) => value === undefined)).toBe(true);

		const unsafe = getAnalyticsCampaignFields(
			new URL(`https://mittpsyke.se/?utm_source=namn%40example.com&utm_campaign=${'x'.repeat(300)}`)
		);
		expect(unsafe.campaign_source).toBeUndefined();
		expect(unsafe.campaign_name).toHaveLength(100);

		// Fälten sätts i samma 'set' som den sanerade sidkontexten, så även ett
		// event före page_view (chat_open på /chat) bär kampanjen.
		const analytics = projectFile('./analytics.ts');
		expect(analytics).toMatch(
			/gtag\('set', \{\s*page_location,\s*page_referrer:[^}]*\.\.\.getAnalyticsCampaignFields\(url\)\s*\}\)/
		);
	});

	describe('chattens hälsoämne når aldrig GA', () => {
		// /chat/angest bar tidigare en Google Ads-konvertering (ads_conversion_Ångest_1)
		// via en GA4-regel på sökvägen. GA ska bara se att chatten öppnades.
		const TOPIC_SLUGS = ['angest', 'depression', 'tvangstankar', 'stress', 'relationer', 'somn', 'Trauma'];
		const TOPIC_WORDS = /angest|ångest|depression|tvangstankar|tvångstankar|trauma|relationer|somn|sömn/i;
		const CHAT_TITLE = 'Samtalsstöd – chatta anonymt | MittPsyke';

		it('page_view: sökväg och sidadress blir /chat', () => {
			for (const slug of TOPIC_SLUGS) {
				const url = new URL(`https://mittpsyke.se/chat/${slug}?id=1#svar`);
				expect(sanitizeAnalyticsPath(url.pathname)).toBe('/chat');
				expect(getAnalyticsPageFields(url)).toEqual({
					page_path: '/chat',
					page_location: 'https://mittpsyke.se/chat'
				});
			}
		});

		it('referrer: en chattsida som föregående sida blir /chat', () => {
			for (const slug of TOPIC_SLUGS) {
				expect(sanitizeAnalyticsReferrer(`https://mittpsyke.se/chat/${slug}?id=1`)).toBe(
					'https://mittpsyke.se/chat'
				);
			}
		});

		it('sidtitel: dt och page_title bär inte ämnet', () => {
			// /chat/angest heter "Samtalsstöd för ångest – chatta anonymt".
			const topicTitle = 'Samtalsstöd för ångest – chatta anonymt | MittPsyke';
			expect(getAnalyticsPageTitle('/chat/angest', topicTitle)).toBe(CHAT_TITLE);
			expect(getAnalyticsPageTitle('/chat', 'Chatten')).toBe('Chatten');
			expect(getAnalyticsPageTitle('/guider/angest', 'Ångest | MittPsyke')).toBe('Ångest | MittPsyke');
		});

		it('landing_page_view: sökväg och titel saneras', () => {
			for (const slug of TOPIC_SLUGS) {
				const params = getAnalyticsLandingPageParams({
					page_path: `/chat/${slug}`,
					page_title: `Samtalsstöd för ${slug} | MittPsyke`
				});
				expect(params).toEqual({ page_path: '/chat', page_title: CHAT_TITLE });
				expect(JSON.stringify(params)).not.toMatch(TOPIC_WORDS);
			}
		});

		it('internal_link_clicked och home_cta_click: länkmålet blir /chat utan query', () => {
			for (const slug of TOPIC_SLUGS) {
				expect(sanitizeAnalyticsHref(`/chat/${slug}`)).toBe('/chat');
				expect(sanitizeAnalyticsHref(`/chat/${slug}?id=1#svar`)).toBe('/chat');
				expect(sanitizeAnalyticsHref(`https://mittpsyke.se/chat/${slug}`)).toBe('/chat');
				expect(sanitizeAnalyticsHref(`https://www.mittpsyke.se/chat/${slug}`)).toBe('/chat');
			}
			expect(sanitizeAnalyticsHref('/dagbok?action=new')).toBe('/dagbok');
			expect(sanitizeAnalyticsHref('https://stodlinjer.se/akut?x=1')).toBe('https://stodlinjer.se/akut');
		});

		it('lämnar andra sidor orörda, även de som liknar chattens adress', () => {
			expect(sanitizeAnalyticsPath('/chat')).toBe('/chat');
			expect(sanitizeAnalyticsPath('/chatta-anonymt')).toBe('/chatta-anonymt');
			expect(sanitizeAnalyticsPath('/guider/angest')).toBe('/guider/angest');
		});

		it('varje väg in i GA använder saneringen, och inget event bär ämne', () => {
			const analytics = projectFile('./analytics.ts');
			// Eventparametrar: inget topic-fält, inga ämnesbärande eventnamn.
			expect(analytics).not.toMatch(/\btopic\s*:/);
			expect(analytics).not.toMatch(/ai_chat_started_with_topic|ai_topic_shortcut_selected/);
			// dt/dl/dr: den globala sidkontexten sätter sanerad titel, adress och referrer.
			expect(analytics).toMatch(
				/gtag\('set', \{\s*page_location,\s*page_referrer:[^}]*page_title: getAnalyticsPageTitle\(url\.pathname, document\.title\)/
			);
			// page_view, landing_page_view, internal_link_clicked och home_cta_click.
			expect(analytics).toMatch(
				/gtag\('event', 'page_view', \{\s*\.\.\.getAnalyticsPageFields\(url\),\s*page_title: getAnalyticsPageTitle\(url\.pathname, document\.title\)/
			);
			expect(analytics).toContain("trackEvent('landing_page_view', getAnalyticsLandingPageParams(params))");
			expect(analytics).toContain('destination: sanitizeAnalyticsHref(params.destination)');
			expect(analytics).toContain('href: sanitizeAnalyticsHref(params.href)');
		});
	});

	describe('Ahrefs körs aldrig på chattens sidor', () => {
		// Ahrefs-skriptet läser själv adress, titel, referrer och varje länkklick.
		// I produktion fick det /chat/angest som pageview, som x-link-click och som
		// referrer på nästa sida.
		const analytics = projectFile('./analytics.ts');
		const layout = projectFile('../routes/+layout.svelte');

		it('laddas inte på /chat, /chat/angest eller /chat/depression', () => {
			for (const path of ['/chat', '/chat/angest', '/chat/depression', '/chat/tvangstankar', '/Chat/E']) {
				expect(shouldLoadAhrefs(path)).toBe(false);
			}
		});

		it('laddas fortfarande på publika innehållssidor', () => {
			for (const path of ['/', '/guider', '/guider/angest', '/blogg', '/om-mittpsyke', '/chatta-anonymt']) {
				expect(shouldLoadAhrefs(path)).toBe(true);
			}
		});

		it('skriptet laddas bara efter kontroll av sökvägen och utan egna sidvisningar', () => {
			expect(analytics).toMatch(
				/function loadAhrefsScript\(\)[\s\S]*?if \(!shouldLoadAhrefs\(window\.location\.pathname\)\) return[\s\S]*?document\.head\.appendChild\(script\)/
			);
			// Utan data-no-pageview-auto skickar skriptet sidvisningar vid pushState
			// och popstate, även in i chatten.
			expect(analytics).toContain("script.dataset.noPageviewAuto = ''");
			expect(analytics).toMatch(
				/function sendAhrefsPageView\(url: URL\) \{\s*if \(!shouldLoadAhrefs\(url\.pathname\)\) return;/
			);
			expect(analytics).toMatch(/void sendPageView\(url\);\s*sendAhrefsPageView\(url\);/);
		});

		it('en sida där Ahrefs redan körs går till chatten med en hel sidladdning', () => {
			// Länkklick fångas i capture-fasen, före Ahrefs egen klicklyssnare.
			expect(layout).toContain("window.addEventListener('click', handleAhrefsBoundaryClick, true)");
			expect(layout).toContain("window.addEventListener('auxclick', handleAhrefsBoundaryClick, true)");
			expect(layout).toMatch(
				/if \(!needsAhrefsFreeNavigation\(destination\)\) return;\s*event\.preventDefault\(\);/
			);
			// goto(), formulär och bakåt/framåt. Analysen tystas under omladdningen,
			// annars ger bakåt in i chatten dubbla page_view.
			expect(layout).toMatch(
				/beforeNavigate\([\s\S]*?needsAhrefsFreeNavigation\(to\.url\)\) return;\s*markFullNavigationPending\(\);/
			);
			expect(analytics).toMatch(/export function trackPageView[\s\S]*?\|\| fullNavigationPending\) return;/);
			expect(analytics).toMatch(/export function trackEvent[\s\S]*?\|\| fullNavigationPending\) return;/);
		});

		it('chattsidan ger nästa sida bara ursprunget som referrer', () => {
			expect(layout).toMatch(/\{#if isChat\}[\s\S]*?<meta name="referrer" content="strict-origin" \/>/);
		});
	});

	it('keeps search text out of active URLs, caches, and analytics payloads', () => {
		const page = projectFile('../routes/sok/+page.svelte');
		const endpoint = projectFile('../routes/api/search/+server.ts');
		expect(page).toContain("fetch('/api/search', {");
		expect(page).not.toContain('/api/search?q=');
		expect(page).not.toMatch(/trackEvent\([\s\S]{0,160}query:\s*normalizedQuery/);
		expect(endpoint).not.toContain('TtlCache');
		expect(endpoint).toContain("'cache-control': 'no-store'");
	});

	it('does not build sensitive prefill query strings in active routes', () => {
		for (const path of [
			'../routes/checkin/+page.svelte',
			'../routes/dagars-avtryck/checkin/+page.svelte',
			'../routes/spegelvattnet/+page.svelte'
		]) {
			expect(projectFile(path)).not.toMatch(/checkin\?prefill=/);
		}
	});

	it('loads Ahrefs through the consent-gated analytics initializer', () => {
		expect(projectFile('../app.html')).not.toContain('analytics.ahrefs.com/analytics.js');
		const analytics = projectFile('./analytics.ts');
		expect(analytics).toContain('Promise.all([loadGtagScript(), loadAhrefsScript()])');
		expect(analytics).toContain('!hasAnalyticsConsent()');
	});
});

describe('server-owned AI consent boundaries', () => {
	it('gates both Storify provider routes before Anthropic', () => {
		for (const path of [
			'../routes/api/storify/chat/+server.ts',
			'../routes/api/storify/generate/+server.ts'
		]) {
			const source = projectFile(path);
			const consent = source.indexOf('hasStorifyAiConsent(serviceClient, user.id)');
			const provider = source.indexOf("fetch('https://api.anthropic.com/v1/messages'");
			expect(consent).toBeGreaterThan(-1);
			expect(provider).toBeGreaterThan(consent);
			expect(source).not.toMatch(/console\.error\([^\n]*await anthropicResponse\.text\(\)/);
		}
	});

	it('keeps Storify consent separate from diary reflection consent', () => {
		const helper = projectFile('./server/storify-ai-consent.ts');
		const migration = projectFile('../../supabase/migrations/20260905130000_add_storify_ai_consent_scope.sql');
		expect(helper).toContain("STORIFY_AI_CONSENT_SCOPE = 'diary_ai_storify'");
		expect(helper).not.toContain('diary_ai_reflection');
		expect(migration).toContain("'diary_ai_storify'");
	});

	it('gates Spegelvattnet before diary content is loaded', () => {
		const source = projectFile('./server/spegelvattnet.ts');
		const consent = source.indexOf('hasWeeklySummaryAiConsent(supabase, userId)');
		const diaryRead = source.indexOf('await loadPosts(supabase, userId, weekStart)');
		expect(consent).toBeGreaterThan(-1);
		expect(diaryRead).toBeGreaterThan(consent);
	});

	it('does not accept privileged cron secrets from query strings', () => {
		for (const path of [
			'../routes/api/cron/guest-cleanup/+server.ts',
			'../routes/api/cron/reindex-search/+server.ts',
			'../routes/api/cron/spegelvattnet/+server.ts'
		]) {
			expect(projectFile(path)).not.toContain("searchParams.get('secret')");
		}
	});
});
